import {
  isCompletionRequest,
  isMissionRequest,
  mockCompleteMission,
  mockGenerateMission,
  type CompletionRequest,
  type MissionRequest,
  type NarrativeLocale,
} from '../shared/mockMission'
import { COURIERS, courierCopy } from '../shared/couriers'
import { isNutritionRequest } from '../shared/nutrition'
import { buildNutritionReport } from './nutrition'

interface Env {
  OPENAI_API_KEY?: string
}

interface NarrativeMission {
  title: string
  briefing: string
  milestones: Record<25 | 50 | 75, string>
  completionStyle: string
}

interface NarrativeCompletion {
  epilogue: string
  nextMissionTeaser: string
}

const openAiUrl = 'https://api.openai.com/v1/chat/completions'
const openAiModel = 'gpt-5.6-terra'
const openAiTimeoutMs = 8_000

const jsonHeaders = {
  'content-type': 'application/json; charset=UTF-8',
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-allow-headers': 'content-type',
}

function json(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), { status, headers: jsonHeaders })
}

async function readJson(request: Request): Promise<unknown | null> {
  try {
    return await request.json()
  } catch {
    return null
  }
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isNarrativeMission(value: unknown): value is NarrativeMission {
  if (!value || typeof value !== 'object') return false
  const mission = value as Record<string, unknown>
  if (!mission.milestones || typeof mission.milestones !== 'object') return false
  const milestones = mission.milestones as Record<string, unknown>
  return (
    isNonEmptyString(mission.title) &&
    isNonEmptyString(mission.briefing) &&
    isNonEmptyString(milestones['25']) &&
    isNonEmptyString(milestones['50']) &&
    isNonEmptyString(milestones['75']) &&
    isNonEmptyString(mission.completionStyle)
  )
}

function isNarrativeCompletion(value: unknown): value is NarrativeCompletion {
  if (!value || typeof value !== 'object') return false
  const completion = value as Record<string, unknown>
  return isNonEmptyString(completion.epilogue) && isNonEmptyString(completion.nextMissionTeaser)
}

const cjkCharacters = /[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff]/u
const latinCharacters = /[A-Za-z]/u

function textMatchesLocale(text: string, locale: NarrativeLocale): boolean {
  return locale === 'en'
    ? !cjkCharacters.test(text)
    : cjkCharacters.test(text) && !latinCharacters.test(text)
}

function narrativeMissionMatchesLocale(value: NarrativeMission, locale: NarrativeLocale): boolean {
  return [
    value.title,
    value.briefing,
    value.milestones[25],
    value.milestones[50],
    value.milestones[75],
    value.completionStyle,
  ].every((text) => textMatchesLocale(text, locale))
}

function narrativeCompletionMatchesLocale(value: NarrativeCompletion, locale: NarrativeLocale): boolean {
  return [value.epilogue, value.nextMissionTeaser].every((text) => textMatchesLocale(text, locale))
}

function chatContent(value: unknown): string | null {
  if (!value || typeof value !== 'object') return null
  const payload = value as { choices?: Array<{ message?: { content?: unknown } }> }
  const content = payload.choices?.[0]?.message?.content
  return typeof content === 'string' ? content : null
}

async function callOpenAi<T>(env: Env, requestBody: unknown, validate: (value: unknown) => value is T): Promise<T | null> {
  if (!env.OPENAI_API_KEY) return null

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), openAiTimeoutMs)
    try {
      const response = await fetch(openAiUrl, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      })
      if (!response.ok) continue

      const content = chatContent(await response.json())
      if (!content) continue
      const parsed: unknown = JSON.parse(content)
      if (validate(parsed)) return parsed
    } catch {
      // The second attempt, then the deterministic local fallback, keeps the UI responsive.
    } finally {
      clearTimeout(timeout)
    }
  }

  return null
}

const missionSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'briefing', 'milestones', 'completionStyle'],
  properties: {
    title: { type: 'string' },
    briefing: { type: 'string' },
    milestones: {
      type: 'object',
      additionalProperties: false,
      required: ['25', '50', '75'],
      properties: {
        25: { type: 'string' },
        50: { type: 'string' },
        75: { type: 'string' },
      },
    },
    completionStyle: { type: 'string' },
  },
}

const completionSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['epilogue', 'nextMissionTeaser'],
  properties: {
    epilogue: { type: 'string' },
    nextMissionTeaser: { type: 'string' },
  },
}

function courierFor(courierId: MissionRequest['courierId']) {
  return COURIERS.find((courier) => courier.id === courierId)!
}

function languageInstruction(locale: NarrativeLocale): string {
  return locale === 'en'
    ? 'Write every narrative field entirely in natural English. Do not use Japanese characters, Japanese words, or Japanese punctuation.'
    : '各ナラティブ項目は自然な日本語だけで書いてください。英語の語句やローマ字を混ぜないでください。'
}

function missionRequest(input: MissionRequest): unknown {
  const courier = courierFor(input.courierId)
  const persona = courierCopy(input.locale, courier)
  return {
    model: openAiModel,
    messages: [
      {
        role: 'system',
        content: `You write concise, warm fictional Edo courier mission narrative. Return only JSON matching the supplied schema. ${languageInstruction(input.locale)} Write in the selected courier’s fantasy persona and voice. Use the supplied class and landmark as fictional setting texture. Do not state, imply, or invent historical facts, dates, achievements, biographies, or a historicalNote field; the app owns all history.`,
      },
      {
        role: 'user',
        content: `Create a mission for this app-decided input: ${JSON.stringify(input)}. Courier persona: ${JSON.stringify(persona)}. Tailor tone and effort to availableMinutes and energy. The optional displayName may be used naturally. Provide a title, a briefing, encouragement for progress at 25%, 50%, and 75%, and a completionStyle. Keep every field short and concrete.`,
      },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: { name: 'hiyaku_mission_narrative', strict: true, schema: missionSchema },
    },
  }
}

function completionRequest(summary: CompletionRequest, rank: string): unknown {
  const courier = courierFor(summary.courierId)
  const persona = courierCopy(summary.locale, courier)
  return {
    model: openAiModel,
    messages: [
      {
        role: 'system',
        content: `You write concise, warm fictional Edo courier arrival narrative. Return only JSON matching the supplied schema. ${languageInstruction(summary.locale)} Write in the selected courier’s fantasy persona and voice. The app has already decided completion and rank; do not change or evaluate them. Do not state, imply, or invent historical facts, dates, achievements, or biographies.`,
      },
      {
        role: 'user',
        content: `Write an arrival epilogue and a next-mission teaser for this completed courier run: ${JSON.stringify({ ...summary, rank })}. Courier persona: ${JSON.stringify(persona)}. Explicitly weave the missionTitle and rounded distance in metres into the epilogue.`,
      },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: { name: 'hiyaku_completion_narrative', strict: true, schema: completionSchema },
    },
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: jsonHeaders })
    if (request.method !== 'POST') return json({ error: 'Use POST for this endpoint.' }, 405)

    const body = await readJson(request)
    if (url.pathname === '/api/nutrition') {
      if (!isNutritionRequest(body)) {
        return json({ error: 'Invalid nutrition input. Expected a meal description and an amount from 25 to 2000 grams.' }, 400)
      }
      return json(await buildNutritionReport(body, env))
    }
    if (url.pathname === '/api/mission') {
      if (!isMissionRequest(body)) {
        return json({ error: 'Invalid mission input. Expected availableMinutes (5, 10, or 15), energy, courierId, locale (en or ja), and optional displayName.' }, 400)
      }
      const fallback = mockGenerateMission(body, body.locale)
      const narrative = await callOpenAi(env, missionRequest(body), (value): value is NarrativeMission => isNarrativeMission(value) && narrativeMissionMatchesLocale(value, body.locale))
      return json(narrative ? { ...narrative, courierId: body.courierId, locale: body.locale, historicalNote: fallback.historicalNote } : fallback)
    }
    if (url.pathname === '/api/complete') {
      if (!isCompletionRequest(body)) {
        return json({ error: 'Invalid completion summary. Expected numeric distanceMeters, durationSeconds, completionPercent, string missionTitle, courierId, and locale (en or ja).' }, 400)
      }
      const fallback = mockCompleteMission(body, body.locale)
      const narrative = await callOpenAi(env, completionRequest(body, fallback.rank), (value): value is NarrativeCompletion => isNarrativeCompletion(value) && narrativeCompletionMatchesLocale(value, body.locale))
      return json(narrative ? { ...narrative, rank: fallback.rank } : fallback)
    }
    return json({ error: 'Not found.' }, 404)
  },
} satisfies { fetch(request: Request, env: Env): Response | Promise<Response> }
