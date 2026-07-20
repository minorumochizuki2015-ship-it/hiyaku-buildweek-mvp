import {
  isCompletionSummary,
  isMissionInput,
  mockCompleteMission,
  mockGenerateMission,
} from '../shared/mockMission'

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

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: jsonHeaders })
    if (request.method !== 'POST') return json({ error: 'Use POST for this endpoint.' }, 405)

    const body = await readJson(request)
    if (url.pathname === '/api/mission') {
      if (!isMissionInput(body)) {
        return json({ error: 'Invalid mission input. Expected availableMinutes (5, 10, or 15), energy, and optional displayName.' }, 400)
      }
      return json(mockGenerateMission(body))
    }
    if (url.pathname === '/api/complete') {
      if (!isCompletionSummary(body)) {
        return json({ error: 'Invalid completion summary. Expected numeric distanceMeters, durationSeconds, completionPercent, and string missionTitle.' }, 400)
      }
      return json(mockCompleteMission(body))
    }
    return json({ error: 'Not found.' }, 404)
  },
} satisfies ExportedHandler
