import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { AppShell, ArrivalScreen, DispatchScreen, JourneyScreen, LanguageToggle, journeyStateAfterAccept, nutritionStateFor } from './App'
import { checkpointRouteState } from './checkpointRoute'
import { distanceTargetMetres, haversineDistanceMetres, rivalDistanceAtElapsedSeconds, rivalPaceMultiplier, startWalkTracking } from './movement'
import { buildSealSummary, formatSealDate, sealCanvasDataUrl } from './ArrivalSeal'
import { translateText, type Locale } from './i18n'
import { mockCompleteMission, mockGenerateMission } from '../shared/mockMission'
import { MIKOTO } from '../shared/couriers'
import worker from '../worker/index'

const mission = mockGenerateMission({ availableMinutes: 10, energy: 'Steady', courierId: MIKOTO.id, displayName: 'Ada' })

describe('HIKYAKU static screens', () => {
  it('renders Dispatch and its primary action', () => {
    const screen = renderToStaticMarkup(<DispatchScreen onGenerate={() => undefined} generating={false} />)
    expect(screen).toContain('Accept Dispatch')
    expect(screen).toContain('Turn a short walk into an Edo courier mission.')
    expect(screen).toContain('You are an Edo hikyaku (courier). Accept a dispatch, carry it, arrive.')
    expect(screen).toContain('Real Walk')
    expect(screen).toContain('Judge Demo')
    expect(screen).toContain('Judge Demo simulates the walk so you can complete a full mission without moving.')
    expect(screen).toContain('Real Walk: your location stays on your device.')
    expect(screen).toContain('/assets/dispatch-hero-v3b.png')
    expect(screen).toContain('Courier on duty')
    expect(screen).toContain(MIKOTO.gameName)
    expect(screen).toContain(MIKOTO.titleEn)
    expect(screen).toContain(MIKOTO.role)
    expect(screen).toContain(MIKOTO.normalQuote)
    expect(screen).not.toContain('星図ノ測姫・忠敬')
  })

  it('renders Journey and its primary action', () => {
    const screen = renderToStaticMarkup(<JourneyScreen mission={mission} state="active" stats={{ elapsedSeconds: 20, progress: 50, distanceMetres: 400 }} targetDistanceMetres={800} availableMinutes={10} movementMode="demo" locationStatus="" onPause={() => undefined} onEnd={() => undefined} />)
    expect(screen).toContain('End Mission')
    expect(screen).toContain('Judge Demo')
    expect(screen).toContain('JUDGE DEMO')
    expect(screen).toContain('50% along the route')
    expect(screen).toContain('AI PACER · SIMULATED')
    expect(screen).toContain('Yuzu')
    expect(screen).toContain(`率いる飛脚: ${MIKOTO.gameName} — ${MIKOTO.title}`)
    expect(screen).toContain(MIKOTO.missionStartQuote)
  })

  it('renders Arrival and its primary action', () => {
    const completion = mockCompleteMission({ distanceMeters: 480, durationSeconds: 100, completionPercent: 100, missionTitle: mission.title, courierId: mission.courierId })
    const screen = renderToStaticMarkup(<ArrivalScreen mission={mission} completion={completion} stats={{ elapsedSeconds: 100, progress: 100, distanceMetres: 480 }} targetDistanceMetres={480} availableMinutes={10} onRestart={() => undefined} />)
    expect(screen).toContain('Start Another Mission')
    expect(screen).toContain(completion.rank)
    expect(screen).toContain('/assets/arrival-honjin-goze.mp4')
    expect(screen).toContain('今日の一食')
    expect(screen).toContain('simulated AI pacer')
    expect(screen).toContain('HIKYAKU · ARRIVAL SEAL')
    expect(screen).toContain('Share Seal')
    expect(screen).toContain('carried for Shinonome Mikoto')
    expect(screen).toContain(MIKOTO.crestName)
    expect(screen).toContain(MIKOTO.missionCompleteQuote)
    expect(screen).not.toContain('meal-reward-kanto.mp4')
  })

  it('keeps the existing Arrival-to-Nutrition route available', () => {
    const completion = mockCompleteMission({ distanceMeters: 480, durationSeconds: 100, completionPercent: 100, missionTitle: mission.title, courierId: mission.courierId })
    const screen = renderToStaticMarkup(<ArrivalScreen mission={mission} completion={completion} stats={{ elapsedSeconds: 100, progress: 100, distanceMetres: 480 }} targetDistanceMetres={480} availableMinutes={10} onRestart={() => undefined} onNutrition={() => undefined} />)

    expect(nutritionStateFor('arrival')).toBe('nutrition')
    expect(screen).toContain('食の帳簿')
    expect(screen).toContain('View nutrition report')
  })
})

describe('NAVSHELL1', () => {
  it('renders all five locked navigation tabs in their required order', () => {
    const shell = renderToStaticMarkup(
      <AppShell locale="en" onLocaleToggle={() => undefined} selectedTab="dispatch" missionInProgress={false} onTabSelect={() => undefined}>
        <div>Mission content</div>
      </AppShell>,
    )
    const labels = ['🏯', 'Town', '🏃', 'Workout', '📜', 'Dispatch', '🚩', 'Flags', '📖', 'Records']

    expect((shell.match(/class="nav-item/g) ?? [])).toHaveLength(5)
    let previousPosition = -1
    for (const label of labels) {
      const position = shell.indexOf(label)
      expect(position).toBeGreaterThan(previousPosition)
      previousPosition = position
    }
  })

  it('tapping the language control changes a known English string to Japanese', () => {
    let locale: Locale = 'en'
    const control = LanguageToggle({
      locale,
      onToggle: () => { locale = locale === 'en' ? 'ja' : 'en' },
    })

    ;(control.props as { onClick: () => void }).onClick()

    expect(locale).toBe('ja')
    expect(translateText('Accept Dispatch', locale)).toBe('任務を受ける')
  })

  it('keeps the Dispatch → Accept transition on the existing Journey renderer', () => {
    const screen = renderToStaticMarkup(
      <JourneyScreen mission={mission} state={journeyStateAfterAccept()} stats={{ elapsedSeconds: 0, progress: 0, distanceMetres: 0 }} targetDistanceMetres={800} availableMinutes={10} movementMode="demo" locationStatus="" onPause={() => undefined} onEnd={() => undefined} />,
    )

    expect(journeyStateAfterAccept()).toBe('ready')
    expect(screen).toContain('Mission ready')
    expect(screen).toContain('End Mission')
  })
})

describe('arrival seal serialization', () => {
  it('serializes a non-empty PNG data URL with an offscreen canvas', () => {
    const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document')
    const context = {
      canvas: { width: 0, height: 0 },
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      fillText: vi.fn(),
      measureText: vi.fn(() => ({ width: 42 })),
      createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    } as unknown as CanvasRenderingContext2D
    const canvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => context),
      toDataURL: vi.fn(() => 'data:image/png;base64,SElZQUtV'),
    }
    ;(context as unknown as { canvas: HTMLCanvasElement }).canvas = canvas as unknown as HTMLCanvasElement
    Object.defineProperty(globalThis, 'document', { configurable: true, value: { createElement: vi.fn(() => canvas) } })

    try {
      const image = sealCanvasDataUrl({ missionTitle: 'Courier', rank: 'Swift Courier', distance: '800m', duration: '10:00', completion: '100%', date: 'EDO · 2026.07.21' })
      expect(image).toMatch(/^data:image\/png;base64,/)
      expect(canvas.getContext).toHaveBeenCalledWith('2d')
      expect(canvas.toDataURL).toHaveBeenCalledWith('image/png')
      expect(context.fillText).toHaveBeenCalledWith(MIKOTO.gameName, 540, 221)
      expect(context.fillText).toHaveBeenCalledWith('CARRIED FOR Shinonome Mikoto', 540, 249)
    } finally {
      if (originalDocument) Object.defineProperty(globalThis, 'document', originalDocument)
      else delete (globalThis as { document?: Document }).document
    }
  })

  it('builds a location-free courier summary when Node has no canvas implementation', () => {
    const summary = buildSealSummary({
      missionTitle: 'The Lantern Ledger',
      rank: 'Swift Courier',
      distance: '800m',
      duration: '10:00',
      completion: '100%',
      date: 'EDO · 2026.07.21',
    })

    expect(summary).toBe('My HIKYAKU courier seal is stamped: Swift Courier — The Lantern Ledger, carried by 東雲ミコト for Shinonome Mikoto (紫電). 800m in 10:00, 100% complete.')
    expect(summary).not.toMatch(/latitude|longitude|coordinate|日本橋/i)
    expect(formatSealDate(new Date(2026, 6, 21))).toBe('EDO · 2026.07.21')
  })

  it('uses the fixed Mikoto identity for every seal', () => {
    const firstSeal = buildSealSummary({ missionTitle: 'Dispatch', rank: 'Edo Roadrunner', distance: '800m', duration: '10:00', completion: '100%', date: 'EDO · 2026.07.21' })
    const secondSeal = buildSealSummary({ missionTitle: 'Reply', rank: 'Steady Courier', distance: '300m', duration: '05:00', completion: '100%', date: 'EDO · 2026.07.21' })

    for (const seal of [firstSeal, secondSeal]) {
      expect(seal).toContain(MIKOTO.gameName)
      expect(seal).toContain(MIKOTO.figureEn)
      expect(seal).toContain(MIKOTO.crestName)
    }
  })
})

describe('curated courier missions', () => {
  it('keeps every mission input on the fixed Mikoto identity', () => {
    const missions = [
      mockGenerateMission({ availableMinutes: 5, energy: 'Low', courierId: MIKOTO.id, displayName: 'Ada' }),
      mockGenerateMission({ availableMinutes: 10, energy: 'Steady', courierId: MIKOTO.id, displayName: 'Ada' }),
      mockGenerateMission({ availableMinutes: 15, energy: 'Ready', courierId: MIKOTO.id, displayName: 'Ada' }),
    ]

    expect(missions.map((generated) => generated.courierId)).toEqual([MIKOTO.id, MIKOTO.id, MIKOTO.id])
    expect(missions.map((generated) => generated.historicalNote)).toEqual([MIKOTO.missionStartQuote, MIKOTO.missionStartQuote, MIKOTO.missionStartQuote])
    for (const generated of missions) expect(generated.title).toContain(MIKOTO.gameName)
  })

  it('returns a Mikoto-only deterministic Worker fallback when OpenAI is unavailable', async () => {
    const input = { availableMinutes: 5, energy: 'Steady', courierId: MIKOTO.id }
    const response = await worker.fetch(new Request('https://hiyaku.test/api/mission', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
    }), {})
    const fallback = await response.json() as ReturnType<typeof mockGenerateMission>

    expect(response.status).toBe(200)
    expect(fallback.courierId).toBe(MIKOTO.id)
    expect(fallback.historicalNote).toBe(MIKOTO.missionStartQuote)
    expect(fallback.title).toContain(MIKOTO.gameName)
    expect(fallback.briefing).toContain(MIKOTO.missionStartQuote)
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

describe('checkpoint route', () => {
  it('marks passed checkpoints complete and the approaching checkpoint current', () => {
    const route = checkpointRouteState(45, 800)

    expect(route.waypoints.map((waypoint) => waypoint.state)).toEqual(['completed', 'completed', 'current', 'upcoming'])
    expect(route.nextCheckpoint).toMatchObject({ name: '浅草寺', distanceRemainingMetres: 120 })
  })

  it('shows the final stretch only after every named checkpoint has been passed', () => {
    expect(checkpointRouteState(100, 800).nextCheckpoint).toBeNull()
  })
})
