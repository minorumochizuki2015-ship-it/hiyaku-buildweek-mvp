import { useEffect, useMemo, useRef, useState } from 'react'
import './town-growth.css'

export type TownGrowthLocale = 'en' | 'ja'

export interface TownGrowthProps {
  food: number
  run: number
  total: number
  locale: TownGrowthLocale
}

type FacilityId = 'foodHall' | 'streetStage' | 'teaHouse'
type FacilityRank = 1 | 2 | 3 | 4
type ThreeRank = 1 | 2 | 3

/**
 * Inclusive score floors for rank art. Scores come directly from shared/activity.ts;
 * 0 is deliberately rank 1 so an unstarted town is visible rather than blank.
 */
export const TOWN_GROWTH_RANK_THRESHOLDS = {
  fourRank: [0, 25, 50, 75],
  threeRank: [0, 40, 70],
} as const

const copy = {
  title: { en: 'Town growth', ja: '町の育ち' },
  rank: { en: 'Rank', ja: '位' },
  score: { en: 'Score', ja: '点' },
  foodHall: {
    name: { en: 'Food hall', ja: '御膳処' },
    growsWith: { en: 'Log meals to grow the food hall.', ja: '食事を記録して御膳処を育てよう。' },
  },
  streetStage: {
    name: { en: 'Street stage', ja: '路上舞台' },
    growsWith: { en: 'Walk your journey to grow the street stage.', ja: '御用を歩いて路上舞台を育てよう。' },
  },
  teaHouse: {
    name: { en: 'Tea house', ja: '茶屋' },
    growsWith: { en: 'Meals and walking together grow the tea house.', ja: '食事と歩みで茶屋を育てよう。' },
  },
  newlyGrown: { en: 'Newly grown', ja: '育ちました' },
} as const

function safeScore(score: number): number {
  return Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : 0
}

function rankForScore(score: number, thresholds: readonly number[]): number {
  const normalizedScore = safeScore(score)
  let rank = 1

  thresholds.forEach((threshold, index) => {
    if (normalizedScore >= threshold) rank = index + 1
  })

  return rank
}

export function townGrowthRanks({ food, run, total }: Omit<TownGrowthProps, 'locale'>): Record<FacilityId, FacilityRank | ThreeRank> {
  return {
    foodHall: rankForScore(food, TOWN_GROWTH_RANK_THRESHOLDS.fourRank) as FacilityRank,
    streetStage: rankForScore(run, TOWN_GROWTH_RANK_THRESHOLDS.fourRank) as FacilityRank,
    teaHouse: rankForScore(total, TOWN_GROWTH_RANK_THRESHOLDS.threeRank) as ThreeRank,
  }
}

function localized(value: { en: string; ja: string }, locale: TownGrowthLocale): string {
  return value[locale]
}

export function TownGrowth({ food, run, total, locale }: TownGrowthProps) {
  const ranks = useMemo(() => townGrowthRanks({ food, run, total }), [food, run, total])
  const previousRanks = useRef<typeof ranks | null>(null)
  const [newlyGrown, setNewlyGrown] = useState<readonly FacilityId[]>([])

  useEffect(() => {
    const previous = previousRanks.current
    previousRanks.current = ranks
    if (!previous) return

    const grown = (Object.keys(ranks) as FacilityId[]).filter((facility) => ranks[facility] > previous[facility])
    const showHighlight = window.setTimeout(() => setNewlyGrown(grown), 0)
    const clearHighlight = window.setTimeout(() => setNewlyGrown([]), 900)

    return () => {
      window.clearTimeout(showHighlight)
      window.clearTimeout(clearHighlight)
    }
  }, [ranks])

  const facilities = [
    { id: 'foodHall' as const, score: safeScore(food), art: 'gozendokoro', ranks: 4 },
    { id: 'streetStage' as const, score: safeScore(run), art: 'rojolive', ranks: 4 },
    { id: 'teaHouse' as const, score: safeScore(total), art: 'chaya', ranks: 3 },
  ]

  return (
    <section className="town-growth" aria-labelledby="town-growth-title">
      <h2 id="town-growth-title">{localized(copy.title, locale)}</h2>
      <div className="town-growth__facilities">
        {facilities.map((facility) => {
          const rank = ranks[facility.id]
          const isNewlyGrown = newlyGrown.includes(facility.id)
          const facilityCopy = copy[facility.id]

          return (
            <article className={isNewlyGrown ? 'town-growth__facility town-growth__facility--grown' : 'town-growth__facility'} key={facility.id}>
              <div className="town-growth__art-wrap">
                <img
                  className="town-growth__art"
                  src={`/assets/town/${facility.art}-${rank}.png`}
                  alt={`${localized(facilityCopy.name, locale)} — ${localized(copy.rank, locale)} ${rank}`}
                />
                {isNewlyGrown && <span className="town-growth__newly-grown">{localized(copy.newlyGrown, locale)}</span>}
              </div>
              <h3>{localized(facilityCopy.name, locale)}</h3>
              <p className="town-growth__rank">{localized(copy.rank, locale)} <strong>{rank}</strong> / {facility.ranks}</p>
              <p className="town-growth__score">{localized(copy.score, locale)} <strong>{facility.score}</strong></p>
              <p className="town-growth__cause">{localized(facilityCopy.growsWith, locale)}</p>
            </article>
          )
        })}
      </div>
    </section>
  )
}
