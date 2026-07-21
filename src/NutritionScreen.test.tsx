import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { NutritionReport } from '../shared/nutrition'
import { NutritionScreen } from './NutritionScreen'

const report: NutritionReport = {
  description: 'Test courier bowl',
  amountGrams: 200,
  productName: null,
  source: 'deterministic-fallback',
  foodScore: 50,
  nutrients: [
    { key: 'energy', amount: 350, source: 'deterministic-fallback', judgment: 'Low' },
    { key: 'protein', amount: 30, source: 'deterministic-fallback', judgment: 'High' },
    { key: 'fat', amount: 20, source: 'deterministic-fallback', judgment: 'OK' },
    { key: 'carbohydrates', amount: 70, source: 'deterministic-fallback', judgment: 'OK' },
    { key: 'fiber', amount: 7, source: 'deterministic-fallback', judgment: 'OK' },
    { key: 'sodium', amount: 0.8, source: 'deterministic-fallback', judgment: 'OK' },
  ],
}

function barWithPercentage(nutrient: string, percentage: number): RegExp {
  return new RegExp(`<span(?=[^>]*data-testid="nutrient-bar-${nutrient}")(?=[^>]*data-bar-percent="${percentage}")(?=[^>]*width:${percentage}%)[^>]*>`)
}

describe('NutritionScreen', () => {
  it('renders ratio-based bars with the expected relative widths', () => {
    const screen = renderToStaticMarkup(<NutritionScreen initialReport={report} onBack={() => undefined} />)

    // 350/700 is 50%; 30/20 is 150% and therefore reaches the specified visual cap.
    expect(screen).toMatch(barWithPercentage('energy', 50))
    expect(screen).toMatch(barWithPercentage('protein', 150))
    expect(screen).toContain('Meal radar')
    expect(screen).toContain('Food Hall energy')
    expect(screen).toContain('Micros')
    expect(screen).toContain('Sodium-only micros proxy')
  })

  it('changes a displayed nutrient judgment when the selected standard changes', () => {
    const japan = renderToStaticMarkup(<NutritionScreen initialReport={report} initialStandard="japan" onBack={() => undefined} />)
    const fda = renderToStaticMarkup(<NutritionScreen initialReport={report} initialStandard="fda" onBack={() => undefined} />)

    // 20g fat is within Japan's 18g meal range but below FDA's 26g meal crosswalk.
    expect(japan).toMatch(/<em[^>]*data-testid="nutrient-judgment-fat"[^>]*>OK<\/em>/)
    expect(fda).toMatch(/<em[^>]*data-testid="nutrient-judgment-fat"[^>]*>Low<\/em>/)
  })
})
