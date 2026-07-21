import { MIKOTO, isCourierId, type CourierId } from './couriers'

export type AvailableMinutes = 5 | 10 | 15
export type Energy = 'Low' | 'Steady' | 'Ready'

export interface MissionInput {
  availableMinutes: AvailableMinutes
  energy: Energy
  courierId: CourierId
  displayName?: string
}

export interface Mission {
  courierId: CourierId
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
  courierId: CourierId
}

export interface MissionCompletion {
  rank: string
  epilogue: string
  nextMissionTeaser: string
}

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
  const dispatches = [
    ['the Lantern Dispatch', 'A sealed dispatch awaits beneath the evening lanterns.'],
    ['the Dawn Reply', 'A reply must reach its door before the morning crowd gathers.'],
    ['the Wayfarer’s Token', 'A wayfarer’s token needs a steady hand and a clear road.'],
  ] as const
  const [dispatch, premise] = dispatches[hashText(seed) % dispatches.length]
  return {
    courierId: MIKOTO.id,
    title: `${MIKOTO.gameName}: ${dispatch}`,
    briefing: `${MIKOTO.missionStartQuote} ${premise}`,
    milestones: {
      25: `${MIKOTO.gameName} marks the first stretch. ${MIKOTO.role} keeps the route clear.`,
      50: `Halfway to the handoff — ${MIKOTO.normalQuote}`,
      75: `${MIKOTO.base} feels close. One more measured push for the dispatch.`,
    },
    historicalNote: MIKOTO.missionStartQuote,
    completionStyle: `${MIKOTO.titleEn} poise, carried with ${input.energy.toLowerCase()} resolve`,
  }
}

export function mockCompleteMission(summary: CompletionSummary): MissionCompletion {
  const rank = summary.completionPercent >= 100 ? 'Edo Roadrunner' : 'Steady Courier'
  return {
    rank,
    epilogue: `${MIKOTO.missionCompleteQuote} Your ${Math.round(summary.distanceMeters)} metre journey reached its destination as an ${rank}.`,
    nextMissionTeaser: `${MIKOTO.base} will have another dispatch ready.`,
  }
}

export function isMissionInput(value: unknown): value is MissionInput {
  if (!value || typeof value !== 'object') return false
  const input = value as Record<string, unknown>
  return (
    (input.availableMinutes === 5 || input.availableMinutes === 10 || input.availableMinutes === 15) &&
    (input.energy === 'Low' || input.energy === 'Steady' || input.energy === 'Ready') &&
    isCourierId(input.courierId) &&
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
    typeof summary.missionTitle === 'string' &&
    isCourierId(summary.courierId)
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
    isCourierId(mission.courierId) &&
    isNonEmptyString(mission.historicalNote) &&
    isNonEmptyString(mission.completionStyle) &&
    mission.historicalNote === MIKOTO.missionStartQuote
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
