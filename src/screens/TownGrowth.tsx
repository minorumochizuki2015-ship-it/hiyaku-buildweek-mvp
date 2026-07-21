import { useMemo, useState, type CSSProperties } from 'react'
import './town-growth.css'

export type TownGrowthLocale = 'en' | 'ja'

export interface TownGrowthProps {
  food: number
  run: number
  total: number
  locale: TownGrowthLocale
}

type ScoreFacilityId = 'foodHall' | 'streetStage' | 'teaHouse'
type TownFacilityId = ScoreFacilityId | 'honjin' | 'dojo' | 'insatsujo' | 'koen' | 'yatai'
type FacilityRank = 1 | 2 | 3 | 4
type ThreeRank = 1 | 2 | 3

export interface TownBuildingPlacement {
  id: TownFacilityId
  leftPercent: number
  bottomPercent: number
  widthPercent: number
  z: number
}

export interface TownPersonPlacement {
  id: string
  art: 'townsman' | 'townswoman' | 'merchant' | 'child'
  leftPercent: number
  bottomPercent: number
  widthPercent: number
  z: number
  drift: {
    distancePercent: number
    durationSeconds: number
    delaySeconds: number
  }
}

/**
 * The sole map of building positions on the approved 506 × 900 district base.
 * Each cut-out is bottom-centre anchored at its left/bottom point.
 */
// The painted base is a district of EMPTY LOTS — paths, water and trees around
// eight bare plots waiting for buildings. These placements are measured from the
// artwork, not eyeballed: each lot's warm flat area was isolated by hue/saturation
// and its bounding box taken, giving a centre, a ground line and a footprint width.
// leftPercent is the image's CENTRE — the stylesheet applies translateX(-50%) —
// so each value below is the measured lot centre, used directly.
// widthPercent is the lot's own width × 1.25 — a building overhangs its plot a
// little, and the source PNG carries transparent margin around the art.
export const TOWN_BUILDING_PLACEMENTS: readonly TownBuildingPlacement[] = [
  // lot 1 — the largest plot, top centre. The headquarters belongs on it.
  { id: 'honjin', leftPercent: 46.6, bottomPercent: 74.9, widthPercent: 44.0, z: 1 },
  // lot 8 — small plot above the crossing.
  { id: 'koen', leftPercent: 55.8, bottomPercent: 63.6, widthPercent: 18.0, z: 2 },
  // lot 3 — large left plot.
  { id: 'foodHall', leftPercent: 29.1, bottomPercent: 56.2, widthPercent: 45.0, z: 3 },
  // lot 4 — right of the main path.
  { id: 'dojo', leftPercent: 68.2, bottomPercent: 52.3, widthPercent: 28.6, z: 4 },
  // lot 6 — centre plot.
  { id: 'insatsujo', leftPercent: 57.6, bottomPercent: 39.2, widthPercent: 26.9, z: 5 },
  // lot 2 — lower left, the widest of the lower plots.
  { id: 'teaHouse', leftPercent: 27.3, bottomPercent: 35.2, widthPercent: 38.5, z: 6 },
  // lot 5 — beside the water, where the bridge art belongs.
  { id: 'streetStage', leftPercent: 78.2, bottomPercent: 21.0, widthPercent: 23.5, z: 7 },
  // lot 7 — the small stall plot at the bottom of the district.
  { id: 'yatai', leftPercent: 26.3, bottomPercent: 15.4, widthPercent: 17.8, z: 8 },
] as const

/**
 * Decorative townsfolk follow the painted paths between the measured building lots.
 * Their ground lines use the same coordinate convention as the buildings above.
 */
export const TOWN_PEOPLE_PLACEMENTS: readonly TownPersonPlacement[] = [
  { id: 'plaza-townsman', art: 'townsman', leftPercent: 73.5, bottomPercent: 68.0, widthPercent: 6.2, z: 1, drift: { distancePercent: 2.4, durationSeconds: 8, delaySeconds: -2 } },
  { id: 'crossing-child', art: 'child', leftPercent: 52.5, bottomPercent: 60.5, widthPercent: 6.0, z: 2, drift: { distancePercent: -2.2, durationSeconds: 7, delaySeconds: -4 } },
  { id: 'east-path-merchant', art: 'merchant', leftPercent: 85.0, bottomPercent: 48.5, widthPercent: 6.8, z: 4, drift: { distancePercent: 2.6, durationSeconds: 9, delaySeconds: -1 } },
  { id: 'central-townswoman', art: 'townswoman', leftPercent: 48.5, bottomPercent: 43.3, widthPercent: 7.0, z: 4, drift: { distancePercent: -2.5, durationSeconds: 8, delaySeconds: -5 } },
  { id: 'west-path-townsman', art: 'townsman', leftPercent: 45.5, bottomPercent: 31.0, widthPercent: 7.4, z: 6, drift: { distancePercent: 2.8, durationSeconds: 10, delaySeconds: -3 } },
  { id: 'south-merchant', art: 'merchant', leftPercent: 63.0, bottomPercent: 26.0, widthPercent: 7.8, z: 6, drift: { distancePercent: -2.7, durationSeconds: 9, delaySeconds: -6 } },
  { id: 'bridge-child', art: 'child', leftPercent: 51.0, bottomPercent: 17.8, widthPercent: 8.4, z: 7, drift: { distancePercent: 2.5, durationSeconds: 7, delaySeconds: -2 } },
] as const

/**
 * Inclusive score floors for rank art. Scores come directly from shared/activity.ts;
 * 0 is deliberately rank 1 so an unstarted town is visible rather than blank.
 */
export const TOWN_GROWTH_RANK_THRESHOLDS = {
  fourRank: [0, 25, 50, 75],
  threeRank: [0, 40, 70],
} as const

const copy = {
  title: { en: 'Your town', ja: 'あなたの町' },
  sceneDescription: {
    en: 'A painted district where meals grow the food hall, walking grows the bridge, and your total score grows the tea house. Headquarters, dojo, print shop, park, and food stall are part of the town.',
    ja: '食事で御膳処が育ち、歩みで橋が育ち、総計で茶屋が育つ、描かれた町です。本陣、道場、印刷所、公園、屋台も町を形づくっています。',
  },
  rank: { en: 'Rank', ja: '位' },
  foodHall: {
    name: { en: 'Food hall', ja: '御膳処' },
    growsWith: { en: 'Log meals to grow the food hall.', ja: '食事を記録して御膳処を育てよう。' },
  },
  streetStage: {
    name: { en: 'Bridge', ja: '橋' },
    growsWith: { en: 'Walk your journey to grow the bridge.', ja: '御用を歩いて橋を育てよう。' },
  },
  teaHouse: {
    name: { en: 'Tea house', ja: '茶屋' },
    growsWith: { en: 'Meals and walking together grow the tea house.', ja: '食事と歩みで茶屋を育てよう。' },
  },
} as const

const townFabric = {
  honjin: { art: 'honjin', rank: 2 },
  dojo: { art: 'dojo', rank: 2 },
  insatsujo: { art: 'insatsujo', rank: 2 },
  koen: { art: 'koen', rank: 2 },
  yatai: { art: 'yatai', rank: 2 },
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

export function townGrowthRanks({ food, run, total }: Omit<TownGrowthProps, 'locale'>): Record<ScoreFacilityId, FacilityRank | ThreeRank> {
  return {
    foodHall: rankForScore(food, TOWN_GROWTH_RANK_THRESHOLDS.fourRank) as FacilityRank,
    streetStage: rankForScore(run, TOWN_GROWTH_RANK_THRESHOLDS.fourRank) as FacilityRank,
    teaHouse: rankForScore(total, TOWN_GROWTH_RANK_THRESHOLDS.threeRank) as ThreeRank,
  }
}

function localized(value: { en: string; ja: string }, locale: TownGrowthLocale): string {
  return value[locale]
}

function sceneElementStyle(placement: TownBuildingPlacement | TownPersonPlacement, sceneLayer: number): CSSProperties {
  return {
    left: `${placement.leftPercent}%`,
    bottom: `${placement.bottomPercent}%`,
    width: `${placement.widthPercent}%`,
    zIndex: sceneLayer,
  }
}

function personStyle(placement: TownPersonPlacement, sceneLayer: number): CSSProperties {
  return {
    ...sceneElementStyle(placement, sceneLayer),
    '--town-person-drift-distance': `${placement.drift.distancePercent}cqw`,
    '--town-person-drift-duration': `${placement.drift.durationSeconds}s`,
    '--town-person-drift-delay': `${placement.drift.delaySeconds}s`,
  } as CSSProperties
}

function isScoreFacility(id: TownFacilityId): id is ScoreFacilityId {
  return id === 'foodHall' || id === 'streetStage' || id === 'teaHouse'
}

export function TownGrowth({ food, run, total, locale }: TownGrowthProps) {
  const ranks = useMemo(() => townGrowthRanks({ food, run, total }), [food, run, total])
  const [activeFacility, setActiveFacility] = useState<ScoreFacilityId | null>(null)
  const orderedSceneElements = useMemo(
    () => [...TOWN_BUILDING_PLACEMENTS, ...TOWN_PEOPLE_PLACEMENTS].sort((a, b) => b.bottomPercent - a.bottomPercent || a.z - b.z),
    [],
  )

  return (
    <section className="town-growth" aria-labelledby="town-growth-title">
      <h2 id="town-growth-title">{localized(copy.title, locale)}</h2>
      <p className="town-growth__description" id="town-growth-description">
        {localized(copy.sceneDescription, locale)}
      </p>
      <div className="town-growth__scene" aria-describedby="town-growth-description">
        <img className="town-growth__base" src="/assets/district-base.png" alt="" aria-hidden="true" />
        {orderedSceneElements.map((placement, sceneLayer) => {
          if ('art' in placement) {
            return (
              <div className="town-growth__person" key={placement.id} style={personStyle(placement, sceneLayer + 1)} aria-hidden="true">
                <img src={`/assets/npc/${placement.art}.png`} alt="" />
              </div>
            )
          }

          if (!isScoreFacility(placement.id)) {
            const building = townFabric[placement.id]

            return (
              <div className="town-growth__building town-growth__building--fabric" key={placement.id} style={sceneElementStyle(placement, sceneLayer + 1)} aria-hidden="true">
                <img src={`/assets/town/${building.art}-${building.rank}.png`} alt="" />
              </div>
            )
          }

          const facility = placement.id
          const rank = ranks[facility]
          const facilityCopy = copy[facility]
          const isActive = activeFacility === facility
          const name = localized(facilityCopy.name, locale)
          const growsWith = localized(facilityCopy.growsWith, locale)
          const rankText = `${localized(copy.rank, locale)} ${rank}`
          const art = facility === 'foodHall' ? 'gozendokoro' : facility === 'streetStage' ? 'rojolive' : 'chaya'

          return (
            <button
              className="town-growth__building town-growth__building--score"
              type="button"
              key={facility}
              style={sceneElementStyle(placement, sceneLayer + 1)}
              aria-label={`${name}. ${rankText}. ${growsWith}`}
              aria-expanded={isActive}
              onClick={() => setActiveFacility(facility)}
              onFocus={() => setActiveFacility(facility)}
              onBlur={() => setActiveFacility(null)}
            >
              <img src={`/assets/town/${art}-${rank}.png`} alt="" />
              {isActive && (
                <span className="town-growth__label">
                  <strong>{name} · {rankText}</strong>
                  <span>{growsWith}</span>
                </span>
              )}
            </button>
          )
        })}
      </div>
    </section>
  )
}
