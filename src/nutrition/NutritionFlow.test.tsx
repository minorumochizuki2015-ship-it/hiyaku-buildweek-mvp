import { describe, expect, it } from 'vitest'
import type { NutritionReport } from '../../shared/nutrition'
import {
  achievementModeFor,
  achievementSeenReducer,
  foodHallDeltasForReport,
  nutritionFlowReducer,
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

  it('uses video for every successfully produced report, including a poor meal', () => {
    expect(achievementModeFor(report)).toBe('video')
    expect(achievementModeFor({
      ...report,
      foodScore: 0,
      nutrients: report.nutrients.map((nutrient) => ({ ...nutrient, judgment: 'Low' as const })),
    })).toBe('video')
  })

  it('does not replay the scene after it has completed, until another meal report is produced', () => {
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
})
