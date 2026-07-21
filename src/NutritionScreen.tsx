import { useState } from 'react'
import { NUTRIENT_DEFINITIONS, isNutritionReport, type NutritionReport } from '../shared/nutrition'

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

export function NutritionScreen({ onBack }: { onBack: () => void }) {
  const [description, setDescription] = useState('')
  const [amountGrams, setAmountGrams] = useState(200)
  const [report, setReport] = useState<NutritionReport | null>(null)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

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
        <button className="nutrition-back" type="button" onClick={onBack}>← Arrival</button>
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
          <p className="nutrition-note">“Low”, “OK”, and “High” compare this meal with the app’s three-meal Japanese baseline; this is not medical advice.</p>
          <ul className="nutrient-list">
            {NUTRIENT_DEFINITIONS.map((definition) => {
              const nutrient = report.nutrients.find((item) => item.key === definition.key)!
              return (
                <li key={definition.key}>
                  <span className="nutrient-edo">{definition.edoLabel}</span>
                  <div><strong>{definition.label}</strong><small>{nutrient.source === 'open-food-facts' ? 'Real food data' : nutrient.source === 'gpt-5.6-sol' ? 'AI estimate for missing data' : 'Local fallback estimate'}</small></div>
                  <b>{nutrient.amount}{definition.unit}</b>
                  <em className={`gap-${nutrient.judgment.toLowerCase()}`}>{nutrient.judgment}</em>
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </main>
  )
}
