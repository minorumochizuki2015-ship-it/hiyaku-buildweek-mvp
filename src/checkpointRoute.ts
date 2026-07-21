export type CheckpointState = 'completed' | 'current' | 'upcoming'

export interface CheckpointName {
  en: string
  ja: string
}

export interface CheckpointWaypoint {
  name: CheckpointName
  progress: number
}

export interface CheckpointRouteState {
  waypoints: Array<CheckpointWaypoint & { state: CheckpointState }>
  nextCheckpoint: (CheckpointWaypoint & { distanceRemainingMetres: number }) | null
}

export const checkpointEndpoints = {
  departure: { en: 'Depart', ja: '出立' },
  arrival: { en: 'Arrive', ja: '到着' },
} satisfies Record<string, CheckpointName>

// 日本橋 is named in the curated mission material; the remaining crossings lead
// north-east along the familiar Edo river-road imagery used by this route.
export const checkpointWaypoints: CheckpointWaypoint[] = [
  { name: { en: 'Nihonbashi', ja: '日本橋' }, progress: 20 },
  { name: { en: 'Ryogoku Bridge', ja: '両国橋' }, progress: 40 },
  { name: { en: 'Sensoji', ja: '浅草寺' }, progress: 60 },
  { name: { en: 'Komagatado', ja: '駒形堂' }, progress: 80 },
]

export function checkpointRouteState(progress: number, targetDistanceMetres: number): CheckpointRouteState {
  const boundedProgress = Math.max(0, Math.min(100, progress))
  const approachingWindow = 15
  const waypoints = checkpointWaypoints.map((waypoint) => ({
    ...waypoint,
    state: boundedProgress >= waypoint.progress
      ? 'completed' as const
      : boundedProgress >= waypoint.progress - approachingWindow
        ? 'current' as const
        : 'upcoming' as const,
  }))
  const nextWaypoint = checkpointWaypoints.find((waypoint) => boundedProgress < waypoint.progress)

  return {
    waypoints,
    nextCheckpoint: nextWaypoint
      ? {
          ...nextWaypoint,
          distanceRemainingMetres: Math.max(0, Math.ceil(targetDistanceMetres * (nextWaypoint.progress - boundedProgress) / 100)),
        }
      : null,
  }
}
