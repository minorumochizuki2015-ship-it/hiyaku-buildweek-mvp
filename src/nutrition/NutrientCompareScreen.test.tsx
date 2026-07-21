import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { NutritionReport } from '../../shared/nutrition'
import { NutrientCompareScreen } from './NutrientCompareScreen'

const report: NutritionReport = {
  description: 'Courier bowl',
  amountGrams: 200,
  productName: 'Test bowl',
  source: 'hybrid',
  foodScore: 82,
  aiAttempt: { status: 'succeeded', estimatedCount: 2 },
  nutrients: [
    { key: 'energy', amount: 688, source: 'open-food-facts', judgment: 'OK' },
    { key: 'protein', amount: 24.1, source: 'open-food-facts', judgment: 'OK' },
    { key: 'fat', amount: 12.9, source: 'deterministic-fallback', judgment: 'Low' },
    { key: 'carbohydrates', amount: 71.5, source: 'open-food-facts', judgment: 'OK' },
    { key: 'fiber', amount: 4.2, source: 'gpt-5.6-sol', judgment: 'Low' },
    { key: 'sodium', amount: 0.74, source: 'gpt-5.6-sol', judgment: 'OK' },
  ],
}

function screen(locale: 'en' | 'ja', standard: 'japan' | 'fda' = 'japan'): string {
  return renderToStaticMarkup(
    <NutrientCompareScreen locale={locale} onStandardChange={() => undefined} report={report} standard={standard} />,
  )
}

describe('NutrientCompareScreen', () => {
  it('renders the real report amounts, judgments, and source provenance', () => {
    const markup = screen('ja')

    expect(markup).toContain('24.1 g')
    expect(markup).toContain('688 kcal')
    expect(markup).toContain('もう少し')
    expect(markup).toContain('<strong>バーコード</strong>')
    expect(markup).toContain('AI推定')
    expect(markup).toContain('カテゴリ推定')
    expect(markup).toContain('GPT-5.6が6項目中2項目を推定しました')
  })

  it('uses the selected standard for the reference-value column', () => {
    const japan = screen('ja', 'japan')
    const fda = screen('ja', 'fda')

    expect(japan).toMatch(/data-testid="g07-reference-fat">18 g<\/td>/)
    expect(fda).toMatch(/data-testid="g07-reference-fat">26 g<\/td>/)
    expect(fda).toContain('data-testid="g07-radar-today"')
  })

  it('switches all primary visible labels between Japanese and English', () => {
    const japanese = screen('ja')
    const english = screen('en')

    expect(japanese).toContain('栄養の参考比較')
    expect(japanese).toContain('栄養のバランスチャート')
    expect(english).toContain('Nutrition reference comparison')
    expect(english).toContain('Nutrition balance chart')
    expect(english).toContain('Achieved')
    expect(english).toContain('GPT-5.6 estimated 2 of 6 values')
  })
})
