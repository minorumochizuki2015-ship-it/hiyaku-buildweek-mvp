import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { NutritionReport } from '../../shared/nutrition'
import { formatJourneyDistance, formatJourneyDuration, GozenLedgerScreen } from './GozenLedgerScreen'

const report: NutritionReport = {
  description: 'Courier bowl',
  amountGrams: 200,
  productName: 'Rice bowl',
  source: 'hybrid',
  foodScore: 82,
  nutrients: [
    { key: 'energy', amount: 688, source: 'open-food-facts', judgment: 'OK' },
    { key: 'protein', amount: 24.1, source: 'open-food-facts', judgment: 'OK' },
    { key: 'fat', amount: 12.9, source: 'deterministic-fallback', judgment: 'Low' },
    { key: 'carbohydrates', amount: 71.5, source: 'open-food-facts', judgment: 'OK' },
    { key: 'fiber', amount: 4.2, source: 'gpt-5.6-sol', judgment: 'Low' },
    { key: 'sodium', amount: 0.74, source: 'gpt-5.6-sol', judgment: 'OK' },
  ],
}

describe('GozenLedgerScreen', () => {
  it('renders the supplied food score, real journey distance, and duration', () => {
    const screen = renderToStaticMarkup(<GozenLedgerScreen report={report} distanceMetres={1200} elapsedSeconds={95} locale="ja" />)

    expect(screen).toContain('82')
    expect(screen).toContain('距離')
    expect(screen).toContain('1.2 km')
    expect(screen).toContain('所要時間')
    expect(screen).toContain('1:35')
  })

  it('derives achieved nutrients and mixed sources from the report nutrients', () => {
    const screen = renderToStaticMarkup(<GozenLedgerScreen report={report} distanceMetres={840} elapsedSeconds={25} locale="ja" />)

    expect(screen).toContain('4 / 6')
    expect(screen).toContain('複合ソース')
    expect(screen).toContain('整え札')
  })

  it('switches every visible label between Japanese and English', () => {
    const japanese = renderToStaticMarkup(<GozenLedgerScreen report={report} distanceMetres={840} elapsedSeconds={25} locale="ja" />)
    const english = renderToStaticMarkup(<GozenLedgerScreen report={report} distanceMetres={840} elapsedSeconds={25} locale="en" />)

    expect(japanese).toContain('御膳帳 Premium')
    expect(japanese).toContain('今日の食事スコア')
    expect(english).toContain('Premium Meal Ledger')
    expect(english).toContain('Today’s meal score')
    expect(english).toContain('Distance')
    expect(english).toContain('Duration')
    expect(english).not.toContain('御膳帳 Premium')
  })

  it('formats recorded values and uses em dashes when no journey exists', () => {
    expect(formatJourneyDistance(840, 'en')).toBe('840 m')
    expect(formatJourneyDistance(1200, 'en')).toBe('1.2 km')
    expect(formatJourneyDuration(65)).toBe('1:05')
    expect(formatJourneyDuration(3665)).toBe('1:01')

    const screen = renderToStaticMarkup(<GozenLedgerScreen report={report} locale="ja" />)
    expect(screen).toContain('距離</dt><dd>—</dd>')
    expect(screen).toContain('所要時間</dt><dd>—</dd>')
    expect(screen).not.toContain('歩数')
    expect(screen).not.toContain('kcal')
  })
})
