import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { TownGrowth, TOWN_BUILDING_PLACEMENTS, TOWN_GROWTH_RANK_THRESHOLDS, TOWN_PEOPLE_PLACEMENTS, townGrowthRanks } from './TownGrowth'

const fs = await import('node:' + 'fs')
const townGrowthCss = fs.readFileSync(new URL('./town-growth.css', import.meta.url), 'utf8')

describe('TownGrowth', () => {
  it('renders rank 1 art for every facility at the measured score of zero', () => {
    const screen = renderToStaticMarkup(<TownGrowth food={0} run={0} total={0} locale="en" />)

    expect(screen).toContain('src="/assets/town/gozendokoro-1.png"')
    expect(screen).toContain('src="/assets/town/rojolive-1.png"')
    expect(screen).toContain('src="/assets/town/chaya-1.png"')
    expect(screen).toContain('aria-label="Food hall. Rank 1.')
    expect(screen).toContain('aria-label="Bridge. Rank 1.')
    expect(screen).toContain('aria-label="Tea house. Rank 1.')
  })

  it('uses a higher food score to select a higher food-hall rank art', () => {
    const starter = renderToStaticMarkup(<TownGrowth food={0} run={0} total={0} locale="en" />)
    const grown = renderToStaticMarkup(<TownGrowth food={75} run={0} total={0} locale="en" />)

    expect(starter).toContain('src="/assets/town/gozendokoro-1.png"')
    expect(grown).toContain('src="/assets/town/gozendokoro-4.png"')
  })

  it('uses the exported thresholds constant as the source of every facility rank', () => {
    expect(TOWN_GROWTH_RANK_THRESHOLDS).toEqual({
      fourRank: [0, 25, 50, 75],
      threeRank: [0, 40, 70],
    })
    expect(townGrowthRanks({ food: 50, run: 75, total: 70 })).toEqual({
      foodHall: 3,
      streetStage: 4,
      teaHouse: 3,
    })
  })

  it('uses one exported placement array for every building position in the composed scene', () => {
    const screen = renderToStaticMarkup(<TownGrowth food={0} run={0} total={0} locale="en" />)

    expect(TOWN_BUILDING_PLACEMENTS).toHaveLength(8)
    // Order follows the lots measured from the painted base (top of the district
    // down), so assert membership rather than a sequence that art can reshuffle.
    expect([...TOWN_BUILDING_PLACEMENTS].map((placement) => placement.id).sort()).toEqual([
      'dojo', 'foodHall', 'honjin', 'insatsujo', 'koen', 'streetStage', 'teaHouse', 'yatai',
    ])
    for (const placement of TOWN_BUILDING_PLACEMENTS) {
      expect(screen).toContain(`left:${placement.leftPercent}%`)
      expect(screen).toContain(`bottom:${placement.bottomPercent}%`)
      expect(screen).toContain(`width:${placement.widthPercent}%`)
    }
  })

  it('uses one exported placement array for every decorative person and keeps them non-interactive', () => {
    const screen = renderToStaticMarkup(<TownGrowth food={0} run={0} total={0} locale="en" />)

    expect(TOWN_PEOPLE_PLACEMENTS).toHaveLength(7)
    expect(TOWN_PEOPLE_PLACEMENTS.map((placement) => placement.art)).toEqual([
      'townsman', 'child', 'merchant', 'townswoman', 'townsman', 'merchant', 'child',
    ])
    expect(screen.match(/class="town-growth__person"/g)).toHaveLength(TOWN_PEOPLE_PLACEMENTS.length)
    expect(screen.match(/class="town-growth__person"[^>]*aria-hidden="true"/g)).toHaveLength(TOWN_PEOPLE_PLACEMENTS.length)
    expect(screen).not.toMatch(/<(?:button|a)[^>]*class="town-growth__person"/)
    expect(screen).not.toMatch(/class="town-growth__person"[^>]*tabindex/)

    for (const placement of TOWN_PEOPLE_PLACEMENTS) {
      expect(screen).toContain(`src="/assets/npc/${placement.art}.png"`)
      expect(screen).toContain(`left:${placement.leftPercent}%`)
      expect(screen).toContain(`bottom:${placement.bottomPercent}%`)
      expect(screen).toContain(`width:${placement.widthPercent}%`)
      expect(screen).toContain(`--town-person-drift-distance:${placement.drift.distancePercent}cqw`)
    }
  })

  it('uses transform-only person drift and disables it for reduced motion', () => {
    expect(townGrowthCss).toContain('container-type: inline-size')
    expect(townGrowthCss).toContain('animation: town-growth-person-drift')
    expect(townGrowthCss).toContain('transform: translateX(var(--town-person-drift-distance))')
    expect(townGrowthCss).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*\.town-growth__person img \{[\s\S]*animation: none;[\s\S]*transform: none;/)
    expect(TOWN_PEOPLE_PLACEMENTS.map((placement) => Math.sign(placement.drift.distancePercent))).toEqual([1, -1, 1, -1, 1, -1, 1])
  })
})
