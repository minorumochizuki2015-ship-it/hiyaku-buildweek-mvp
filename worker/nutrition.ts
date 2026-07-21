import {
  foodScoreFor,
  judgeGap,
  NUTRIENT_DEFINITIONS,
  perMealReferenceValue,
  type NutrientEstimate,
  type NutrientKey,
  type NutritionAiAttempt,
  type NutrientSource,
  type NutritionReport,
  type NutritionRequest,
} from '../shared/nutrition'

export { foodScoreFor, judgeGap } from '../shared/nutrition'

interface Env {
  OPENAI_API_KEY?: string
}

interface OpenFoodFactsProduct {
  product_name?: unknown
  nutriments?: unknown
}

interface OpenFoodFactsSearch {
  page_count?: unknown
  products?: unknown
}

interface AiEstimate {
  nutrients: Array<{ key: NutrientKey; amount: number }>
}

interface AiEstimateResult {
  attempt: NutritionAiAttempt
  values: Partial<Record<NutrientKey, number>>
}

const openAiUrl = 'https://api.openai.com/v1/chat/completions'
const openAiModel = 'gpt-5.6-sol'
const timeoutMs = 8_000

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

function isFiniteNonNegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
}

function isNutrientKey(value: unknown): value is NutrientKey {
  return typeof value === 'string' && NUTRIENT_DEFINITIONS.some((nutrient) => nutrient.key === value)
}

async function fetchWithRetry(input: RequestInfo | URL, init?: RequestInit): Promise<Response | null> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const response = await fetch(input, { ...init, signal: controller.signal })
      if (response.ok) return response
    } catch {
      // Retry once, then the caller selects its deterministic path.
    } finally {
      clearTimeout(timeout)
    }
  }
  return null
}

async function findOpenFoodFactsProduct(description: string): Promise<OpenFoodFactsProduct | null> {
  const url = new URL('https://world.openfoodfacts.org/cgi/search.pl')
  url.searchParams.set('search_terms', description)
  url.searchParams.set('search_simple', '1')
  url.searchParams.set('action', 'process')
  url.searchParams.set('json', '1')
  url.searchParams.set('fields', 'product_name,nutriments')
  url.searchParams.set('page_size', '1')
  const response = await fetchWithRetry(url)
  if (!response) return null
  try {
    const payload = await response.json() as OpenFoodFactsSearch
    if (payload.page_count === 0) return null
    if (!Array.isArray(payload.products) || payload.products.length === 0) return null
    const product = payload.products[0]
    if (!product || typeof product !== 'object') return null
    const candidate = product as OpenFoodFactsProduct
    // Some OFF edge responses return a global first result for an unmatched term. Treat that as a miss,
    // rather than presenting unrelated package data as the user's meal.
    if (typeof candidate.product_name !== 'string' || !productNameMatches(description, candidate.product_name)) return null
    return candidate
  } catch {
    return null
  }
}

function productNameMatches(description: string, productName: string): boolean {
  const normalize = (value: string) => value.toLocaleLowerCase().replace(/[\s\p{P}\p{S}_]+/gu, '')
  const meal = normalize(description)
  const product = normalize(productName)
  return meal.length >= 3 && product.length >= 3 && (meal.includes(product) || product.includes(meal))
}

function valuesFromProduct(product: OpenFoodFactsProduct, amountGrams: number): Partial<Record<NutrientKey, number>> {
  if (!product.nutriments || typeof product.nutriments !== 'object') return {}
  const nutriments = product.nutriments as Record<string, unknown>
  const scale = amountGrams / 100
  const values: Partial<Record<NutrientKey, number>> = {}
  for (const nutrient of NUTRIENT_DEFINITIONS) {
    const per100g = nutriments[nutrient.offField]
    if (isFiniteNonNegativeNumber(per100g)) values[nutrient.key] = roundAmount(per100g * scale)
  }
  return values
}

function isAiEstimate(value: unknown, missingKeys: readonly NutrientKey[]): value is AiEstimate {
  if (!value || typeof value !== 'object') return false
  const nutrients = (value as Record<string, unknown>).nutrients
  if (!Array.isArray(nutrients) || nutrients.length !== missingKeys.length) return false
  const seen = new Set<NutrientKey>()
  return nutrients.every((nutrient) => {
    if (!nutrient || typeof nutrient !== 'object') return false
    const item = nutrient as Record<string, unknown>
    if (!isNutrientKey(item.key) || !missingKeys.includes(item.key) || seen.has(item.key) || !isFiniteNonNegativeNumber(item.amount)) return false
    seen.add(item.key)
    return true
  })
}

function chatContent(value: unknown): string | null {
  if (!value || typeof value !== 'object') return null
  const payload = value as { choices?: Array<{ message?: { content?: unknown } }> }
  const content = payload.choices?.[0]?.message?.content
  return typeof content === 'string' ? content : null
}

export function aiRequest(input: NutritionRequest, missingKeys: readonly NutrientKey[]): unknown {
  return {
    model: openAiModel,
    messages: [
      {
        role: 'system',
        content: 'Estimate only the requested missing meal nutrients. Values are totals for the stated grams, in kcal for energy and grams for all others. Do not give medical advice, commentary, substitutions, or values for nutrients not requested. Return only JSON matching the schema.',
      },
      {
        role: 'user',
        content: `Meal description: ${input.description}. Logged amount: ${input.amountGrams}g. Estimate only these missing nutrient keys: ${missingKeys.join(', ')}.`,
      },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'hiyaku_missing_nutrition_estimates',
        strict: true,
        schema: {
          type: 'object',
          additionalProperties: false,
          required: ['nutrients'],
          properties: {
            nutrients: {
              type: 'array',
              // Strict Structured Outputs rejects these array/number constraints; isAiEstimate
              // enforces the exact keys, length, uniqueness, and non-negative finite amounts in code.
              items: {
                type: 'object',
                additionalProperties: false,
                required: ['key', 'amount'],
                properties: {
                  key: { type: 'string', enum: NUTRIENT_DEFINITIONS.map((nutrient) => nutrient.key) },
                  amount: { type: 'number' },
                },
              },
            },
          },
        },
      },
    },
  }
}

async function estimateMissingWithAi(env: Env, input: NutritionRequest, missingKeys: readonly NutrientKey[]): Promise<AiEstimateResult> {
  if (!env.OPENAI_API_KEY) return { attempt: { status: 'skipped-no-api-key', estimatedCount: 0 }, values: {} }

  let failureReason = 'request failed'
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const controller = new AbortController()
    let timedOut = false
    const timeout = setTimeout(() => {
      timedOut = true
      controller.abort()
    }, timeoutMs)
    try {
      const response = await fetch(openAiUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${env.OPENAI_API_KEY}` },
        body: JSON.stringify(aiRequest(input, missingKeys)),
        signal: controller.signal,
      })
      if (!response.ok) {
        failureReason = `HTTP ${response.status}`
        continue
      }
      const content = chatContent(await response.json())
      if (!content) {
        failureReason = 'invalid response'
        continue
      }
      const parsed: unknown = JSON.parse(content)
      if (!isAiEstimate(parsed, missingKeys)) {
        failureReason = 'invalid response'
        continue
      }
      return {
        attempt: { status: 'succeeded', estimatedCount: parsed.nutrients.length },
        values: Object.fromEntries(parsed.nutrients.map((nutrient) => [nutrient.key, roundAmount(nutrient.amount)])) as Partial<Record<NutrientKey, number>>,
      }
    } catch {
      failureReason = timedOut ? 'request timed out' : 'request failed'
    } finally {
      clearTimeout(timeout)
    }
  }
  return { attempt: { status: 'failed', estimatedCount: 0, reason: failureReason }, values: {} }
}

export async function buildNutritionReport(input: NutritionRequest, env: Env): Promise<NutritionReport> {
  const product = await findOpenFoodFactsProduct(input.description)
  const offValues = product ? valuesFromProduct(product, input.amountGrams) : {}
  const missingKeys = NUTRIENT_DEFINITIONS.filter((nutrient) => offValues[nutrient.key] === undefined).map((nutrient) => nutrient.key)
  const aiResult: AiEstimateResult = missingKeys.length === 0
    ? { attempt: { status: 'not-needed', estimatedCount: 0 } as const, values: {} }
    : await estimateMissingWithAi(env, input, missingKeys)
  const aiValues = aiResult.values
  const fallbackScale = input.amountGrams / 100

  const nutrients: NutrientEstimate[] = NUTRIENT_DEFINITIONS.map((definition) => {
    const offValue = offValues[definition.key]
    const aiValue = aiValues?.[definition.key]
    const amount = offValue ?? aiValue ?? roundAmount(deterministicPer100g[definition.key] * fallbackScale)
    const source: NutrientSource = offValue !== undefined ? 'open-food-facts' : aiValue !== undefined ? 'gpt-5.6-sol' : 'deterministic-fallback'
    return { key: definition.key, amount, source, judgment: judgeGap(amount, perMealReferenceValue(definition, 'japan')) }
  })
  const distinctSources = new Set(nutrients.map((nutrient) => nutrient.source))
  const source = distinctSources.size === 1 ? nutrients[0]!.source : 'hybrid'

  return {
    description: input.description.trim(),
    amountGrams: input.amountGrams,
    productName: product && typeof product.product_name === 'string' && product.product_name.trim() ? product.product_name.trim() : null,
    source,
    nutrients,
    foodScore: foodScoreFor(Object.fromEntries(nutrients.map((nutrient) => [nutrient.key, nutrient.amount])) as Record<NutrientKey, number>),
    aiAttempt: aiResult.attempt,
  }
}
