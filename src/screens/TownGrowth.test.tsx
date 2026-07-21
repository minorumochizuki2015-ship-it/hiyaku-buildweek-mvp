import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { TownGrowth, TOWN_GROWTH_RANK_THRESHOLDS, townGrowthRanks } from './TownGrowth'

describe('TownGrowth', () => {
  it('renders rank 1 art for every facility at the measured score of zero', () => {
    const screen = renderToStaticMarkup(<TownGrowth food={0} run={0} total={0} locale="en" />)

    expect(screen).toContain('src="/assets/town/gozendokoro-1.png"')
    expect(screen).toContain('src="/assets/town/rojolive-1.png"')
    expect(screen).toContain('src="/assets/town/chaya-1.png"')
    expect((screen.match(/Rank <strong>1<\/strong>/g) ?? [])).toHaveLength(3)
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
})
