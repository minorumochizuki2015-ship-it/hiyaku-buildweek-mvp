import { useReducer, useState, type FormEvent } from 'react'
import {
  isNutritionReport,
  type NutritionReport,
  type NutritionStandard,
} from '../../shared/nutrition'
import { calculateActivityScores, toGameResources } from '../../shared/activity'
import { GozenLedgerScreen } from './GozenLedgerScreen'
import { NutrientCompareScreen } from './NutrientCompareScreen'
import { TomorrowSuggestScreen } from './TomorrowSuggestScreen'
import { TownDeliveryScreen } from './TownDeliveryScreen'
import { AchievementScene, type AchievementDelta } from '../screens/AchievementScene'
import './nutrition-flow.css'

type Locale = 'en' | 'ja'
type FlowStep = 1 | 2 | 3 | 4

interface NutritionFlowProps {
  onBack: () => void
  onReturnToTown?: () => void
  backLabel?: string
  onContinue?: () => void
  locale: Locale
  distanceMetres?: number
  elapsedSeconds?: number
  previousFoodScore?: number
  onReport?: (report: NutritionReport) => void
}

interface NutritionFlowState {
  step: FlowStep
  standard: NutritionStandard
}

export type NutritionFlowAction =
  | { type: 'next' }
  | { type: 'previous' }
  | { type: 'setStandard'; standard: NutritionStandard }
  | { type: 'reset' }

export function nutritionFlowReducer(state: NutritionFlowState, action: NutritionFlowAction): NutritionFlowState {
  switch (action.type) {
    case 'next':
      return { ...state, step: Math.min(state.step + 1, 4) as FlowStep }
    case 'previous':
      return { ...state, step: Math.max(state.step - 1, 1) as FlowStep }
    case 'setStandard':
      return { ...state, standard: action.standard }
    case 'reset':
      return { ...state, step: 1 }
  }
}

const initialFlowState: NutritionFlowState = { step: 1, standard: 'japan' }

// This mirrors NutritionScreen's established client request contract. It remains
// local because the existing helper is private and this change is scoped away
// from modifying NutritionScreen or adding a shared request module.
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

const flowLabels = {
  en: { back: 'Back', next: 'Next', step: (step: FlowStep) => `${step}/4` },
  ja: { back: '戻る', next: '次へ', step: (step: FlowStep) => `${step}/4` },
} as const

export function achievementModeFor(report: NutritionReport): 'light' | 'video' {
  return report.foodScore >= 60 && report.nutrients.some((nutrient) => nutrient.judgment === 'OK') ? 'video' : 'light'
}

export function foodHallDeltasForReport(report: NutritionReport, previousFoodScore: number, locale: Locale): AchievementDelta[] {
  const previous = toGameResources(calculateActivityScores(previousFoodScore, null, null)).foodHallEnergy
  const next = toGameResources(calculateActivityScores(report.foodScore, null, null)).foodHallEnergy
  const delta = next - previous
  if (!Number.isFinite(delta) || delta === 0) return []
  return [{
    key: 'food-hall-energy',
    label: locale === 'ja' ? '食堂' : 'Food hall',
    delta: delta > 0 ? `+${delta}` : String(delta),
  }]
}

export function NutritionFlow({
  onBack,
  onReturnToTown,
  backLabel = 'Arrival',
  onContinue,
  locale,
  distanceMetres,
  elapsedSeconds,
  previousFoodScore = 0,
  onReport,
}: NutritionFlowProps) {
  const [description, setDescription] = useState('')
  const [amountGrams, setAmountGrams] = useState(200)
  const [report, setReport] = useState<NutritionReport | null>(null)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [reportBaselineFoodScore, setReportBaselineFoodScore] = useState(previousFoodScore)
  const [achievementSeen, setAchievementSeen] = useState(false)
  const [flow, dispatch] = useReducer(nutritionFlowReducer, initialFlowState)
  const labels = flowLabels[locale]

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const meal = description.trim()
    if (!meal) return
    setLoading(true)
    setStatus('Looking up your meal…')
    try {
      const nextReport = await requestNutrition(meal, amountGrams)
      setReportBaselineFoodScore(previousFoodScore)
      setReport(nextReport)
      onReport?.(nextReport)
      setAchievementSeen(false)
      dispatch({ type: 'reset' })
      setStatus('')
    } catch {
      setStatus('That report could not be prepared. Try again in a moment.')
    } finally {
      setLoading(false)
    }
  }

  const recordAnotherMeal = () => {
    setReport(null)
    dispatch({ type: 'reset' })
    setStatus('')
    setAchievementSeen(false)
  }

  if (!report) {
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
      </main>
    )
  }

  const screen = [
    <GozenLedgerScreen key="ledger" report={report} distanceMetres={distanceMetres} elapsedSeconds={elapsedSeconds} locale={locale} />,
    <NutrientCompareScreen key="compare" report={report} standard={flow.standard} onStandardChange={(standard) => dispatch({ type: 'setStandard', standard })} locale={locale} />,
    <TownDeliveryScreen key="town" report={report} locale={locale} />,
    <TomorrowSuggestScreen key="tomorrow" report={report} locale={locale} onRecordMeal={recordAnotherMeal} onViewGoyo={() => onContinue?.()} onBackToTown={onReturnToTown ?? onBack} />,
  ][flow.step - 1]
  const achievement = flow.step === 3 && !achievementSeen
    ? <AchievementScene mode={achievementModeFor(report)} deltas={foodHallDeltasForReport(report, reportBaselineFoodScore, locale)} locale={locale} onComplete={() => setAchievementSeen(true)} />
    : null

  return (
    <section className="nutrition-flow" aria-label="Nutrition report flow">
      <nav className="nutrition-flow-controls" aria-label="Nutrition report steps">
        <button type="button" onClick={flow.step === 1 ? onBack : () => dispatch({ type: 'previous' })}>
          ← {flow.step === 1 ? backLabel : labels.back}
        </button>
        <small aria-live="polite">{labels.step(flow.step)}</small>
        <button type="button" onClick={() => dispatch({ type: 'next' })} disabled={flow.step === 4}>
          {labels.next} →
        </button>
      </nav>
      {screen}
      {achievement}
    </section>
  )
}
