import { MIKOTO, courierCopy, isCourierId, type CourierId, type CourierLocale } from './couriers'

export type AvailableMinutes = 5 | 10 | 15
export type Energy = 'Low' | 'Steady' | 'Ready'
export type NarrativeLocale = CourierLocale

export interface MissionInput {
  availableMinutes: AvailableMinutes
  energy: Energy
  courierId: CourierId
  displayName?: string
}

export interface Mission {
  courierId: CourierId
  locale: NarrativeLocale
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

export interface MissionRequest extends MissionInput {
  locale: NarrativeLocale
}

export interface CompletionRequest extends CompletionSummary {
  locale: NarrativeLocale
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

export function mockGenerateMission(input: MissionInput, locale: NarrativeLocale): Mission {
  const seed = `${input.availableMinutes}|${input.energy}|${input.displayName?.trim().toLowerCase() ?? ''}`
  const dispatches = locale === 'en'
    ? [
        ['the Lantern Dispatch', 'A sealed dispatch awaits beneath the evening lanterns.'],
        ['the Dawn Reply', 'A reply must reach its door before the morning crowd gathers.'],
        ['the Wayfarer’s Token', 'A wayfarer’s token needs a steady hand and a clear road.'],
      ] as const
    : [
        ['宵の灯りの御用', '夕暮れの提灯の下で、封じた書状が待っています。'],
        ['暁の返書', '朝の人波が集まる前に、返書を届けなければなりません。'],
        ['旅人のしるし', '旅人のしるしを届けるには、確かな足取りと澄んだ道が必要です。'],
      ] as const
  const [dispatch, premise] = dispatches[hashText(seed) % dispatches.length]
  const courier = courierCopy(locale)
  const energy = locale === 'en'
    ? input.energy.toLowerCase()
    : ({ Low: '静かな', Steady: '落ち着いた', Ready: '力強い' } as const)[input.energy]
  return {
    courierId: MIKOTO.id,
    locale,
    title: `${courier.gameName}: ${dispatch}`,
    briefing: `${courier.missionStartQuote} ${premise}`,
    milestones: {
      25: locale === 'en'
        ? `${courier.gameName} marks the first stretch. ${courier.role} keeps the route clear.`
        : `${courier.gameName}が最初の道のりを見守ります。${courier.role}が道を整えます。`,
      50: locale === 'en'
        ? `Halfway to the handoff — ${courier.normalQuote}`
        : `引き渡しまで半ばです——${courier.normalQuote}`,
      75: locale === 'en'
        ? `${courier.base} feels close. One more measured push for the dispatch.`
        : `${courier.base}が近づいています。御用を届けるため、あとひと踏ん張りです。`,
    },
    historicalNote: courier.missionStartQuote,
    completionStyle: locale === 'en'
      ? `${courier.title} poise, carried with ${energy} resolve`
      : `${courier.title}としての落ち着きで、${energy}気を運びます。`,
  }
}

export function mockCompleteMission(summary: CompletionSummary, locale: NarrativeLocale): MissionCompletion {
  const courier = courierCopy(locale)
  const rank = locale === 'en'
    ? (summary.completionPercent >= 100 ? 'Edo Roadrunner' : 'Steady Courier')
    : (summary.completionPercent >= 100 ? '江戸の健脚飛脚' : '堅実な飛脚')
  return {
    rank,
    epilogue: locale === 'en'
      ? `${courier.missionCompleteQuote} Your ${Math.round(summary.distanceMeters)} metre journey reached its destination as an ${rank}.`
      : `${courier.missionCompleteQuote} ${Math.round(summary.distanceMeters)}メートルの道のりを終え、${rank}として目的地へ着きました。`,
    nextMissionTeaser: locale === 'en'
      ? `${courier.base} will have another dispatch ready.`
      : `${courier.base}では、次の御用が待っています。`,
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

export function isNarrativeLocale(value: unknown): value is NarrativeLocale {
  return value === 'en' || value === 'ja'
}

export function isMissionRequest(value: unknown): value is MissionRequest {
  return isMissionInput(value) && isNarrativeLocale((value as unknown as { locale?: unknown }).locale)
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

export function isCompletionRequest(value: unknown): value is CompletionRequest {
  return isCompletionSummary(value) && isNarrativeLocale((value as unknown as { locale?: unknown }).locale)
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
    isNarrativeLocale(mission.locale) &&
    isNonEmptyString(mission.historicalNote) &&
    isNonEmptyString(mission.completionStyle) &&
    mission.historicalNote === courierCopy(mission.locale).missionStartQuote
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
