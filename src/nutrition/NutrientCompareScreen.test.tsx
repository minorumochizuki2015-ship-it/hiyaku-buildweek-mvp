import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { NutritionReport, NutritionStandard } from '../../shared/nutrition'
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

function screen(locale: 'en' | 'ja', standard: NutritionStandard = 'japan'): string {
  return renderToStaticMarkup(
    <NutrientCompareScreen locale={locale} onStandardChange={() => undefined} report={report} standard={standard} />,
  )
}

describe('NutrientCompareScreen', () => {
  it('renders the real report amounts, judgments, and source provenance', () => {
    const markup = screen('ja')

    expect(markup).toContain('24.1 g')
    expect(markup).toContain('688 kcal')
    expect(markup).toContain('data-testid="g07-contribution-protein">121%')
    expect(markup).not.toContain('多めの量')
    expect(markup).toContain('<strong>食品DB</strong>')
    expect(markup).toContain('AI推定')
    expect(markup).toContain('カテゴリ推定')
    expect(markup).toContain('GPT-5.6が6項目中2項目を推定しました')
  })

  it('keeps all four selected standards wired to the reference-value column', () => {
    const standards: ReadonlyArray<readonly [NutritionStandard, string]> = [
      ['japan', '18'],
      ['fda', '26'],
      ['eu', '23.3'],
      ['international', '22.2'],
    ]

    for (const [standard, fatGuide] of standards) {
      const markup = screen('ja', standard)
      expect(markup).toMatch(new RegExp(`data-testid="g07-reference-fat">${fatGuide} g<\\/td>`))
      expect(markup).toContain('data-testid="g07-radar-today"')
    }
  })

  it('switches all primary visible labels between Japanese and English', () => {
    const japanese = screen('ja')
    const english = screen('en')

    expect(japanese).toContain('食品の栄養貢献')
    expect(japanese).toContain('栄養のバランスチャート')
    expect(english).toContain('Item nutrition contribution')
    expect(english).toContain('Nutrition balance chart')
    expect(japanese).toContain('目安への割合')
    expect(english).toContain('Per-meal guide')
    expect(english).toContain('what this item contributes toward a one-meal guide')
    expect(english).toContain('Contribution')
    expect(english).not.toContain('Needs more')
    expect(english).toContain('<strong>Food database</strong>')
    expect(english).toContain('GPT-5.6 estimated 2 of 6 values')
  })
})
