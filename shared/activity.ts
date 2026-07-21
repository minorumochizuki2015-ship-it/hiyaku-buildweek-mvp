export interface ActivityScores {
  food: number
  strength: number
  run: number
}

export interface StrengthActivityInput {
  exerciseType: string
  reps: number
  sets: number
  targetReps: number
}

export interface RunActivityInput {
  distanceMetres: number
  targetDistanceMetres: number
}

export interface GameResources {
  foodHallEnergy: number
  dojoMight: number
  courierFlagPower: number
}

export type ActivityKind = keyof ActivityScores

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.min(100, Math.max(0, Math.round(value)))
}

export function strengthScore(activity: StrengthActivityInput | null | undefined): number {
  if (!activity || activity.targetReps <= 0) return 0
  return clampScore(activity.reps * activity.sets / activity.targetReps * 100)
}

export function runScore(activity: RunActivityInput | null | undefined): number {
  if (!activity || activity.targetDistanceMetres <= 0) return 0
  return clampScore(activity.distanceMetres / activity.targetDistanceMetres * 100)
}

export function calculateActivityScores(
  foodScore: number,
  strengthActivity: StrengthActivityInput | null | undefined,
  runActivity: RunActivityInput | null | undefined,
): ActivityScores {
  return {
    food: clampScore(foodScore),
    strength: strengthScore(strengthActivity),
    run: runScore(runActivity),
  }
}

export function totalScore(foodScore: number, strength: number, run: number): number {
  return clampScore((clampScore(foodScore) + clampScore(strength) + clampScore(run)) / 3)
}

export function dominantActivity(scores: ActivityScores): ActivityKind {
  const normalizedScores = {
    food: clampScore(scores.food),
    strength: clampScore(scores.strength),
    run: clampScore(scores.run),
  }

  // Ordered from highest tie-break priority to lowest: run > strength > food.
  if (normalizedScores.run >= normalizedScores.strength && normalizedScores.run >= normalizedScores.food) return 'run'
  if (normalizedScores.strength >= normalizedScores.food) return 'strength'
  return 'food'
}

export function toGameResources(scores: ActivityScores): GameResources {
  return {
    foodHallEnergy: scores.food,
    dojoMight: scores.strength,
    courierFlagPower: scores.run,
  }
}
