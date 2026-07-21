import { describe, expect, it } from 'vitest'
import {
  assignNarrator,
  calculateActivityScores,
  dominantActivity,
  runScore,
  strengthScore,
  toGameResources,
  totalScore,
} from '../shared/activity'

describe('activity scoring', () => {
  it('calculates independent sub-scores and an equal-weighted total', () => {
    expect(strengthScore({ exerciseType: 'squats', reps: 10, sets: 3, targetReps: 40 })).toBe(75)
    expect(runScore({ distanceMetres: 600, targetDistanceMetres: 800 })).toBe(75)

    // By hand: round((food 60 + strength 90 + run 30) / 3) = round(180 / 3) = 60.
    expect(totalScore(60, 90, 30)).toBe(60)
  })

  it('treats absent activities as zero and clamps a perfect day to 100', () => {
    expect(strengthScore(undefined)).toBe(0)
    expect(runScore(null)).toBe(0)
    expect(calculateActivityScores(100, { exerciseType: 'push-ups', reps: 20, sets: 5, targetReps: 100 }, { distanceMetres: 1_000, targetDistanceMetres: 1_000 })).toEqual({ food: 100, strength: 100, run: 100 })
    expect(totalScore(100, 100, 100)).toBe(100)
  })

  it('uses run, then strength, then food as its dominant-activity tie-break order', () => {
    expect(dominantActivity({ food: 80, strength: 80, run: 10 })).toBe('strength')
    expect(dominantActivity({ food: 80, strength: 80, run: 80 })).toBe('run')
    expect(assignNarrator({ food: 80, strength: 80, run: 80 }, 'same-day-summary')).toMatch(/^(tadataka|yoichi)$/)
  })

  it('assigns an all-zero day to a deterministic run narrator', () => {
    const scores = { food: 0, strength: 0, run: 0 }
    const firstAssignment = assignNarrator(scores, 'zero-day')

    expect(firstAssignment).toMatch(/^(tadataka|yoichi)$/)
    expect(assignNarrator(scores, 'zero-day')).toBe(firstAssignment)
    expect(totalScore(scores.food, scores.strength, scores.run)).toBe(0)
  })

  it('converts each sub-score directly into its current game resource', () => {
    expect(toGameResources({ food: 40, strength: 70, run: 90 })).toEqual({
      foodHallEnergy: 40,
      dojoMight: 70,
      courierFlagPower: 90,
    })
  })
})
