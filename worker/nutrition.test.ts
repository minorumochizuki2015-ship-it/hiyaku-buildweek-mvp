import { describe, expect, it } from 'vitest'

import { NUTRIENT_DEFINITIONS, SINGLE_ITEM_DAILY_REFERENCE_FRACTION, type NutrientKey } from '../shared/nutrition'
import { foodScoreFor, judgeGap } from './nutrition'

type Amounts = Record<NutrientKey, number>

const foods: ReadonlyArray<{ name: string; amounts: Amounts }> = [
  { name: 'onigiri', amounts: { energy: 320, protein: 5, fat: 1, carbohydrates: 74, fiber: 1, sodium: 0.7 } },
  { name: 'tofu', amounts: { energy: 114, protein: 12, fat: 7.2, carbohydrates: 2.9, fiber: 0.5, sodium: 0.015 } },
  { name: 'grilled salmon', amounts: { energy: 250, protein: 27, fat: 15, carbohydrates: 0, fiber: 0, sodium: 0.08 } },
  { name: 'miso soup', amounts: { energy: 40, protein: 3, fat: 1.5, carbohydrates: 5, fiber: 1, sodium: 1 } },
  { name: 'Kit Kat', amounts: { energy: 230, protein: 3, fat: 12, carbohydrates: 28, fiber: 1, sodium: 0.12 } },
  { name: 'Coca-Cola', amounts: { energy: 225, protein: 0, fat: 0, carbohydrates: 56, fiber: 0, sodium: 0.02 } },
]

const balancedSingleItem: Amounts = Object.fromEntries(
  NUTRIENT_DEFINITIONS.map((nutrient) => [
    nutrient.key,
    nutrient.referenceValue * SINGLE_ITEM_DAILY_REFERENCE_FRACTION,
  ]),
) as Amounts

describe('nutrition scoring', () => {
  it('uses the single-item reference for the status pills', () => {
    const energy = NUTRIENT_DEFINITIONS[0]!
    const singleItemReference = energy.referenceValue * SINGLE_ITEM_DAILY_REFERENCE_FRACTION

    expect(judgeGap(singleItemReference, energy.referenceValue)).toBe('OK')
    expect(judgeGap(singleItemReference * 0.84, energy.referenceValue)).toBe('Low')
    expect(judgeGap(singleItemReference * 1.16, energy.referenceValue)).toBe('High')
  })

  it('gives the measured food fixtures visibly different scores', () => {
    const scores = foods.map(({ name, amounts }) => ({ name, score: foodScoreFor(amounts) }))

    expect(scores).toEqual([
      { name: 'onigiri', score: 43 },
      { name: 'tofu', score: 44 },
      { name: 'grilled salmon', score: 26 },
      { name: 'miso soup', score: 30 },
      { name: 'Kit Kat', score: 67 },
      { name: 'Coca-Cola', score: 23 },
    ])
    expect(new Set(scores.map(({ score }) => score)).size).toBe(scores.length)
    expect(foodScoreFor(balancedSingleItem)).toBe(100)
    expect(foodScoreFor(balancedSingleItem)).toBeGreaterThan(
      scores.find(({ name }) => name === 'Coca-Cola')!.score,
    )
  })
})
