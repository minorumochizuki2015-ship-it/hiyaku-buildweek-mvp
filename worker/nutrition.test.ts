import { afterEach, describe, expect, it, vi } from 'vitest'

import { contributionPercent, isNutritionReport, NUTRIENT_DEFINITIONS, perMealReferenceValue, type NutrientKey } from '../shared/nutrition'
import { buildNutritionReport, foodScoreFor, judgeGap } from './nutrition'

type Amounts = Record<NutrientKey, number>

const foods: ReadonlyArray<{ name: string; amounts: Amounts }> = [
  { name: 'onigiri', amounts: { energy: 320, protein: 5, fat: 1, carbohydrates: 74, fiber: 1, sodium: 0.7 } },
  { name: '200 g plain tofu', amounts: { energy: 302, protein: 34, fat: 18, carbohydrates: 5.2, fiber: 2.8, sodium: 0.04 } },
  { name: 'grilled salmon', amounts: { energy: 250, protein: 27, fat: 15, carbohydrates: 0, fiber: 0, sodium: 0.08 } },
  { name: 'miso soup', amounts: { energy: 40, protein: 3, fat: 1.5, carbohydrates: 5, fiber: 1, sodium: 1 } },
  { name: 'Kit Kat', amounts: { energy: 230, protein: 3, fat: 12, carbohydrates: 28, fiber: 1, sodium: 0.12 } },
  { name: 'Coca-Cola', amounts: { energy: 225, protein: 0, fat: 0, carbohydrates: 56, fiber: 0, sodium: 0.02 } },
]

const balancedMealGuide: Amounts = Object.fromEntries(
  NUTRIENT_DEFINITIONS.map((nutrient) => [
    nutrient.key,
    perMealReferenceValue(nutrient, 'japan'),
  ]),
) as Amounts

function openFoodFactsMiss(): Response {
  return new Response(JSON.stringify({ page_count: 0, products: [] }), { status: 200 })
}

function validAiResponse(): Response {
  const nutrients = NUTRIENT_DEFINITIONS.map((nutrient, index) => ({ key: nutrient.key, amount: index + 1 }))
  return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ nutrients }) } }] }), { status: 200 })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('nutrition scoring', () => {
  it('uses meal-scale references and only flags a genuinely notable amount', () => {
    const energy = NUTRIENT_DEFINITIONS[0]!
    const singleItemReference = perMealReferenceValue(energy, 'japan')

    expect(singleItemReference).toBe(700)
    expect(judgeGap(singleItemReference * 0.84, singleItemReference)).toBe('OK')
    expect(judgeGap(singleItemReference * 1.7, singleItemReference)).toBe('OK')
    expect(judgeGap(singleItemReference * 2.01, singleItemReference)).toBe('High')
  })

  it('treats the live 200 g tofu record as contributions, not deficiencies or protein excess', () => {
    const tofu = foods.find(({ name }) => name === '200 g plain tofu')!.amounts
    const proteinGuide = perMealReferenceValue(NUTRIENT_DEFINITIONS.find(({ key }) => key === 'protein')!, 'japan')

    expect(contributionPercent(tofu.protein, proteinGuide)).toBe(170)
    expect(judgeGap(tofu.protein, proteinGuide)).not.toBe('High')
    expect(NUTRIENT_DEFINITIONS.map((nutrient) => judgeGap(tofu[nutrient.key], perMealReferenceValue(nutrient, 'japan')))).not.toContain('Low')
  })

  it('keeps real onigiri and grilled-salmon records as item contributions', () => {
    const foodsToCheck = ['onigiri', 'grilled salmon'] as const

    for (const name of foodsToCheck) {
      const amounts = foods.find((food) => food.name === name)!.amounts
      const outcomes = NUTRIENT_DEFINITIONS.map((nutrient) => judgeGap(amounts[nutrient.key], perMealReferenceValue(nutrient, 'japan')))
      expect(outcomes).not.toContain('Low')
      expect(outcomes).not.toContain('High')
    }
  })

  it('gives the measured food fixtures visibly different scores', () => {
    const scores = foods.map(({ name, amounts }) => ({ name, score: foodScoreFor(amounts) }))

    expect(scores).toEqual([
      { name: 'onigiri', score: 32 },
      { name: '200 g plain tofu', score: 64 },
      { name: 'grilled salmon', score: 50 },
      { name: 'miso soup', score: 12 },
      { name: 'Kit Kat', score: 26 },
      { name: 'Coca-Cola', score: 14 },
    ])
    expect(new Set(scores.map(({ score }) => score)).size).toBe(scores.length)
    expect(foodScoreFor(balancedMealGuide)).toBe(100)
    expect(foodScoreFor(balancedMealGuide)).toBeGreaterThan(
      scores.find(({ name }) => name === 'Coca-Cola')!.score,
    )
  })
})

describe('nutrition AI attempt reporting', () => {
  it('reports that AI was skipped when no API key is configured', async () => {
    const fetchMock = vi.fn().mockResolvedValue(openFoodFactsMiss())
    vi.stubGlobal('fetch', fetchMock)

    const report = await buildNutritionReport({ description: 'unlisted meal', amountGrams: 100 }, {})

    expect(report.aiAttempt).toEqual({ status: 'skipped-no-api-key', estimatedCount: 0 })
    expect(report.nutrients.every((nutrient) => nutrient.source === 'deterministic-fallback')).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('reports an AI HTTP failure and keeps deterministic fallback values honest', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(openFoodFactsMiss())
      .mockResolvedValue(new Response('', { status: 400 }))
    vi.stubGlobal('fetch', fetchMock)

    const report = await buildNutritionReport({ description: 'unlisted meal', amountGrams: 100 }, { OPENAI_API_KEY: 'test-key' })

    expect(report.aiAttempt).toEqual({ status: 'failed', estimatedCount: 0, reason: 'HTTP 400' })
    expect(report.nutrients.every((nutrient) => nutrient.source === 'deterministic-fallback')).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('reports AI success only when validated values supply every missing nutrient', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(openFoodFactsMiss())
      .mockResolvedValueOnce(validAiResponse())
    vi.stubGlobal('fetch', fetchMock)

    const report = await buildNutritionReport({ description: 'unlisted meal', amountGrams: 100 }, { OPENAI_API_KEY: 'test-key' })
    const requestBody = JSON.parse(String((fetchMock.mock.calls[1]![1] as RequestInit).body)) as Record<string, unknown>
    const schema = JSON.stringify((requestBody.response_format as { json_schema: { schema: unknown } }).json_schema.schema)

    expect(report.aiAttempt).toEqual({ status: 'succeeded', estimatedCount: NUTRIENT_DEFINITIONS.length })
    expect(report.nutrients.every((nutrient) => nutrient.source === 'gpt-5.6-sol')).toBe(true)
    expect(schema).not.toContain('minItems')
    expect(schema).not.toContain('maxItems')
    expect(schema).not.toContain('minimum')
  })

  it('accepts an older nutrition report without AI attempt status', () => {
    const legacyReport = {
      description: 'Legacy meal',
      amountGrams: 100,
      productName: null,
      source: 'deterministic-fallback',
      foodScore: 50,
      nutrients: NUTRIENT_DEFINITIONS.map((nutrient) => ({
        key: nutrient.key,
        amount: 1,
        source: 'deterministic-fallback',
        judgment: 'Low',
      })),
    }

    expect(isNutritionReport(legacyReport)).toBe(true)
  })
})
