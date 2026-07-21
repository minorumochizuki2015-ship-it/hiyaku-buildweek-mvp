import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { NutritionReport } from '../../shared/nutrition'
import { TownDeliveryScreen } from './TownDeliveryScreen'

const report: NutritionReport = {
  description: 'Test courier bowl',
  amountGrams: 200,
  productName: null,
  source: 'deterministic-fallback',
  foodScore: 50,
  nutrients: [
    { key: 'energy', amount: 350, source: 'deterministic-fallback', judgment: 'Low' },
    { key: 'protein', amount: 30, source: 'deterministic-fallback', judgment: 'OK' },
    { key: 'fat', amount: 20, source: 'deterministic-fallback', judgment: 'High' },
    { key: 'carbohydrates', amount: 70, source: 'deterministic-fallback', judgment: 'OK' },
    { key: 'fiber', amount: 7, source: 'deterministic-fallback', judgment: 'Low' },
    { key: 'sodium', amount: 0.8, source: 'deterministic-fallback', judgment: 'OK' },
  ],
}

describe('TownDeliveryScreen', () => {
  it('renders the canonical typed nutrient values and town-effect mapping', () => {
    const screen = renderToStaticMarkup(<TownDeliveryScreen report={report} locale="en" />)

    expect(screen).toContain('Protein, 30g, Met')
    expect(screen).toContain('Micros, 0.8g, Met')
    expect(screen).toContain('Courier dojo vitality')
    expect(screen).toContain('Food hall menu options')
    expect(screen).toContain('Merchant reputation')
  })

  it('only grants a small town effect to nutrients with an OK judgment', () => {
    const screen = renderToStaticMarkup(<TownDeliveryScreen report={report} locale="en" />)

    expect((screen.match(/\+ Small/g) ?? [])).toHaveLength(3)
    expect((screen.match(/aria-label="Increase">↑/g) ?? [])).toHaveLength(2)
    expect((screen.match(/aria-label="No increase">—/g) ?? [])).toHaveLength(2)
  })

  it('shows zero town-summary increases when every nutrient judgment is Low', () => {
    const lowReport: NutritionReport = {
      ...report,
      nutrients: report.nutrients.map((nutrient) => ({ ...nutrient, judgment: 'Low' })),
    }
    const screen = renderToStaticMarkup(<TownDeliveryScreen report={lowReport} locale="en" />)

    expect((screen.match(/aria-label="Increase">↑/g) ?? [])).toHaveLength(0)
    expect((screen.match(/aria-label="No increase">—/g) ?? [])).toHaveLength(4)
  })

  it('switches all visible copy from English to Japanese', () => {
    const english = renderToStaticMarkup(<TownDeliveryScreen report={report} locale="en" />)
    const japanese = renderToStaticMarkup(<TownDeliveryScreen report={report} locale="ja" />)

    expect(english).toContain('Today’s meal has reached the town')
    expect(english).not.toContain('今日の食事が町に届きました')
    expect(japanese).toContain('今日の食事が町に届きました')
    expect(japanese).toContain('飛脚道場の活気')
    expect(japanese).not.toContain('Today’s meal has reached the town')
  })

  it('uses the required town background asset path', () => {
    const screen = renderToStaticMarkup(<TownDeliveryScreen report={report} locale="ja" />)

    expect(screen).toContain('src="/assets/bg-town-night-street.png"')
  })
})
