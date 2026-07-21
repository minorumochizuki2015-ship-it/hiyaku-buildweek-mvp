import { useReducer, useState, type FormEvent } from 'react'
import {
  isNutritionReport,
  judgeGap,
  NUTRIENT_DEFINITIONS,
  perMealReferenceValue,
  type NutrientKey,
  type NutritionReport,
  type NutritionStandard,
} from '../../shared/nutrition'
import { calculateActivityScores, toGameResources } from '../../shared/activity'
import { GozenLedgerScreen } from './GozenLedgerScreen'
import { NutrientCompareScreen } from './NutrientCompareScreen'
import { TomorrowSuggestScreen } from './TomorrowSuggestScreen'
import { TownDeliveryScreen } from './TownDeliveryScreen'
import { AchievementScene, type AchievementDelta } from '../screens/AchievementScene'
import { t } from '../i18n'
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

export type AchievementSeenAction =
  | { type: 'reportProduced' }
  | { type: 'sceneComplete' }

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

export function achievementSeenReducer(_seen: boolean, action: AchievementSeenAction): boolean {
  switch (action.type) {
    case 'sceneComplete':
      return true
    case 'reportProduced':
      return false
  }
}

const initialFlowState: NutritionFlowState = { step: 1, standard: 'japan' }

const CLIENT_API_TIMEOUT_MS = 3_000
const deterministicPer100g: Record<NutrientKey, number> = {
  energy: 150,
  protein: 6,
  fat: 5,
  carbohydrates: 20,
  fiber: 3,
  sodium: 0.25,
}

function roundAmount(value: number): number {
  return Math.round(value * 10) / 10
}

function nutritionCredit(amount: number, perMealReference: number): number {
  const ratio = amount / perMealReference
  if (ratio >= 0.85 && ratio <= 1.15) return 1
  if (ratio < 0.85) return Math.max(0, ratio / 0.85)
  return Math.max(0, 1 - (ratio - 1.15) / (2 * 0.85))
}

/** Mirrors the Worker’s deterministic fallback values when its local proxy is unavailable. */
export function localNutritionReport(description: string, amountGrams: number, locale: Locale): NutritionReport {
  const nutrients = NUTRIENT_DEFINITIONS.map((definition) => {
    const amount = roundAmount(deterministicPer100g[definition.key] * amountGrams / 100)
    return {
      key: definition.key,
      amount,
      source: 'deterministic-fallback' as const,
      judgment: judgeGap(amount, perMealReferenceValue(definition, 'japan')),
    }
  })
  const foodScore = Math.round(100 * nutrients.reduce(
    (total, nutrient) => total + nutritionCredit(nutrient.amount, perMealReferenceValue(NUTRIENT_DEFINITIONS.find((definition) => definition.key === nutrient.key)!, 'japan')),
    0,
  ) / NUTRIENT_DEFINITIONS.length)

  return {
    description: description.trim(),
    amountGrams,
    productName: null,
    source: 'deterministic-fallback',
    nutrients,
    foodScore,
    aiAttempt: { status: 'failed', estimatedCount: 0, reason: t(locale, 'offline.nutrition') },
  }
}

export async function requestNutritionWithFallback(description: string, amountGrams: number, locale: Locale): Promise<NutritionReport> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), CLIENT_API_TIMEOUT_MS)
  try {
    const response = await fetch('/api/nutrition', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ description, amountGrams }),
      signal: controller.signal,
    })
    if (!response.ok) throw new Error(`Nutrition request failed with ${response.status}`)
    const value: unknown = await response.json()
    if (!isNutritionReport(value)) throw new Error('Nutrition response did not match the expected shape')
    return value
  } catch {
    return localNutritionReport(description, amountGrams, locale)
  } finally {
    clearTimeout(timeout)
  }
}

const flowLabels = {
  en: { back: 'Back', next: 'Next', step: (step: FlowStep) => `${step}/4` },
  ja: { back: '戻る', next: '次へ', step: (step: FlowStep) => `${step}/4` },
} as const

export function achievementModeFor(report: NutritionReport, hasSeenCelebration: boolean): 'light' | 'video' {
  // A produced report means the meal reached town. Score still determines the
  // deltas and facility ranks; it does not make the delivery moment conditional.
  // The first delivery in a session receives the full reflection. Later meals
  // still receive their deltas through the light presentation.
  void report
  return hasSeenCelebration ? 'light' : 'video'
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
  const [achievementSeen, dispatchAchievementSeen] = useReducer(achievementSeenReducer, false)
  const [hasSeenCelebration, setHasSeenCelebration] = useState(false)
  const [flow, dispatch] = useReducer(nutritionFlowReducer, initialFlowState)
  const labels = flowLabels[locale]

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const meal = description.trim()
    if (!meal) return
    setLoading(true)
    setStatus('Looking up your meal…')
    try {
      const nextReport = await requestNutritionWithFallback(meal, amountGrams, locale)
      setReportBaselineFoodScore(previousFoodScore)
      setReport(nextReport)
      onReport?.(nextReport)
      dispatchAchievementSeen({ type: 'reportProduced' })
      dispatch({ type: 'reset' })
      setStatus('')
    } finally {
      setLoading(false)
    }
  }

  const recordAnotherMeal = () => {
    setReport(null)
    dispatch({ type: 'reset' })
    setStatus('')
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
    ? <AchievementScene mode={achievementModeFor(report, hasSeenCelebration)} deltas={foodHallDeltasForReport(report, reportBaselineFoodScore, locale)} locale={locale} onComplete={() => {
      dispatchAchievementSeen({ type: 'sceneComplete' })
      setHasSeenCelebration(true)
    }} />
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
