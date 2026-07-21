export type NutrientKey = 'energy' | 'protein' | 'fat' | 'carbohydrates' | 'fiber' | 'sodium'
export type NutrientSource = 'open-food-facts' | 'gpt-5.6-sol' | 'deterministic-fallback'
export type NutritionSource = NutrientSource | 'hybrid'
export type GapJudgment = 'Low' | 'OK' | 'High'

export interface NutrientDefinition {
  key: NutrientKey
  label: string
  edoLabel: string
  offField: string
  unit: 'kcal' | 'g'
  referenceValue: number
}

// A single adult meal baseline, derived from the Japanese daily framing over three meals.
export const NUTRIENT_DEFINITIONS: readonly NutrientDefinition[] = [
  { key: 'energy', label: 'Energy', edoLabel: '力飯値', offField: 'energy-kcal_100g', unit: 'kcal', referenceValue: 700 },
  { key: 'protein', label: 'Protein', edoLabel: '御力札', offField: 'proteins_100g', unit: 'g', referenceValue: 20 },
  { key: 'fat', label: 'Fat', edoLabel: '油分札', offField: 'fat_100g', unit: 'g', referenceValue: 18 },
  { key: 'carbohydrates', label: 'Carbs', edoLabel: '糖質札', offField: 'carbohydrates_100g', unit: 'g', referenceValue: 70 },
  { key: 'fiber', label: 'Fiber', edoLabel: '整え札', offField: 'fiber_100g', unit: 'g', referenceValue: 7 },
  // Open Food Facts reports sodium in grams, so 0.8g sodium is displayed (about 2.0g salt equivalent).
  { key: 'sodium', label: 'Sodium', edoLabel: '微量札', offField: 'sodium_100g', unit: 'g', referenceValue: 0.8 },
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
