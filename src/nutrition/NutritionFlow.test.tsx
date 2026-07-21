import { describe, expect, it } from 'vitest'
import { nutritionFlowReducer } from './NutritionFlow'

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
})
