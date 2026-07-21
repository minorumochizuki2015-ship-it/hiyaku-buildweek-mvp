import type { NutritionReport } from '../../shared/nutrition'
import './record-book.css'

export type RecordBookLocale = 'en' | 'ja'

export interface RecordBookRun {
  title: string | null
  distanceMetres: number | null
  durationSeconds: number | null
  rank: string | null
}

export interface RecordBookScreenProps {
  runs: readonly RecordBookRun[]
  meals: readonly NutritionReport[]
  locale: RecordBookLocale
  onOpenGoyo: () => void
}

interface LocalizedCopy {
  en: string
  ja: string
}

const copy = {
  eyebrow: { en: 'SESSION LEDGER', ja: 'この回の帳簿' },
  title: { en: 'Record book', ja: '記録帳' },
  summary: { en: 'This session', ja: 'この回のまとめ' },
  runs: { en: 'Courier runs', ja: '飛脚行' },
  meals: { en: 'Meals', ja: '食事' },
  totalDistance: { en: 'Total distance', ja: '合計距離' },
  noEntries: { en: 'No entries yet. Accept a goyo to begin.', ja: 'まだ記録はありません。御用を受けて始めましょう。' },
  openGoyo: { en: 'Accept a Goyo', ja: '御用を受ける' },
  noRuns: { en: 'No courier runs recorded.', ja: '飛脚行はまだ記録されていません。' },
  noMeals: { en: 'No meals recorded.', ja: '食事はまだ記録されていません。' },
  distance: { en: 'Distance', ja: '距離' },
  duration: { en: 'Duration', ja: '時間' },
  rank: { en: 'Arrival rank', ja: '到着の位' },
  product: { en: 'Matched product', ja: '一致した商品' },
  amount: { en: 'Amount', ja: '量' },
  foodScore: { en: 'Food score', ja: '食事スコア' },
  productRecord: { en: 'Product record', ja: '商品記録' },
  estimate: { en: 'Estimate', ja: '推定' },
  nutrients: { en: 'nutrients', ja: '栄養素' },
} as const satisfies Record<string, LocalizedCopy>

function text(value: LocalizedCopy, locale: RecordBookLocale): string {
  return value[locale]
}

function isFiniteNumber(value: number | null): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function displayText(value: string | null): string {
  return value?.trim() || '—'
}

function formatDistance(value: number | null, locale: RecordBookLocale): string {
  if (!isFiniteNumber(value)) return '—'
  const metres = Math.round(value)
  return locale === 'ja' ? `${metres}m` : `${metres} m`
}

function formatGrams(value: number): string {
  return Number.isFinite(value) ? `${Math.round(value)} g` : '—'
}

function formatDuration(value: number | null): string {
  if (!isFiniteNumber(value)) return '—'
  const seconds = Math.max(0, Math.round(value))
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

function formatNumber(value: number | null): string {
  return isFiniteNumber(value) ? String(Math.round(value)) : '—'
}

function nutrientSourceCounts(report: NutritionReport): { productRecord: number; estimate: number } {
  const productRecord = report.nutrients.filter((nutrient) => nutrient.source === 'open-food-facts').length
  return { productRecord, estimate: report.nutrients.length - productRecord }
}

export function RecordBookScreen({ runs, meals, locale, onOpenGoyo }: RecordBookScreenProps) {
  const measuredDistances = runs.map((run) => run.distanceMetres).filter(isFiniteNumber)
  const totalDistance = measuredDistances.length > 0 ? measuredDistances.reduce((total, distance) => total + distance, 0) : null
  const hasEntries = runs.length > 0 || meals.length > 0

  return (
    <main className="record-book" aria-labelledby="record-book-title">
      <header className="record-book__header">
        <span className="record-book__crest" aria-hidden="true">記</span>
        <div>
          <p className="record-book__eyebrow">{text(copy.eyebrow, locale)}</p>
          <h1 id="record-book-title">{text(copy.title, locale)}</h1>
        </div>
      </header>

      <section className="record-book__summary" aria-labelledby="record-book-summary-title">
        <h2 id="record-book-summary-title">{text(copy.summary, locale)}</h2>
        <dl>
          <div>
            <dt>{text(copy.runs, locale)}</dt>
            <dd>{runs.length}</dd>
          </div>
          <div>
            <dt>{text(copy.meals, locale)}</dt>
            <dd>{meals.length}</dd>
          </div>
          <div>
            <dt>{text(copy.totalDistance, locale)}</dt>
            <dd>{formatDistance(totalDistance, locale)}</dd>
          </div>
        </dl>
      </section>

      {!hasEntries ? (
        <section className="record-book__empty" aria-labelledby="record-book-empty-title">
          <h2 id="record-book-empty-title">{text(copy.noEntries, locale)}</h2>
          <button className="record-book__goyo" type="button" onClick={onOpenGoyo}>{text(copy.openGoyo, locale)} <span aria-hidden="true">›</span></button>
        </section>
      ) : (
        <>
          <section className="record-book__section" aria-labelledby="record-book-runs-title">
            <h2 id="record-book-runs-title">{text(copy.runs, locale)}</h2>
            {runs.length === 0 ? <p className="record-book__none">{text(copy.noRuns, locale)}</p> : (
              <ol className="record-book__list">
                {[...runs].reverse().map((run, index) => (
                  <li className="record-book__entry" key={`run-${runs.length - index}`}>
                    <h3>{displayText(run.title)}</h3>
                    <dl className="record-book__details">
                      <div><dt>{text(copy.distance, locale)}</dt><dd>{formatDistance(run.distanceMetres, locale)}</dd></div>
                      <div><dt>{text(copy.duration, locale)}</dt><dd>{formatDuration(run.durationSeconds)}</dd></div>
                      <div><dt>{text(copy.rank, locale)}</dt><dd>{displayText(run.rank)}</dd></div>
                    </dl>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section className="record-book__section" aria-labelledby="record-book-meals-title">
            <h2 id="record-book-meals-title">{text(copy.meals, locale)}</h2>
            {meals.length === 0 ? <p className="record-book__none">{text(copy.noMeals, locale)}</p> : (
              <ol className="record-book__list">
                {[...meals].reverse().map((meal, index) => {
                  const sources = nutrientSourceCounts(meal)
                  return (
                    <li className="record-book__entry" key={`meal-${meals.length - index}`}>
                      <h3>{displayText(meal.description)}</h3>
                      <dl className="record-book__details">
                        <div><dt>{text(copy.product, locale)}</dt><dd>{displayText(meal.productName)}</dd></div>
                        <div><dt>{text(copy.amount, locale)}</dt><dd>{formatGrams(meal.amountGrams)}</dd></div>
                        <div><dt>{text(copy.foodScore, locale)}</dt><dd>{formatNumber(meal.foodScore)}</dd></div>
                        <div><dt>{text(copy.productRecord, locale)}</dt><dd>{sources.productRecord} {text(copy.nutrients, locale)}</dd></div>
                        <div><dt>{text(copy.estimate, locale)}</dt><dd>{sources.estimate} {text(copy.nutrients, locale)}</dd></div>
                      </dl>
                    </li>
                  )
                })}
              </ol>
            )}
          </section>
        </>
      )}
    </main>
  )
}
