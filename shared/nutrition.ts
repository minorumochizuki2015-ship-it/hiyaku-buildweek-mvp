export type NutrientKey = 'energy' | 'protein' | 'fat' | 'carbohydrates' | 'fiber' | 'sodium'
export type NutrientSource = 'open-food-facts' | 'gpt-5.6-sol' | 'deterministic-fallback'
export type NutritionSource = NutrientSource | 'hybrid'
export type GapJudgment = 'Low' | 'OK' | 'High'
export const NUTRITION_STANDARDS = ['japan', 'fda', 'eu', 'international'] as const
export type NutritionStandard = typeof NUTRITION_STANDARDS[number]

export const NUTRITION_STANDARD_LABELS: Record<NutritionStandard, string> = {
  japan: 'Japan',
  fda: 'FDA',
  eu: 'EU',
  international: 'International',
}

export interface NutrientDefinition {
  key: NutrientKey
  label: string
  edoLabel: string
  offField: string
  unit: 'kcal' | 'g'
  // Retained for the Worker’s established Japanese baseline.
  referenceValue: number
  // Single-meal comparison references for the client-side standard selector.
  referenceValues: Record<NutritionStandard, number>
}

// A single adult meal baseline, derived from the Japanese daily framing over three meals.
export const NUTRIENT_DEFINITIONS: readonly NutrientDefinition[] = [
  { key: 'energy', label: 'Energy', edoLabel: '力飯値', offField: 'energy-kcal_100g', unit: 'kcal', referenceValue: 700, referenceValues: { japan: 700, fda: 666.7, eu: 666.7, international: 666.7 } },
  { key: 'protein', label: 'Protein', edoLabel: '御力札', offField: 'proteins_100g', unit: 'g', referenceValue: 20, referenceValues: { japan: 20, fda: 16.7, eu: 16.7, international: 16.7 } },
  { key: 'fat', label: 'Fat', edoLabel: '油分札', offField: 'fat_100g', unit: 'g', referenceValue: 18, referenceValues: { japan: 18, fda: 26, eu: 23.3, international: 22.2 } },
  { key: 'carbohydrates', label: 'Carbs', edoLabel: '糖質札', offField: 'carbohydrates_100g', unit: 'g', referenceValue: 70, referenceValues: { japan: 70, fda: 91.7, eu: 86.7, international: 83.3 } },
  { key: 'fiber', label: 'Fiber', edoLabel: '整え札', offField: 'fiber_100g', unit: 'g', referenceValue: 7, referenceValues: { japan: 7, fda: 9.3, eu: 8.3, international: 8.3 } },
  // The Worker currently tracks sodium only. “Micros” is an honest display-level proxy, not a full micronutrient estimate.
  { key: 'sodium', label: 'Micros', edoLabel: '微量札', offField: 'sodium_100g', unit: 'g', referenceValue: 0.8, referenceValues: { japan: 0.8, fda: 0.8, eu: 0.8, international: 0.7 } },
] as const

export interface NutritionRequest {
  description: string
  amountGrams: number
}

export interface NutrientEstimate {
  key: NutrientKey
  amount: number
  source: NutrientSource
  judgment: GapJudgment
}

export interface NutritionReport {
  description: string
  amountGrams: number
  productName: string | null
  source: NutritionSource
  nutrients: NutrientEstimate[]
  foodScore: number
}

function isNutrientKey(value: unknown): value is NutrientKey {
  return typeof value === 'string' && NUTRIENT_DEFINITIONS.some((nutrient) => nutrient.key === value)
}

function isNutrientSource(value: unknown): value is NutrientSource {
  return value === 'open-food-facts' || value === 'gpt-5.6-sol' || value === 'deterministic-fallback'
}

function isGapJudgment(value: unknown): value is GapJudgment {
  return value === 'Low' || value === 'OK' || value === 'High'
}

export function isNutritionRequest(value: unknown): value is NutritionRequest {
  if (!value || typeof value !== 'object') return false
  const request = value as Record<string, unknown>
  return (
    typeof request.description === 'string' &&
    request.description.trim().length > 0 &&
    request.description.length <= 160 &&
    typeof request.amountGrams === 'number' &&
    Number.isFinite(request.amountGrams) &&
    request.amountGrams >= 25 &&
    request.amountGrams <= 2_000
  )
}

export function isNutritionReport(value: unknown): value is NutritionReport {
  if (!value || typeof value !== 'object') return false
  const report = value as Record<string, unknown>
  if (!isNutritionRequest(report) || (report.productName !== null && typeof report.productName !== 'string')) return false
  if (report.source !== 'open-food-facts' && report.source !== 'gpt-5.6-sol' && report.source !== 'deterministic-fallback' && report.source !== 'hybrid') return false
  if (typeof report.foodScore !== 'number' || !Number.isFinite(report.foodScore) || report.foodScore < 0 || report.foodScore > 100) return false
  if (!Array.isArray(report.nutrients) || report.nutrients.length !== NUTRIENT_DEFINITIONS.length) return false
  const seen = new Set<NutrientKey>()
  return report.nutrients.every((nutrient) => {
    if (!nutrient || typeof nutrient !== 'object') return false
    const item = nutrient as Record<string, unknown>
    if (!isNutrientKey(item.key) || seen.has(item.key)) return false
    seen.add(item.key)
    return typeof item.amount === 'number' && Number.isFinite(item.amount) && item.amount >= 0 && isNutrientSource(item.source) && isGapJudgment(item.judgment)
  })
}
