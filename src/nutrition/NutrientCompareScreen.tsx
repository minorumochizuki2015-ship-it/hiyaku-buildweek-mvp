import {
  NUTRIENT_DEFINITIONS,
  NUTRITION_STANDARD_LABELS,
  NUTRITION_STANDARDS,
  judgeGap,
  perMealReferenceValue,
  type GapJudgment,
  type NutrientKey,
  type NutritionReport,
  type NutritionStandard,
} from '../../shared/nutrition'
import './nutrient-compare.css'

const maximumVisualRatio = 1.5
const tableOrder: readonly NutrientKey[] = ['protein', 'energy', 'fiber', 'carbohydrates', 'fat', 'sodium']
const radarOrder: readonly NutrientKey[] = ['protein', 'fiber', 'carbohydrates', 'fat', 'sodium', 'energy']

type Locale = 'en' | 'ja'

interface NutrientCompareScreenProps {
  report: NutritionReport
  standard: NutritionStandard
  onStandardChange: (standard: NutritionStandard) => void
  locale: Locale
}

interface DisplayNutrient {
  key: NutrientKey
  label: string
  edoLabel: string
  unit: string
  amount: number
  referenceValue: number
  source: NutritionReport['nutrients'][number]['source']
  judgment: GapJudgment
}

const copy = {
  ja: {
    title: '栄養の参考比較',
    trend: '記録上の傾向',
    standard: '比較基準',
    nutrient: '栄養素',
    estimate: '今日の推定',
    reference: '1食あたりの目安',
    status: '状態',
    source: 'ソース',
    disclaimer: '※推奨値は性別・年齢・活動量により異なります。これは一般的な参考です。表示する目安は1日の基準値の1食分であり、1日合計ではありません。基準は 日本 / FDA / EU / 国際 に切替できます。',
    aiNotNeeded: 'GPT-5.6は不要 — Open Food Factsが全項目をカバーしました',
    aiSucceeded: (estimatedCount: number) => `GPT-5.6が6項目中${estimatedCount}項目を推定しました`,
    aiNoKey: 'GPT-5.6は利用できません — カテゴリ推定を表示しています',
    aiFailed: (reason: string) => `GPT-5.6は利用できません（${reason}） — カテゴリ推定を表示しています`,
    aiUnknown: 'GPT-5.6の試行状態は不明です（旧レスポンス）',
    chartTitle: '栄養のバランスチャート',
    chartLabel: '栄養バランスの六角レーダーチャート',
    today: '今日の傾向',
    recommended: '推奨の目安',
    statusLabels: { OK: '達成', Low: 'もう少し', High: 'とりすぎ' },
    sourceLabels: {
      'open-food-facts': '食品DB',
      'gpt-5.6-sol': 'AI推定',
      'deterministic-fallback': 'カテゴリ推定',
    },
    standards: { japan: '日本', fda: 'FDA', eu: 'EU', international: '国際' },
    trendSuffix: '参考',
  },
  en: {
    title: 'Nutrition reference comparison',
    trend: 'Trends in your record',
    standard: 'Comparison standard',
    nutrient: 'Nutrient',
    estimate: 'Today’s estimate',
    reference: 'Per-meal guide',
    status: 'Status',
    source: 'Source',
    disclaimer: 'Reference values vary by sex, age, and activity level. They are general guidance only. The guide shown is a per-meal portion of the daily reference, not the daily total. Switch between Japan, FDA, EU, and International standards.',
    aiNotNeeded: 'GPT-5.6 was not needed — Open Food Facts covered all values',
    aiSucceeded: (estimatedCount: number) => `GPT-5.6 estimated ${estimatedCount} of 6 values`,
    aiNoKey: 'GPT-5.6 unavailable — showing category estimates',
    aiFailed: (reason: string) => `GPT-5.6 unavailable (${reason}) — showing category estimates`,
    aiUnknown: 'GPT-5.6 attempt status unavailable (older response)',
    chartTitle: 'Nutrition balance chart',
    chartLabel: 'Six-axis nutrition balance radar chart',
    today: 'Today’s trend',
    recommended: 'Reference guide',
    statusLabels: { OK: 'Achieved', Low: 'Needs more', High: 'Too much' },
    sourceLabels: {
      'open-food-facts': 'Food database',
      'gpt-5.6-sol': 'AI estimate',
      'deterministic-fallback': 'Category estimate',
    },
    standards: NUTRITION_STANDARD_LABELS,
    trendSuffix: 'reference',
  },
} as const

function aiAttemptLabel(report: NutritionReport, locale: Locale): string {
  const text = copy[locale]
  const attempt = report.aiAttempt
  if (!attempt) return text.aiUnknown
  if (attempt.status === 'not-needed') return text.aiNotNeeded
  if (attempt.status === 'succeeded') return text.aiSucceeded(attempt.estimatedCount)
  if (attempt.status === 'skipped-no-api-key') return text.aiNoKey
  return text.aiFailed(attempt.reason)
}

function formatAmount(value: number): string {
  return Number.isInteger(value) ? String(value) : String(Math.round(value * 100) / 100)
}

function pointFor(index: number, ratio: number, radius: number): string {
  const centerX = 100
  const centerY = 86
  const angle = -Math.PI / 2 + index * Math.PI / 3
  const effectiveRadius = radius * Math.min(Math.max(ratio, 0), maximumVisualRatio) / maximumVisualRatio
  return `${(centerX + Math.cos(angle) * effectiveRadius).toFixed(1)},${(centerY + Math.sin(angle) * effectiveRadius).toFixed(1)}`
}

function displayNutrients(report: NutritionReport, standard: NutritionStandard, order: readonly NutrientKey[]): DisplayNutrient[] {
  return order.map((key) => {
    const definition = NUTRIENT_DEFINITIONS.find((item) => item.key === key)
    const nutrient = report.nutrients.find((item) => item.key === key)
    if (!definition) throw new Error(`Unknown nutrient definition: ${key}`)

    return {
      key,
      label: definition.label,
      edoLabel: definition.edoLabel,
      unit: definition.unit,
      amount: nutrient?.amount ?? 0,
      referenceValue: perMealReferenceValue(definition, standard),
      source: nutrient?.source ?? 'deterministic-fallback',
      judgment: judgeGap(nutrient?.amount ?? 0, perMealReferenceValue(definition, standard)),
    }
  })
}

export function NutrientCompareScreen({ report, standard, onStandardChange, locale }: NutrientCompareScreenProps) {
  const text = copy[locale]
  const tableNutrients = displayNutrients(report, standard, tableOrder)
  const radarNutrients = displayNutrients(report, standard, radarOrder)
  const todayPoints = radarNutrients
    .map((nutrient, index) => pointFor(index, nutrient.referenceValue > 0 ? nutrient.amount / nutrient.referenceValue : 0, 70))
    .join(' ')
  const recommendedPoints = radarNutrients.map((_, index) => pointFor(index, 1, 70)).join(' ')

  return (
    <main className="g07-nutrient-compare" aria-labelledby="g07-nutrient-compare-title">
      <header className="g07-nutrient-compare-header">
        <h1 id="g07-nutrient-compare-title">{text.title}</h1>
        <p>{text.trend}（{text.standards[standard]} {text.trendSuffix}）</p>
        <label className="g07-standard-switcher">
          <span>{text.standard}</span>
          <select
            aria-label={text.standard}
            value={standard}
            onChange={(event) => onStandardChange(event.target.value as NutritionStandard)}
          >
            {NUTRITION_STANDARDS.map((option) => (
              <option key={option} value={option}>{text.standards[option]}</option>
            ))}
          </select>
        </label>
      </header>

      <section className="g07-panel g07-table-panel" aria-label={text.title}>
        <table className="g07-nutrient-table">
          <thead>
            <tr>
              <th scope="col">{text.nutrient}</th>
              <th scope="col">{text.estimate}</th>
              <th scope="col">{text.reference}</th>
              <th scope="col">{text.status}</th>
              <th scope="col">{text.source}</th>
            </tr>
          </thead>
          <tbody>
            {tableNutrients.map((nutrient) => (
              <tr key={nutrient.key}>
                <th className="g07-nutrient-name" scope="row">
                  <span>{locale === 'ja' ? nutrient.edoLabel : nutrient.label}</span>
                  <small>{locale === 'ja' ? nutrient.label : nutrient.edoLabel}</small>
                </th>
                <td>{formatAmount(nutrient.amount)} {nutrient.unit}</td>
                <td data-testid={`g07-reference-${nutrient.key}`}>{formatAmount(nutrient.referenceValue)} {nutrient.unit}</td>
                <td>
                  <span className={`g07-status-pill g07-status-${nutrient.judgment.toLowerCase()}`}>{text.statusLabels[nutrient.judgment]}</span>
                </td>
                <td className="g07-source-label">
                  {nutrient.source === 'open-food-facts'
                    ? <strong>{text.sourceLabels[nutrient.source]}</strong>
                    : text.sourceLabels[nutrient.source]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="g07-ai-attempt-status" data-testid="g07-ai-attempt-status">{aiAttemptLabel(report, locale)}</p>
        <p className="g07-disclaimer">{text.disclaimer}</p>
      </section>

      <section className="g07-panel g07-radar-panel" aria-labelledby="g07-radar-title">
        <h2 id="g07-radar-title">{text.chartTitle}</h2>
        <div className="g07-radar-wrap">
          <svg viewBox="0 0 200 172" role="img" aria-label={text.chartLabel}>
            <g className="g07-radar-grid">
              <polygon points="100,16 173,58 173,130 100,156 27,130 27,58" />
              <polygon points="100,39 151,68 151,118 100,147 49,118 49,68" />
              <polygon points="100,62 128,78 128,110 100,126 72,110 72,78" />
            </g>
            <polygon className="g07-radar-reference" points={recommendedPoints} data-testid="g07-radar-reference" />
            <polygon className="g07-radar-today" points={todayPoints} data-testid="g07-radar-today" />
            {radarNutrients.map((nutrient, index) => {
              const [x, y] = pointFor(index, nutrient.referenceValue > 0 ? nutrient.amount / nutrient.referenceValue : 0, 70).split(',')
              return <circle className="g07-radar-point" cx={x} cy={y} key={nutrient.key} r="2.4" />
            })}
            <g className="g07-radar-labels">
              {radarNutrients.map((nutrient, index) => {
                const angle = -Math.PI / 2 + index * Math.PI / 3
                return (
                  <text key={nutrient.key} x={(100 + Math.cos(angle) * 88).toFixed(1)} y={(86 + Math.sin(angle) * 83 + 3).toFixed(1)}>
                    {locale === 'ja' ? nutrient.edoLabel : nutrient.label}
                  </text>
                )
              })}
            </g>
          </svg>
        </div>
        <p className="g07-radar-legend">
          <span className="g07-legend-today" aria-hidden="true">■</span> {text.today}
          <span className="g07-legend-reference" aria-hidden="true">┄</span> {text.recommended}
        </p>
      </section>
    </main>
  )
}
