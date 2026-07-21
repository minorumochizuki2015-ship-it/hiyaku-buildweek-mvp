import { useState } from 'react'
import {
  NUTRIENT_DEFINITIONS,
  NUTRITION_STANDARD_LABELS,
  NUTRITION_STANDARDS,
  isNutritionReport,
  type GapJudgment,
  type NutritionReport,
  type NutritionStandard,
} from '../shared/nutrition'

const maximumVisualRatio = 1.5

interface NutritionScreenProps {
  onBack: () => void
  backLabel?: string
  onContinue?: () => void
  initialReport?: NutritionReport | null
  initialStandard?: NutritionStandard
}

interface DisplayNutrient {
  key: string
  label: string
  edoLabel: string
  unit: string
  amount: number
  source: NutritionReport['nutrients'][number]['source']
  judgment: GapJudgment
  referenceValue: number
  ratio: number
  barPercent: number
}

async function requestNutrition(description: string, amountGrams: number): Promise<NutritionReport> {
  const response = await fetch('/api/nutrition', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ description, amountGrams }),
  })
  if (!response.ok) throw new Error(`Nutrition request failed with ${response.status}`)
  const value: unknown = await response.json()
  if (!isNutritionReport(value)) throw new Error('Nutrition response did not match the expected shape')
  return value
}

function sourceLabel(source: NutritionReport['source']): string {
  if (source === 'open-food-facts') return 'Open Food Facts'
  if (source === 'gpt-5.6-sol') return 'AI estimate'
  if (source === 'hybrid') return 'Open Food Facts + estimate'
  return 'Reliable local estimate'
}

function nutrientSourceLabel(source: NutritionReport['nutrients'][number]['source']): string {
  if (source === 'open-food-facts') return 'Real food data'
  if (source === 'gpt-5.6-sol') return 'AI estimate for missing data'
  return 'Local fallback estimate'
}

export function gapJudgmentFor(amount: number, referenceValue: number): GapJudgment {
  if (amount < 0.85 * referenceValue) return 'Low'
  if (amount > 1.15 * referenceValue) return 'High'
  return 'OK'
}

function displayNutrientsFor(report: NutritionReport, standard: NutritionStandard): DisplayNutrient[] {
  return NUTRIENT_DEFINITIONS.map((definition) => {
    const nutrient = report.nutrients.find((item) => item.key === definition.key)
    const amount = nutrient?.amount ?? 0
    const referenceValue = definition.referenceValues[standard]
    const ratio = referenceValue > 0 ? amount / referenceValue : 0
    return {
      key: definition.key,
      label: definition.label,
      edoLabel: definition.edoLabel,
      unit: definition.unit,
      amount,
      source: nutrient?.source ?? 'deterministic-fallback',
      judgment: gapJudgmentFor(amount, referenceValue),
      referenceValue,
      ratio,
      barPercent: Math.min(Math.round(ratio * 1000) / 10, maximumVisualRatio * 100),
    }
  })
}

function dominantGapAdvice(nutrients: readonly DisplayNutrient[]): string {
  const counts = nutrients.reduce<Record<GapJudgment, number>>((total, nutrient) => {
    total[nutrient.judgment] += 1
    return total
  }, { Low: 0, OK: 0, High: 0 })
  if (counts.Low > counts.OK && counts.Low >= counts.High) return 'Courier, a little more fuel will steady the road ahead.'
  if (counts.High > counts.OK && counts.High > counts.Low) return 'Courier, this meal is abundant—balance the next stop with something lighter.'
  return 'Courier, a balanced ledger makes a steady stride.'
}

function radarPoint(index: number, barPercent: number): string {
  const center = 100
  const radius = 72 * (barPercent / (maximumVisualRatio * 100))
  const angle = -Math.PI / 2 + index * Math.PI / 3
  return `${(center + Math.cos(angle) * radius).toFixed(1)},${(center + Math.sin(angle) * radius).toFixed(1)}`
}

export function NutritionScreen({
  onBack,
  backLabel = 'Arrival',
  onContinue,
  initialReport = null,
  initialStandard = 'japan',
}: NutritionScreenProps) {
  const [description, setDescription] = useState('')
  const [amountGrams, setAmountGrams] = useState(200)
  const [report, setReport] = useState<NutritionReport | null>(initialReport)
  const [standard, setStandard] = useState<NutritionStandard>(initialStandard)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const displayNutrients = report ? displayNutrientsFor(report, standard) : []
  const radarPoints = displayNutrients.map((nutrient, index) => radarPoint(index, nutrient.barPercent)).join(' ')

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const meal = description.trim()
    if (!meal) return
    setLoading(true)
    setStatus('Looking up your meal…')
    try {
      const nextReport = await requestNutrition(meal, amountGrams)
      setReport(nextReport)
      setStatus('')
    } catch {
      setStatus('That report could not be prepared. Try again in a moment.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="screen nutrition-screen" aria-labelledby="nutrition-title">
      <header className="nutrition-header">
        <button className="nutrition-back" type="button" onClick={onBack}>← {backLabel}</button>
        <p className="eyebrow">COURIER’S TABLE</p>
        <h1 id="nutrition-title">Nutrition Report</h1>
        <p>Log one meal. Real package data leads; estimates fill only what is missing.</p>
      </header>

      <form className="nutrition-form" onSubmit={submit}>
        <label>
          <span>What did you eat?</span>
          <input value={description} onChange={(event) => setDescription(event.target.value)} maxLength={160} placeholder="e.g. banana or salmon rice bowl" required />
        </label>
        <label>
          <span>Amount (grams)</span>
          <input type="number" min="25" max="2000" step="1" value={amountGrams} onChange={(event) => setAmountGrams(Number(event.target.value))} required />
        </label>
        <button className="primary-button" type="submit" disabled={loading}>{loading ? 'Reading the table…' : 'Make nutrition report'}</button>
      </form>

      {status && <p className="nutrition-status" aria-live="polite">{status}</p>}
      {report && (
        <section className="nutrition-report" aria-label="Meal nutrition report">
          <div className="nutrition-summary">
            <div>
              <p className="eyebrow">FOOD SCORE</p>
              <strong>{report.foodScore}</strong><span>/100</span>
            </div>
            <p><b>{sourceLabel(report.source)}</b>{report.productName ? <> · matched {report.productName}</> : null}<small>{report.amountGrams}g logged</small></p>
          </div>

          <label className="nutrition-standard">
            <span>Comparison standard</span>
            <select aria-label="Nutrition reference standard" value={standard} onChange={(event) => setStandard(event.target.value as NutritionStandard)}>
              {NUTRITION_STANDARDS.map((option) => <option key={option} value={option}>{NUTRITION_STANDARD_LABELS[option]}</option>)}
            </select>
          </label>
          <p className="nutrition-note">“Low”, “OK”, and “High” use the selected single-meal reference. This comparison is not medical advice.</p>

          <ul className="nutrient-list nutrition-nutrient-list">
            {displayNutrients.map((nutrient) => (
              <li key={nutrient.key}>
                <div className="nutrition-nutrient-heading">
                  <span className="nutrient-edo">{nutrient.edoLabel}</span>
                  <div>
                    <strong>{nutrient.label}</strong>
                    <small>{nutrient.key === 'sodium' ? 'Sodium-only micros proxy' : nutrientSourceLabel(nutrient.source)}</small>
                  </div>
                  <em className={`gap-${nutrient.judgment.toLowerCase()}`} data-testid={`nutrient-judgment-${nutrient.key}`}>{nutrient.judgment}</em>
                </div>
                <div
                  aria-label={`${nutrient.label}: ${nutrient.barPercent}% of the ${NUTRITION_STANDARD_LABELS[standard]} reference`}
                  aria-valuemax={maximumVisualRatio * 100}
                  aria-valuemin={0}
                  aria-valuenow={nutrient.barPercent}
                  className="nutrition-meter"
                  role="meter"
                >
                  <span className={`nutrition-meter-fill gap-${nutrient.judgment.toLowerCase()}`} data-bar-percent={nutrient.barPercent} data-testid={`nutrient-bar-${nutrient.key}`} style={{ width: `${nutrient.barPercent}%` }} />
                </div>
                <div className="nutrition-nutrient-meta">
                  <b>{nutrient.amount}{nutrient.unit}</b>
                  <small>{Math.round(nutrient.ratio * 100)}% of {nutrient.referenceValue}{nutrient.unit}</small>
                </div>
              </li>
            ))}
          </ul>

          <section className="nutrition-radar" aria-labelledby="nutrition-radar-title">
            <div>
              <p className="eyebrow">SIX-POINT BALANCE</p>
              <h2 id="nutrition-radar-title">Meal radar</h2>
              <p>Each spoke reaches 150% of the selected meal reference.</p>
            </div>
            <svg viewBox="0 0 200 200" role="img" aria-labelledby="nutrition-radar-title nutrition-radar-description">
              <desc id="nutrition-radar-description">Six-axis nutrition balance radar chart.</desc>
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <line className="nutrition-radar-axis" key={index} x1="100" x2={(100 + Math.cos(-Math.PI / 2 + index * Math.PI / 3) * 76).toFixed(1)} y1="100" y2={(100 + Math.sin(-Math.PI / 2 + index * Math.PI / 3) * 76).toFixed(1)} />
              ))}
              <polygon className="nutrition-radar-polygon" points={radarPoints} />
              {displayNutrients.map((nutrient, index) => {
                const angle = -Math.PI / 2 + index * Math.PI / 3
                return <text className="nutrition-radar-label" key={nutrient.key} x={(100 + Math.cos(angle) * 91).toFixed(1)} y={(100 + Math.sin(angle) * 91).toFixed(1)}>{nutrient.label}</text>
              })}
            </svg>
          </section>

          <aside className="nutrition-advice" aria-label="Courier nutrition advice">
            <p className="eyebrow">COURIER’S COUNSEL</p>
            <p>{dominantGapAdvice(displayNutrients)}</p>
          </aside>
          <p className="nutrition-town-contribution">This meal’s score feeds your <strong>Food Hall energy.</strong></p>
        </section>
      )}
      {onContinue && <button className="primary-button nutrition-continue" type="button" onClick={onContinue}>Continue to Journey</button>}
    </main>
  )
}
