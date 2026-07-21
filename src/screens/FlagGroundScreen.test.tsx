import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { FlagsTabContent } from '../App'
import { FLAG_GROUND_STATE_THRESHOLDS, FlagGroundScreen, flagGroundStateForPower } from './FlagGroundScreen'

function render(power: number, locale: 'en' | 'ja' = 'en'): string {
  return renderToStaticMarkup(<FlagGroundScreen courierFlagPower={power} locale={locale} onWalk={vi.fn()} />)
}

describe('FlagGroundScreen', () => {
  it('renders a measured zero as the lowest state rather than a blank', () => {
    const screen = render(0)

    expect(flagGroundStateForPower(0)).toBe('at-risk')
    expect(screen).toContain('At risk')
    expect(screen).toContain('aria-valuenow="0"')
    expect(screen).toContain('>0<small>/100</small>')
    expect(screen).not.toContain('—')
  })

  it('renders high flag power as the highest state', () => {
    const screen = render(100)

    expect(flagGroundStateForPower(100)).toBe('stable')
    expect(screen).toContain('Stable')
    expect(screen).toContain('aria-valuenow="100"')
    expect(FLAG_GROUND_STATE_THRESHOLDS).toEqual({ contestedAt: 35, stableAt: 70 })
  })

  it('uses a single language and keeps other grounds locked previews without fabricated league data', () => {
    const screen = render(50, 'ja')

    for (const text of ['旗場', '日本橋本陣', '芝', '池袋', '品川', '新宿', 'ロック中']) expect(screen).toContain(text)
    for (const forbidden of ['rival', 'ranking', 'point', 'countdown', 'ライバル', 'ランキング', 'ポイント', 'カウントダウン']) expect(screen.toLowerCase()).not.toContain(forbidden)
    expect(screen).not.toContain('Flag ground')
  })

  it('routes the Flags tab to FlagGroundScreen instead of ComingSoonScreen', () => {
    const screen = renderToStaticMarkup(<FlagsTabContent courierFlagPower={0} locale="en" onWalk={vi.fn()} />)

    expect(screen).toContain('flag-ground')
    expect(screen).not.toContain('placeholder-screen')
    expect(screen).not.toContain('coming soon')
  })
})
