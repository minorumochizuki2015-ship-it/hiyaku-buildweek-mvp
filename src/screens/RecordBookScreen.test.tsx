import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { RecordBookScreen, type RecordBookRun } from './RecordBookScreen'
import type { NutritionReport } from '../../shared/nutrition'

const meal: NutritionReport = {
  description: 'onigiri',
  amountGrams: 120,
  productName: 'Salmon Onigiri',
  source: 'hybrid',
  foodScore: 74,
  nutrients: [
    { key: 'energy', amount: 210, source: 'open-food-facts', judgment: 'OK' },
    { key: 'protein', amount: 5, source: 'open-food-facts', judgment: 'Low' },
    { key: 'fat', amount: 3, source: 'gpt-5.6-sol', judgment: 'Low' },
    { key: 'carbohydrates', amount: 42, source: 'open-food-facts', judgment: 'Low' },
    { key: 'fiber', amount: 1, source: 'deterministic-fallback', judgment: 'Low' },
    { key: 'sodium', amount: 0.6, source: 'open-food-facts', judgment: 'OK' },
  ],
}

const run: RecordBookRun = {
  title: 'the Lantern Dispatch',
  distanceMetres: 845,
  durationSeconds: 125,
  rank: 'Edo Roadrunner',
}

describe('RecordBookScreen', () => {
  it('renders an empty session plainly without placeholder rows', () => {
    const screen = renderToStaticMarkup(<RecordBookScreen runs={[]} meals={[]} locale="en" onOpenGoyo={vi.fn()} />)

    expect(screen).toContain('No entries yet. Accept a goyo to begin.')
    expect(screen).toContain('Accept a Goyo')
    expect(screen).not.toContain('record-book__entry')
    expect(screen).not.toContain('Courier runs recorded.')
  })

  it('renders exactly one real run and meal with their recorded values', () => {
    const screen = renderToStaticMarkup(<RecordBookScreen runs={[run]} meals={[meal]} locale="en" onOpenGoyo={vi.fn()} />)

    expect((screen.match(/record-book__entry/g) ?? [])).toHaveLength(2)
    for (const value of ['the Lantern Dispatch', '845 m', '2:05', 'Edo Roadrunner', 'onigiri', 'Salmon Onigiri', '120 g', '74', '4 nutrients', '2 nutrients']) expect(screen).toContain(value)
    expect(screen).not.toContain('coming soon')
  })
})
