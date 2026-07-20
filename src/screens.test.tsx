import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { ArrivalScreen, DispatchScreen, JourneyScreen } from './App'
import { distanceTargetMetres, haversineDistanceMetres, rivalDistanceAtElapsedSeconds, rivalPaceMultiplier, startWalkTracking } from './movement'
import { mockCompleteMission, mockGenerateMission } from '../shared/mockMission'

const mission = mockGenerateMission({ availableMinutes: 10, energy: 'Steady', displayName: 'Ada' })

describe('HIYAKU static screens', () => {
  it('renders Dispatch and its primary action', () => {
    const screen = renderToStaticMarkup(<DispatchScreen onGenerate={() => undefined} generating={false} />)
    expect(screen).toContain('Generate My Mission')
    expect(screen).toContain('A small walk, with a destination.')
    expect(screen).toContain('/assets/courier-kanto-card.png')
  })

  it('renders Journey and its primary action', () => {
    const screen = renderToStaticMarkup(<JourneyScreen mission={mission} state="active" stats={{ elapsedSeconds: 20, progress: 50, distanceMetres: 400 }} targetDistanceMetres={800} availableMinutes={10} movementMode="demo" locationStatus="" onPause={() => undefined} onEnd={() => undefined} />)
    expect(screen).toContain('End Mission')
    expect(screen).toContain('Demo Journey')
    expect(screen).toContain('50% along the route')
    expect(screen).toContain('AI PACER · SIMULATED')
    expect(screen).toContain('Yuzu')
  })

  it('renders Arrival and its primary action', () => {
    const completion = mockCompleteMission({ distanceMeters: 480, durationSeconds: 100, completionPercent: 100, missionTitle: mission.title })
    const screen = renderToStaticMarkup(<ArrivalScreen mission={mission} completion={completion} stats={{ elapsedSeconds: 100, progress: 100, distanceMetres: 480 }} targetDistanceMetres={480} availableMinutes={10} onRestart={() => undefined} />)
    expect(screen).toContain('Start Another Mission')
    expect(screen).toContain(completion.rank)
    expect(screen).toContain('/assets/arrival-honjin-goze.mp4')
    expect(screen).toContain('今日の一食')
    expect(screen).toContain('simulated AI pacer')
    expect(screen).not.toContain('meal-reward-kanto.mp4')
  })
})

describe('movement tracking', () => {
  it('uses a deterministic walking target for each dispatch choice', () => {
    expect(distanceTargetMetres(5, 'Low')).toBe(300)
    expect(distanceTargetMetres(10, 'Steady')).toBe(800)
    expect(distanceTargetMetres(15, 'Ready')).toBe(1500)
  })

  it('calculates a known equatorial distance with the mean Earth radius', () => {
    // One degree of longitude on the equator is 111.195 km using the 6,371 km mean Earth radius.
    expect(haversineDistanceMetres({ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 1 })).toBeCloseTo(111_194.927, 0)
    expect(haversineDistanceMetres({ latitude: 35.681236, longitude: 139.767125 }, { latitude: 35.681236, longitude: 139.767125 })).toBe(0)
  })

  it('derives a deterministic rival pace multiplier within the configured range', () => {
    const titles = ['The Lantern Ledger', 'Rain at Tokaido Gate', 'The Tea House Reply', 'Courier']
    for (const title of titles) {
      expect(rivalPaceMultiplier(title)).toBe(rivalPaceMultiplier(title))
      expect(rivalPaceMultiplier(title)).toBeGreaterThanOrEqual(0.92)
      expect(rivalPaceMultiplier(title)).toBeLessThanOrEqual(1.08)
    }
  })

  it('calculates the rival distance from the independently derived pace', () => {
    // FNV-1a('Courier') is 151,230,708, so its multiplier is 0.925633782894731.
    // For a 600m target in 10 minutes, the base pace is exactly 1m/s; after 300s,
    // the independently calculated rival distance is 300 × 0.925633782894731 = 277.6901348684193m.
    expect(rivalDistanceAtElapsedSeconds(600, 10, 'Courier', 300)).toBeCloseTo(277.6901348684193, 10)
    expect(rivalDistanceAtElapsedSeconds(600, 10, 'Courier', 900)).toBe(600)
  })

  it('falls back after a mocked navigator.geolocation permission error and clears its watch', () => {
    let reportError: PositionErrorCallback | undefined
    const clearWatch = vi.fn()
    const geolocation = {
      watchPosition: vi.fn((_success: PositionCallback, error: PositionErrorCallback) => {
        reportError = error
        return 42
      }),
      clearWatch,
    }
    const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator')
    Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { geolocation } })

    try {
      const onUnavailable = vi.fn()
      const stopTracking = startWalkTracking(navigator.geolocation, 0, 800, vi.fn(), onUnavailable)
      reportError?.({ code: 1, message: 'Permission denied' } as GeolocationPositionError)
      stopTracking()
      expect(onUnavailable).toHaveBeenCalledOnce()
      expect(clearWatch).toHaveBeenCalledWith(42)
    } finally {
      if (originalNavigator) Object.defineProperty(globalThis, 'navigator', originalNavigator)
      else delete (globalThis as { navigator?: Navigator }).navigator
    }
  })
})
