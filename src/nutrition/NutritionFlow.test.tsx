import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { foodScoreFor, judgeGap, NUTRIENT_DEFINITIONS, perMealReferenceValue, type NutrientKey, type NutritionReport } from '../../shared/nutrition'
import { GozenLedgerScreen } from './GozenLedgerScreen'
import {
  achievementModeFor,
  achievementSeenReducer,
  foodHallDeltasForReport,
  localNutritionReport,
  nutritionFlowReducer,
  requestNutritionWithFallback,
} from './NutritionFlow'

const report: NutritionReport = {
  description: 'onigiri',
  amountGrams: 100,
  productName: 'Onigiri',
  source: 'open-food-facts',
  foodScore: 62,
  nutrients: [
    { key: 'energy', amount: 400, source: 'open-food-facts', judgment: 'OK' },
    { key: 'protein', amount: 6, source: 'open-food-facts', judgment: 'Low' },
    { key: 'fat', amount: 4, source: 'open-food-facts', judgment: 'Low' },
    { key: 'carbohydrates', amount: 65, source: 'open-food-facts', judgment: 'OK' },
    { key: 'fiber', amount: 2, source: 'open-food-facts', judgment: 'Low' },
    { key: 'sodium', amount: 0.7, source: 'open-food-facts', judgment: 'OK' },
  ],
}

describe('NutritionFlow', () => {
  it('advances through all four report screens', () => {
    let state = nutritionFlowReducer({ step: 1, standard: 'japan' }, { type: 'reset' })

    state = nutritionFlowReducer(state, { type: 'next' })
    expect(state.step).toBe(2)
    state = nutritionFlowReducer(state, { type: 'next' })
    expect(state.step).toBe(3)
    state = nutritionFlowReducer(state, { type: 'next' })
    expect(state.step).toBe(4)
  })

  it('returns to the previous screen with the back control action', () => {
    const state = nutritionFlowReducer({ step: 3, standard: 'japan' }, { type: 'previous' })

    expect(state.step).toBe(2)
  })

  it('propagates a changed comparison standard through flow state', () => {
    const state = nutritionFlowReducer({ step: 2, standard: 'japan' }, { type: 'setStandard', standard: 'eu' })

    expect(state.standard).toBe('eu')
    expect(state.step).toBe(2)
  })

  it('uses video only for the first meal celebration in a session, including a poor meal', () => {
    expect(achievementModeFor(report, false)).toBe('video')
    expect(achievementModeFor({
      ...report,
      foodScore: 0,
      nutrients: report.nutrients.map((nutrient) => ({ ...nutrient, judgment: 'Low' as const })),
    }, false)).toBe('video')
    expect(achievementModeFor(report, true)).toBe('light')
  })

  it('reopens the delivery presentation for another report after the previous one completes', () => {
    let seen = achievementSeenReducer(false, { type: 'sceneComplete' })
    expect(seen).toBe(true)

    // Stepping back through the report leaves the completed scene completed.
    seen = achievementSeenReducer(seen, { type: 'sceneComplete' })
    expect(seen).toBe(true)

    seen = achievementSeenReducer(seen, { type: 'reportProduced' })
    expect(seen).toBe(false)
  })

  it('reports only the model-derived food-hall change from the submitted report', () => {
    expect(foodHallDeltasForReport(report, 0, 'en')).toEqual([{ key: 'food-hall-energy', label: 'Food hall', delta: '+62' }])
    expect(foodHallDeltasForReport(report, 62, 'ja')).toEqual([])
  })

  it('uses the Worker-equivalent deterministic report when the nutrition request fails', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError('Worker unavailable'))
    vi.stubGlobal('fetch', fetchMock)
    try {
      const fallback = localNutritionReport('onigiri', 200, 'en')
      const report = await requestNutritionWithFallback('onigiri', 200, 'en')
      const screen = renderToStaticMarkup(<GozenLedgerScreen report={report} locale="en" />)

      expect(fetchMock).toHaveBeenCalledWith('/api/nutrition', expect.objectContaining({ method: 'POST', signal: expect.any(AbortSignal) }))
      expect(report).toEqual(fallback)
      expect(report.source).toBe('deterministic-fallback')
      expect(report.nutrients).toEqual([
        { key: 'energy', amount: 300, source: 'deterministic-fallback', judgment: 'OK' },
        { key: 'protein', amount: 12, source: 'deterministic-fallback', judgment: 'OK' },
        { key: 'fat', amount: 10, source: 'deterministic-fallback', judgment: 'OK' },
        { key: 'carbohydrates', amount: 40, source: 'deterministic-fallback', judgment: 'OK' },
        { key: 'fiber', amount: 6, source: 'deterministic-fallback', judgment: 'OK' },
        { key: 'sodium', amount: 0.5, source: 'deterministic-fallback', judgment: 'OK' },
      ])
      const amounts = Object.fromEntries(report.nutrients.map((nutrient) => [nutrient.key, nutrient.amount])) as Record<NutrientKey, number>
      expect(report.foodScore).toBe(62)
      expect(report.foodScore).toBe(foodScoreFor(amounts))
      expect(report.nutrients.map((nutrient) => nutrient.judgment)).toEqual(
        NUTRIENT_DEFINITIONS.map((definition) => judgeGap(amounts[definition.key], perMealReferenceValue(definition, 'japan'))),
      )
      expect(screen).toContain('Offline demo — nutrition estimated locally')
      expect(localNutritionReport('onigiri', 200, 'ja').aiAttempt).toEqual({ status: 'failed', estimatedCount: 0, reason: 'オフラインのデモ表示 — 栄養値は端末内で推定しています' })
    } finally {
      vi.unstubAllGlobals()
    }
  })
})
