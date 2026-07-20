export type AvailableMinutes = 5 | 10 | 15
export type Energy = 'Low' | 'Steady' | 'Ready'

export interface MissionInput {
  availableMinutes: AvailableMinutes
  energy: Energy
  displayName?: string
}

export interface Mission {
  title: string
  briefing: string
  milestones: Record<25 | 50 | 75, string>
  historicalNote: string
  completionStyle: string
}

export interface CompletionSummary {
  distanceMeters: number
  durationSeconds: number
  completionPercent: number
  missionTitle: string
}

export interface MissionCompletion {
  rank: string
  epilogue: string
  nextMissionTeaser: string
}

const missions: Mission[] = [
  {
    title: 'The Lantern Ledger',
    briefing: 'Carry the evening ledger from Nihonbashi before the last lantern is lit.',
    milestones: {
      25: 'The bridge keeper nods. Your first steps are on time.',
      50: 'Halfway there — keep the ledger dry and your pace steady.',
      75: 'The lanterns are close. One last careful push.',
    },
    historicalNote: 'Nihonbashi was the traditional starting point for the five great roads of Edo.',
    completionStyle: 'Measured and dependable',
  },
  {
    title: 'Rain at Tokaido Gate',
    briefing: 'A message must reach the gate before the rain turns the road to silver.',
    milestones: {
      25: 'A cool drop lands on your sleeve. The road is yours.',
      50: 'The gate flag is visible beyond the rooftops.',
      75: 'Your message is nearly safe from the weather.',
    },
    historicalNote: 'The Tokaido connected Edo and Kyoto and was the most traveled of the five routes.',
    completionStyle: 'Calm under pressure',
  },
  {
    title: 'The Tea House Reply',
    briefing: 'Deliver a gracious reply before the tea house closes its sliding doors.',
    milestones: {
      25: 'The scent of roasted tea points you onward.',
      50: 'Your destination is now part of the evening bustle.',
      75: 'The tea house bell is within reach.',
    },
    historicalNote: 'Edo tea houses were lively social stops for travelers, messengers, and merchants.',
    completionStyle: 'Warm and swift',
  },
]

function hashText(value: string): number {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

export function mockGenerateMission(input: MissionInput): Mission {
  const seed = `${input.availableMinutes}|${input.energy}|${input.displayName?.trim().toLowerCase() ?? ''}`
  return missions[hashText(seed) % missions.length]
}

export function mockCompleteMission(summary: CompletionSummary): MissionCompletion {
  const rank = summary.completionPercent >= 100 ? 'Edo Roadrunner' : 'Steady Courier'
  return {
    rank,
    epilogue: `${summary.missionTitle} is complete. Your ${Math.round(summary.distanceMeters)} metre journey reached its destination as an ${rank}.`,
    nextMissionTeaser: 'Next time, a dawn message waits at the river crossing.',
  }
}

export function isMissionInput(value: unknown): value is MissionInput {
  if (!value || typeof value !== 'object') return false
  const input = value as Record<string, unknown>
  return (
    (input.availableMinutes === 5 || input.availableMinutes === 10 || input.availableMinutes === 15) &&
    (input.energy === 'Low' || input.energy === 'Steady' || input.energy === 'Ready') &&
    (input.displayName === undefined || typeof input.displayName === 'string')
  )
}

export function isCompletionSummary(value: unknown): value is CompletionSummary {
  if (!value || typeof value !== 'object') return false
  const summary = value as Record<string, unknown>
  return (
    typeof summary.distanceMeters === 'number' &&
    typeof summary.durationSeconds === 'number' &&
    typeof summary.completionPercent === 'number' &&
    typeof summary.missionTitle === 'string'
  )
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

export function isMission(value: unknown): value is Mission {
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
    isNonEmptyString(mission.historicalNote) &&
    isNonEmptyString(mission.completionStyle)
  )
}

export function isMissionCompletion(value: unknown): value is MissionCompletion {
  if (!value || typeof value !== 'object') return false
  const completion = value as Record<string, unknown>
  return (
    isNonEmptyString(completion.rank) &&
    isNonEmptyString(completion.epilogue) &&
    isNonEmptyString(completion.nextMissionTeaser)
  )
}
