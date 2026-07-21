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
  movementMode: 'demo',
}

describe('RecordBookScreen', () => {
  it('renders an empty session plainly without placeholder rows', () => {
    const screen = renderToStaticMarkup(<RecordBookScreen runs={[]} meals={[]} locale="en" onOpenGoyo={vi.fn()} />)

    expect(screen).toContain('No entries yet. Accept a goyo to begin.')
    expect(screen).toContain('Accept a Goyo')
    expect(screen).not.toContain('record-book__entry')
    expect(screen).not.toContain('Courier runs recorded.')
  })

  it('marks a demo run and total as simulated while preserving its recorded values', () => {
    const screen = renderToStaticMarkup(<RecordBookScreen runs={[run]} meals={[meal]} locale="en" onOpenGoyo={vi.fn()} />)

    expect((screen.match(/record-book__entry/g) ?? [])).toHaveLength(2)
    for (const value of ['the Lantern Dispatch', '845 m', '2:05', 'Edo Roadrunner', 'onigiri', 'Salmon Onigiri', '120 g', '74', '4 nutrients', '2 nutrients']) expect(screen).toContain(value)
    expect((screen.match(/SIMULATED/g) ?? [])).toHaveLength(2)
    expect(screen).not.toContain('coming soon')
  })

  it('does not add a simulated marker to a real-walk run, while a mixed session preserves the demo marker', () => {
    const realRun: RecordBookRun = { ...run, title: 'the Dawn Reply', distanceMetres: 620, movementMode: 'walk' }
    const realOnly = renderToStaticMarkup(<RecordBookScreen runs={[realRun]} meals={[]} locale="en" onOpenGoyo={vi.fn()} />)
    const mixed = renderToStaticMarkup(<RecordBookScreen runs={[run, realRun]} meals={[]} locale="en" onOpenGoyo={vi.fn()} />)

    expect(realOnly).not.toContain('SIMULATED')
    expect((mixed.match(/SIMULATED/g) ?? [])).toHaveLength(2)
    expect(mixed).toContain('the Lantern Dispatch')
    expect(mixed).toContain('the Dawn Reply')
    expect(mixed).toContain('the Dawn Reply</h3><dl')
    expect(mixed).toContain('the Lantern Dispatch</h3><span class="record-book__mode-tag">SIMULATED</span>')
  })

  it('renders the simulated disclosure in Japanese', () => {
    const screen = renderToStaticMarkup(<RecordBookScreen runs={[run]} meals={[]} locale="ja" onOpenGoyo={vi.fn()} />)

    expect(screen).toContain('シミュレーション')
  })
})
