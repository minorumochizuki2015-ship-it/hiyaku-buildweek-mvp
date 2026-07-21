import { NUTRIENT_DEFINITIONS, type NutrientEstimate, type NutritionReport } from '../../shared/nutrition'
import './gozen-ledger.css'

type Locale = 'en' | 'ja'

interface GozenLedgerScreenProps {
  report: NutritionReport
  distanceMetres?: number
  elapsedSeconds?: number
  locale: Locale
}

const copy = {
  ja: {
    title: '御膳帳 Premium',
    subtitle: '今日の食事と町の様子',
    calendar: '暦',
    calendarLabel: '今日の暦',
    scoreTitle: '食品の貢献スコア',
    accuracy: '記録精度',
    high: '高',
    achievements: '多めの量',
    source: '情報ソース',
    town: '町への反映',
    good: '良好',
    steady: '整い中',
    mealLog: '食事ログまとめ',
    loggedItem: '記録した内容',
    matchedProduct: '一致した商品',
    amount: '量',
    unmatchedProduct: '商品には一致しませんでした。栄養値は推定です。',
    journey: '今日の巡行',
    distance: '距離',
    duration: '所要時間',
    recovery: '回復提案',
    recoveryCopy: '巡行のあとは、しっかり休息とたんぱく質を意識しましょう。',
    goodTitle: 'この食品の記録',
    lowTitle: '注目する量',
    goodCopy: (nutrients: string) => `${nutrients}の量を記録しました。`,
    lowCopy: (nutrients: string) => `${nutrients}は1食の目安に対して多めです。`,
    noLow: '1食の目安の2倍を超える量はありません。',
    measured: '実測',
    ai: 'AI推定',
    category: 'カテゴリ推定',
    measuredAi: '実測+AI',
    mixed: '複合ソース',
    aiNotNeeded: 'GPT-5.6は不要 — Open Food Factsが全項目をカバー',
    aiSucceeded: (estimatedCount: number) => `GPT-5.6が6項目中${estimatedCount}項目を推定`,
    aiNoKey: 'GPT-5.6は利用できません — カテゴリ推定を表示',
    aiFailed: (reason: string) => `GPT-5.6は利用できません（${reason}） — カテゴリ推定を表示`,
    aiUnknown: 'GPT-5.6の試行状態は不明（旧レスポンス）',
  },
  en: {
    title: 'Premium Meal Ledger',
    subtitle: 'Today’s meals and the town',
    calendar: 'Calendar',
    calendarLabel: 'Today’s calendar',
    scoreTitle: 'Item contribution score',
    accuracy: 'Record accuracy',
    high: 'High',
    achievements: 'Notable amounts',
    source: 'Data source',
    town: 'Town effect',
    good: 'Good',
    steady: 'Balancing',
    mealLog: 'Meal log summary',
    loggedItem: 'Logged item',
    matchedProduct: 'Matched product',
    amount: 'Amount',
    unmatchedProduct: 'No product match. Nutrition figures are estimated.',
    journey: 'Today’s rounds',
    distance: 'Distance',
    duration: 'Duration',
    recovery: 'Recovery suggestion',
    recoveryCopy: 'After your rounds, rest well and keep protein in mind.',
    goodTitle: 'This item’s record',
    lowTitle: 'Notable amounts',
    goodCopy: (nutrients: string) => `Recorded amounts include ${nutrients}.`,
    lowCopy: (nutrients: string) => `${nutrients} are more than twice the per-meal guide.`,
    noLow: 'No amount is more than twice the per-meal guide.',
    measured: 'Measured',
    ai: 'AI estimate',
    category: 'Category estimate',
    measuredAi: 'Measured + AI',
    mixed: 'Mixed sources',
    aiNotNeeded: 'GPT-5.6 was not needed — Open Food Facts covered all values',
    aiSucceeded: (estimatedCount: number) => `GPT-5.6 estimated ${estimatedCount} of 6 values`,
    aiNoKey: 'GPT-5.6 unavailable — showing category estimates',
    aiFailed: (reason: string) => `GPT-5.6 unavailable (${reason}) — showing category estimates`,
    aiUnknown: 'GPT-5.6 attempt status unavailable (older response)',
  },
} as const

function sourceLabel(nutrients: readonly NutrientEstimate[], locale: Locale): string {
  const sources = new Set(nutrients.map((nutrient) => nutrient.source))
  const labels = copy[locale]
  if (sources.size === 1) {
    if (sources.has('open-food-facts')) return labels.measured
    if (sources.has('gpt-5.6-sol')) return labels.ai
    return labels.category
  }
  if (sources.size === 2 && sources.has('open-food-facts') && sources.has('gpt-5.6-sol')) return labels.measuredAi
  return labels.mixed
}

function aiAttemptLabel(report: NutritionReport, locale: Locale): string {
  const labels = copy[locale]
  const attempt = report.aiAttempt
  if (!attempt) return labels.aiUnknown
  if (attempt.status === 'not-needed') return labels.aiNotNeeded
  if (attempt.status === 'succeeded') return labels.aiSucceeded(attempt.estimatedCount)
  if (attempt.status === 'skipped-no-api-key') return labels.aiNoKey
  return labels.aiFailed(attempt.reason)
}

function nutrientNames(nutrients: readonly NutrientEstimate[], judgment: NutrientEstimate['judgment'], locale: Locale): string {
  const names = NUTRIENT_DEFINITIONS
    .filter((definition) => nutrients.some((nutrient) => nutrient.key === definition.key && nutrient.judgment === judgment))
    .map((definition) => locale === 'ja' ? definition.edoLabel : definition.label)

  return names.slice(0, 2).join(locale === 'ja' ? 'と' : ' and ')
}

function formatNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === 'ja' ? 'ja-JP' : 'en-US').format(value)
}

export function formatJourneyDistance(distanceMetres: number | undefined, locale: Locale): string {
  if (distanceMetres === undefined) return '—'
  if (distanceMetres < 1000) return `${formatNumber(Math.round(distanceMetres), locale)} m`
  return `${(distanceMetres / 1000).toFixed(1)} km`
}

export function formatJourneyDuration(elapsedSeconds: number | undefined): string {
  if (elapsedSeconds === undefined) return '—'
  const totalSeconds = Math.floor(elapsedSeconds)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (minutes < 60) return `${minutes}:${String(seconds).padStart(2, '0')}`
  return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}`
}

export function GozenLedgerScreen({ report, distanceMetres, elapsedSeconds, locale }: GozenLedgerScreenProps) {
  const labels = copy[locale]
  const notableNutrients = nutrientNames(report.nutrients, 'High', locale)
  const recordedNutrients = nutrientNames(report.nutrients, 'OK', locale)
  const townState = report.foodScore >= 70 ? labels.good : labels.steady
  const scoreStyle = { '--g07-score': `${report.foodScore}%` } as React.CSSProperties

  return (
    <main className="g07-gozen-ledger" aria-labelledby="g07-gozen-ledger-title">
      <header className="g07-ledger-header">
        <h1 id="g07-gozen-ledger-title">{labels.title}</h1>
        <p>{labels.subtitle}</p>
        <div className="g07-calendar" aria-label={labels.calendarLabel}>
          <span aria-hidden="true">🗓</span>{labels.calendar}
        </div>
      </header>

      <section className="g07-card" aria-labelledby="g07-score-title">
        <h2 id="g07-score-title">{labels.scoreTitle}</h2>
        <div className="g07-score-row">
          <div className="g07-score-ring" role="img" aria-label={`${labels.scoreTitle}: ${report.foodScore} / 100`} style={scoreStyle}>
            <span><b>{report.foodScore}</b><i>/100</i></span>
          </div>
          <dl className="g07-key-values">
            <div><dt>{labels.accuracy}</dt><dd className="g07-pill g07-pill-ok">{labels.high}</dd></div>
            <div><dt>{labels.achievements}</dt><dd className="g07-pill g07-pill-gold">{report.nutrients.filter((nutrient) => nutrient.judgment === 'High').length}</dd></div>
            <div>
              <dt>{labels.source}</dt>
              <dd className="g07-ai-source-status">
                <span className="g07-pill g07-pill-gold">{sourceLabel(report.nutrients, locale)}</span>
                <small>{aiAttemptLabel(report, locale)}</small>
              </dd>
            </div>
            <div><dt>{labels.town}</dt><dd className="g07-pill g07-pill-ok">{townState}</dd></div>
          </dl>
        </div>
      </section>

      <section className="g07-card" aria-labelledby="g07-meal-log-title">
        <h2 id="g07-meal-log-title">{labels.mealLog}</h2>
        <div className="g07-log-details">
          <dl className="g07-key-values">
            <div><dt>{labels.loggedItem}</dt><dd>{report.description}</dd></div>
            {report.productName && <div><dt>{labels.matchedProduct}</dt><dd>{report.productName}</dd></div>}
            <div><dt>{labels.amount}</dt><dd>{formatNumber(report.amountGrams, locale)} g</dd></div>
          </dl>
          {!report.productName && <p className="g07-log-note">{labels.unmatchedProduct}</p>}
        </div>
      </section>

      <section className="g07-card" aria-labelledby="g07-journey-title">
        <h2 id="g07-journey-title">{labels.journey}</h2>
        <div className="g07-journey-row">
          <dl className="g07-key-values g07-journey-values">
            <div><dt>{labels.distance}</dt><dd>{formatJourneyDistance(distanceMetres, locale)}</dd></div>
            <div><dt>{labels.duration}</dt><dd>{formatJourneyDuration(elapsedSeconds)}</dd></div>
          </dl>
          <aside className="g07-mini-card" aria-labelledby="g07-recovery-title">
            <h3 id="g07-recovery-title">{labels.recovery}</h3>
            <p>{labels.recoveryCopy}</p>
          </aside>
        </div>
      </section>

      <div className="g07-two-up">
        <section className="g07-mini-card" aria-labelledby="g07-good-title">
          <h2 id="g07-good-title">{labels.goodTitle}</h2>
          <p>{labels.goodCopy(recordedNutrients || (locale === 'ja' ? '栄養の記録' : 'Nutrient records'))}</p>
        </section>
        <section className="g07-mini-card" aria-labelledby="g07-low-title">
          <h2 id="g07-low-title">{labels.lowTitle}</h2>
          <p>{notableNutrients ? labels.lowCopy(notableNutrients) : labels.noLow}</p>
        </section>
      </div>
    </main>
  )
}
