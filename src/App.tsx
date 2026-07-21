import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  isMission,
  isMissionCompletion,
  type AvailableMinutes,
  type CompletionRequest,
  type Energy,
  type Mission,
  type MissionCompletion,
  type MissionInput,
  type MissionRequest,
} from '../shared/mockMission'
import { MIKOTO, courierCopy } from '../shared/couriers'
import { calculateActivityScores, runScore, toGameResources, totalScore } from '../shared/activity'
import { distanceTargetMetres, rivalDistanceAtElapsedSeconds, type MovementMode, startWalkTracking } from './movement'
import { checkpointEndpoints, checkpointRouteState } from './checkpointRoute'
import { ArrivalSeal, buildSealSummary, formatSealDate, sealCanvasDataUrl, type ArrivalSealData } from './ArrivalSeal'
import { NutritionFlow } from './nutrition/NutritionFlow'
import { TownHomeScreen, type TownHomeGoal, type TownHomeParameter } from './screens/TownHomeScreen'
import { WorkoutEntryScreen } from './screens/WorkoutEntryScreen'
import { GoyoDetailScreen, type GoyoCheckpoint, type GoyoDuty, type GoyoGoal, type GoyoTownEffect } from './screens/GoyoDetailScreen'
import type { NutritionReport } from '../shared/nutrition'
import { localizeContent, t, type Locale } from './i18n'

export type JourneyState = 'idle' | 'generating' | 'nutrition-before-journey' | 'ready' | 'active' | 'paused' | 'completing' | 'completed' | 'nutrition'
export type NavTab = 'town' | 'workout' | 'dispatch' | 'flags' | 'records'

/**
 * These states own the main content area even if the user last selected a
 * different tab. Only `idle` may render a tab landing view.
 */
export const JOURNEY_PRESENTATION_STATES = [
  'generating',
  'nutrition-before-journey',
  'ready',
  'active',
  'paused',
  'completing',
  'completed',
  'nutrition',
] as const satisfies readonly Exclude<JourneyState, 'idle'>[]

export function isJourneyPresentationState(state: JourneyState): state is Exclude<JourneyState, 'idle'> {
  return (JOURNEY_PRESENTATION_STATES as readonly JourneyState[]).includes(state)
}

export type JourneyPresentation = 'preparing' | 'nutrition-before-journey' | 'journey' | 'arrival' | 'nutrition' | null
export type JourneyScreenState = Extract<JourneyState, 'ready' | 'active' | 'paused' | 'completing'>

export function isJourneyScreenState(state: JourneyState): state is JourneyScreenState {
  return state === 'ready' || state === 'active' || state === 'paused' || state === 'completing'
}

export function journeyPresentationFor(state: JourneyState): JourneyPresentation {
  if (!isJourneyPresentationState(state)) return null
  if (state === 'generating') return 'preparing'
  if (state === 'nutrition-before-journey') return 'nutrition-before-journey'
  if (state === 'completed') return 'arrival'
  if (state === 'nutrition') return 'nutrition'
  return 'journey'
}

const NAV_ITEMS: ReadonlyArray<{ id: NavTab; icon: string; label: 'nav.town' | 'nav.workout' | 'nav.dispatch' | 'nav.flags' | 'nav.records' }> = [
  { id: 'town', icon: '🏯', label: 'nav.town' },
  { id: 'workout', icon: '🏃', label: 'nav.workout' },
  { id: 'dispatch', icon: '📜', label: 'nav.dispatch' },
  { id: 'flags', icon: '🚩', label: 'nav.flags' },
  { id: 'records', icon: '📖', label: 'nav.records' },
]

export function nutritionStateFor(entry: 'dispatch' | 'arrival'): Extract<JourneyState, 'nutrition-before-journey' | 'nutrition'> {
  return entry === 'dispatch' ? 'nutrition-before-journey' : 'nutrition'
}

interface JourneyStats {
  elapsedSeconds: number
  progress: number
  distanceMetres: number
}

/** An issued Goyo already has its mission input, so acceptance starts that mission. */
export function journeyStateAfterGoyoAccept(): Extract<JourneyState, 'ready'> {
  return 'ready'
}

export function LanguageToggle({ locale, onToggle }: { locale: Locale; onToggle: () => void }) {
  return (
    <button
      className="language-toggle"
      type="button"
      onClick={onToggle}
      aria-label={locale === 'en' ? 'Switch to Japanese' : '英語に切り替える'}
      title={locale === 'en' ? 'Switch to Japanese' : '英語に切り替える'}
    >
      {locale === 'en' ? '日本語' : 'EN'}
    </button>
  )
}

export function shouldDismissGoyoHelp(key: string): boolean {
  return key === 'Escape'
}

export function AppShell({ children, locale, onLocaleToggle, selectedTab, missionInProgress, onTabSelect }: {
  children: ReactNode
  locale: Locale
  onLocaleToggle: () => void
  selectedTab: NavTab
  missionInProgress: boolean
  onTabSelect: (tab: NavTab) => void
}) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [isGoyoHelpOpen, setIsGoyoHelpOpen] = useState(false)

  useEffect(() => {
    const content = contentRef.current
    if (!content) return
    const applyLocale = () => localizeContent(content, locale)
    applyLocale()
    const observer = new MutationObserver(applyLocale)
    observer.observe(content, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ['alt', 'aria-label', 'placeholder', 'title'] })
    return () => observer.disconnect()
  }, [locale])

  useEffect(() => {
    if (!isGoyoHelpOpen) return
    const dismissOnEscape = (event: KeyboardEvent) => {
      if (shouldDismissGoyoHelp(event.key)) setIsGoyoHelpOpen(false)
    }
    document.addEventListener('keydown', dismissOnEscape)
    return () => document.removeEventListener('keydown', dismissOnEscape)
  }, [isGoyoHelpOpen])

  return (
    <div className="app-shell">
      <header className="app-shell-header">
        <LanguageToggle locale={locale} onToggle={onLocaleToggle} />
      </header>
      <div className="app-shell-content" ref={contentRef} lang={locale}>
        {children}
      </div>
      <nav className="bottom-nav" aria-label={t(locale, 'nav.aria')}>
        {NAV_ITEMS.map((item) => {
          const locked = missionInProgress && item.id !== 'dispatch'
          return (
            <div className="nav-item-group" key={item.id}>
              <button
                className={`nav-item ${selectedTab === item.id ? 'is-active' : ''}`}
                type="button"
                onClick={() => onTabSelect(item.id)}
                disabled={locked}
                aria-current={selectedTab === item.id ? 'page' : undefined}
                title={locked ? (locale === 'en' ? 'Finish or pause the active mission before leaving Dispatch.' : '任務を終えるか一時停止してから、任務画面を離れてください。') : undefined}
              >
                <span className="nav-icon" aria-hidden="true">{item.icon}</span>
                <span className="nav-label">{t(locale, item.label)}</span>
              </button>
              {item.id === 'dispatch' && (
                <>
                  <button
                    className="goyo-help-toggle"
                    type="button"
                    aria-label={t(locale, 'nav.goyoHelp.aria')}
                    aria-controls="goyo-help-popover"
                    aria-expanded={isGoyoHelpOpen}
                    onClick={() => setIsGoyoHelpOpen((open) => !open)}
                  >
                    ▲
                  </button>
                  {isGoyoHelpOpen && <div className="goyo-help-popover" id="goyo-help-popover" role="tooltip">{t(locale, 'nav.goyoHelp.copy')}</div>}
                </>
              )}
            </div>
          )
        })}
      </nav>
    </div>
  )
}

export function ComingSoonScreen({ tab, locale, onReturnToDispatch }: { tab: Exclude<NavTab, 'dispatch'>; locale: Locale; onReturnToDispatch: () => void }) {
  const tabLabel = t(locale, `nav.${tab}` as 'nav.town' | 'nav.workout' | 'nav.flags' | 'nav.records')
  return (
    <main className="screen placeholder-screen" aria-labelledby="placeholder-title">
      <section className="placeholder-panel">
        <span className="placeholder-icon" aria-hidden="true">{NAV_ITEMS.find((item) => item.id === tab)?.icon}</span>
        <p className="eyebrow">{t(locale, 'placeholder.eyebrow')}</p>
        <h1 id="placeholder-title">{t(locale, 'placeholder.title', { tab: tabLabel })}</h1>
        <p>{t(locale, 'placeholder.copy')}</p>
        <button className="primary-button" type="button" onClick={onReturnToDispatch}>{t(locale, 'placeholder.return')}</button>
      </section>
    </main>
  )
}

async function postApi<T>(path: string, body: MissionRequest | CompletionRequest, validate: (value: unknown) => value is T): Promise<T> {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) throw new Error(`API request failed with ${response.status}`)
  const value: unknown = await response.json()
  if (!validate(value)) throw new Error('API response did not match the expected shape')
  return value
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`
}

function milestoneFor(progress: number, mission: Mission): string {
  if (progress >= 75) return mission.milestones[75]
  if (progress >= 50) return mission.milestones[50]
  if (progress >= 25) return mission.milestones[25]
  return mission.briefing
}

function rivalGapLabel(playerDistanceMetres: number, rivalDistanceMetres: number): string {
  const gapMetres = Math.round(Math.abs(rivalDistanceMetres - playerDistanceMetres))
  if (gapMetres === 0) return 'even with you'
  return rivalDistanceMetres > playerDistanceMetres ? `${gapMetres}m ahead` : `${gapMetres}m behind`
}

function arrivalRivalSummary(playerDistanceMetres: number, rivalDistanceMetres: number): string {
  const gapMetres = Math.round(Math.abs(playerDistanceMetres - rivalDistanceMetres))
  if (gapMetres === 0) return 'You and Yuzu, the simulated AI pacer, finished even.'
  return playerDistanceMetres > rivalDistanceMetres
    ? `You finished ${gapMetres}m ahead of Yuzu, the simulated AI pacer.`
    : `Yuzu, the simulated AI pacer, finished ${gapMetres}m ahead of you.`
}

export function CheckpointRoute({ progress, targetDistanceMetres, locale }: { progress: number; targetDistanceMetres: number; locale: Locale }) {
  const route = checkpointRouteState(progress, targetDistanceMetres)

  return (
    <section className="checkpoint-route" aria-label="Edo checkpoint route">
      <div className="checkpoint-track" aria-hidden="true" />
      <ol className="checkpoint-stops">
        <li className="checkpoint-stop completed checkpoint-start">
          <span className="checkpoint-node" aria-hidden="true">●</span>
          <span className="checkpoint-name">{checkpointEndpoints.departure[locale]}</span>
        </li>
        {route.waypoints.map((waypoint) => (
          <li className={`checkpoint-stop ${waypoint.state}`} key={waypoint.name.ja} aria-current={waypoint.state === 'current' ? 'step' : undefined}>
            <span className="checkpoint-node" aria-hidden="true">{waypoint.state === 'current' ? '⚑' : '●'}</span>
            <span className="checkpoint-name">{waypoint.name[locale]}</span>
          </li>
        ))}
        <li className={`checkpoint-stop finish ${progress >= 100 ? 'completed' : ''}`}>
          <span className="checkpoint-node" aria-hidden="true">✦</span>
          <span className="checkpoint-name">{checkpointEndpoints.arrival[locale]}</span>
        </li>
      </ol>
      <p className="checkpoint-next" aria-live="polite">
        {route.nextCheckpoint
          ? <>Next: <strong>{route.nextCheckpoint.name[locale]}</strong> — {route.nextCheckpoint.distanceRemainingMetres}m</>
          : <>Final stretch — the destination awaits.</>}
      </p>
    </section>
  )
}

export function DispatchScreen({ locale, onGenerate, generating }: { locale: Locale; onGenerate: (input: MissionInput, movementMode: MovementMode) => void; generating: boolean }) {
  const [availableMinutes, setAvailableMinutes] = useState<AvailableMinutes>(10)
  const [energy, setEnergy] = useState<Energy>('Steady')
  const [displayName, setDisplayName] = useState('')
  const [movementMode, setMovementMode] = useState<MovementMode>('demo')
  const courier = courierCopy(locale)

  return (
    <main className="screen dispatch-screen" aria-labelledby="dispatch-title">
      <header className="masthead">
        <span className="brand-mark" aria-hidden="true">飛</span>
        <div>
          <p className="eyebrow">HIKYAKU / EDO COURIER</p>
          <h1 id="dispatch-title">Turn a short walk into an Edo courier mission.</h1>
        </div>
      </header>

      <section className="dispatch-hero" aria-label="Edo courier introduction">
        <img src="/assets/dispatch-hero-v3b.png" alt={`${courier.gameName}, the Edo courier, on a moonlit river bridge`} />
        <div className="dispatch-hero-copy">
          <span className="seal">DEMO<br />EDO</span>
          <p>You are an Edo hikyaku (courier). Accept a dispatch, carry it, arrive.</p>
        </div>
      </section>

      <form
        className="dispatch-form"
        onSubmit={(event) => {
          event.preventDefault()
          onGenerate({ availableMinutes, energy, courierId: MIKOTO.id, displayName: displayName.trim() || undefined }, movementMode)
        }}
      >
        <fieldset>
          <legend>Available minutes</legend>
          <div className="choice-row">
            {([5, 10, 15] as AvailableMinutes[]).map((minutes) => (
              <label className="choice" key={minutes}>
                <input type="radio" name="minutes" value={minutes} checked={availableMinutes === minutes} onChange={() => setAvailableMinutes(minutes)} />
                <span>{minutes}<small> min</small></span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="courier-fieldset">
          <legend>Courier on duty</legend>
          <div className="courier-picker" aria-label="Fixed courier identity">
            <div className="courier-card" style={{ flex: '1 1 auto' }}>
              <strong>{courier.gameName}</strong>
              <small>{courier.title} · {courier.attributes}</small>
              <em>{courier.role} · {courier.base}</em>
              <i>{courier.normalQuote}</i>
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>Movement mode</legend>
          <div className="choice-row movement-row">
            <label className="choice">
              <input type="radio" name="movement-mode" value="walk" checked={movementMode === 'walk'} onChange={() => setMovementMode('walk')} />
              <span>Real Walk</span>
            </label>
            <label className="choice">
              <input type="radio" name="movement-mode" value="demo" checked={movementMode === 'demo'} onChange={() => setMovementMode('demo')} />
              <span>Judge Demo</span>
            </label>
          </div>
          <p className="movement-helper">Judge Demo simulates the walk so you can complete a full mission without moving.</p>
          <p className="privacy-note">Real Walk: your location stays on your device.</p>
        </fieldset>

        <fieldset>
          <legend>Energy</legend>
          <div className="choice-row energy-row">
            {(['Low', 'Steady', 'Ready'] as Energy[]).map((level) => (
              <label className="choice" key={level}>
                <input type="radio" name="energy" value={level} checked={energy === level} onChange={() => setEnergy(level)} />
                <span>{level}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="name-field">
          <span>Your name <em>(optional)</em></span>
          <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={40} placeholder="Courier name" />
        </label>
        <button className="primary-button" type="submit" disabled={generating}>
          {generating ? 'Preparing your mission…' : 'Accept Dispatch'}
        </button>
      </form>
    </main>
  )
}

export function MissionPreparingScreen() {
  return (
    <main className="screen journey-screen" aria-labelledby="mission-preparing-title">
      <section className="placeholder-panel" role="status" aria-live="polite">
        <p className="eyebrow">GOYO</p>
        <h1 id="mission-preparing-title">Preparing your mission…</h1>
      </section>
    </main>
  )
}

export interface GoyoTabContentProps {
  duty: GoyoDuty | null
  checkpoints: readonly GoyoCheckpoint[]
  goals: readonly GoyoGoal[]
  townEffects: readonly GoyoTownEffect[]
  mikotoQuote: { en: string; ja: string } | null
  locale: Locale
  onAccept: () => void
  onBack: () => void
  onGenerate: (input: MissionInput, movementMode: MovementMode) => void
  generating: boolean
}

/** The Goyo tab is either the duty detail or its creation form, never both. */
export function GoyoTabContent({ duty, checkpoints, goals, townEffects, mikotoQuote, locale, onAccept, onBack, onGenerate, generating }: GoyoTabContentProps) {
  if (!duty) return <DispatchScreen locale={locale} onGenerate={onGenerate} generating={generating} />

  return (
    <GoyoDetailScreen
      duty={duty}
      checkpoints={checkpoints}
      goals={goals}
      townEffects={townEffects}
      mikotoQuote={mikotoQuote}
      locale={locale}
      onAccept={onAccept}
      onBack={onBack}
    />
  )
}

export function JourneyScreen({ mission, locale, state, stats, targetDistanceMetres, availableMinutes, movementMode, locationStatus, onPause, onEnd }: {
  mission: Mission
  locale: Locale
  state: JourneyScreenState
  stats: JourneyStats
  targetDistanceMetres: number
  availableMinutes: AvailableMinutes
  movementMode: MovementMode
  locationStatus: string
  onPause: () => void
  onEnd: () => void
}) {
  const distance = Math.round(stats.distanceMetres)
  const rivalDistance = rivalDistanceAtElapsedSeconds(targetDistanceMetres, availableMinutes, mission.title, stats.elapsedSeconds)
  const progressLabel = state === 'ready' ? 'Mission ready' : state === 'paused' ? 'Journey paused' : state === 'completing' ? 'Writing arrival…' : movementMode === 'walk' ? 'Real Walk' : 'Judge Demo'
  const ringRadius = 84
  const ringCircumference = 2 * Math.PI * ringRadius
  const courier = courierCopy(locale)

  return (
    <main className="screen journey-screen" aria-labelledby="journey-title">
      <header className="journey-header">
        <div>
          <p className="eyebrow">{progressLabel}</p>
          <h1 id="journey-title">{mission.title}</h1>
          <p className="courier-leading">{locale === 'en' ? 'Lead courier' : '率いる飛脚'}: {courier.gameName} — {courier.title}</p>
        </div>
        <span className="demo-badge">{movementMode === 'walk' ? 'REAL WALK' : 'JUDGE DEMO'}</span>
      </header>

      <section className="journey-stage" aria-label="Courier route progress">
        <img className="route-map" src="/assets/kanto-route-map.png" alt="Illustrated Kanto route map" />
        <div className="route-map-wash" aria-hidden="true" />
        <div className="progress-ring" aria-label={`${stats.progress}% along the route`}>
          <svg viewBox="0 0 200 200" role="img" aria-hidden="true">
            <circle className="ring-track" cx="100" cy="100" r={ringRadius} />
            <circle
              className="ring-value"
              cx="100"
              cy="100"
              r={ringRadius}
              style={{ strokeDasharray: `${(stats.progress / 100) * ringCircumference} ${ringCircumference}` }}
            />
          </svg>
          <div className="ring-copy">
            <strong>{distance}<small>m</small></strong>
            <span>{stats.progress}% complete</span>
          </div>
        </div>
      </section>

      <CheckpointRoute progress={stats.progress} targetDistanceMetres={targetDistanceMetres} locale={locale} />

      <section className="mission-message" aria-live="polite">
        <p>{milestoneFor(stats.progress, mission)}</p>
        {locationStatus && <p className="location-status">{locationStatus}</p>}
      </section>

      <p className="empowered-line">{courier.missionStartQuote}</p>

      <section className="journey-detail" aria-label="Journey metrics">
        <span><strong>{formatDuration(stats.elapsedSeconds)}</strong> elapsed</span>
        <span><strong>{Math.max(targetDistanceMetres - distance, 0)}m</strong> remaining</span>
      </section>

      <p className="rival-comparison" aria-live="polite">
        <span className="rival-tag">AI PACER · SIMULATED</span>
        <strong>Yuzu</strong>: {rivalGapLabel(stats.distanceMetres, rivalDistance)}
      </p>

      <div className="journey-actions">
        <button className="secondary-button" type="button" onClick={onPause} disabled={state === 'ready' || state === 'completing'}>
          {state === 'paused' ? 'Resume Journey' : 'Pause'}
        </button>
        <button className="primary-button compact" type="button" onClick={onEnd} disabled={state === 'ready' || state === 'completing'}>End Mission</button>
      </div>
    </main>
  )
}

export function ArrivalScreen({ mission, completion, locale, stats, targetDistanceMetres, availableMinutes, onRestart, onNutrition }: {
  mission: Mission
  completion: MissionCompletion
  locale: Locale
  stats: JourneyStats
  targetDistanceMetres: number
  availableMinutes: AvailableMinutes
  onRestart: () => void
  onNutrition?: () => void
}) {
  const distance = Math.round(stats.distanceMetres)
  const rivalDistance = rivalDistanceAtElapsedSeconds(targetDistanceMetres, availableMinutes, mission.title, stats.elapsedSeconds)
  const [shareStatus, setShareStatus] = useState('')
  const [mealOpen, setMealOpen] = useState(false)
  const courier = courierCopy(locale)
  const sealData: ArrivalSealData = {
    missionTitle: mission.title,
    rank: completion.rank,
    distance: `${distance}m`,
    duration: formatDuration(stats.elapsedSeconds),
    completion: `${stats.progress}%`,
    date: formatSealDate(),
  }
  const text = buildSealSummary(sealData)

  const share = async () => {
    try {
      const image = sealCanvasDataUrl(sealData)
      let file: File | null = null
      if (image) {
        try {
          const response = await fetch(image)
          file = new File([await response.blob()], 'hiyaku-arrival-seal.png', { type: 'image/png' })
        } catch {
          // A browser that cannot construct a File proceeds to text/download fallbacks.
        }
      }
      if (file && navigator.canShare?.({ files: [file] }) && navigator.share) {
        await navigator.share({ title: 'My HIKYAKU arrival seal', text, files: [file] })
        setShareStatus('Seal shared as an image.')
        return
      }
      if (navigator.share) {
        await navigator.share({ title: 'My HIKYAKU arrival seal', text })
        setShareStatus('Seal summary shared.')
      } else if (image) {
        const link = document.createElement('a')
        link.href = image
        link.download = 'hiyaku-arrival-seal.png'
        link.click()
        setShareStatus('Seal PNG downloaded.')
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(text)
        setShareStatus('Seal summary copied to clipboard.')
      } else {
        setShareStatus(text)
      }
    } catch {
      setShareStatus('Sharing was cancelled. Your result is still complete.')
    }
  }

  return (
    <main className="screen arrival-screen" aria-labelledby="arrival-title">
      <section className="arrival-hero">
        <video className="arrival-video" autoPlay muted loop playsInline preload="metadata" aria-label="Golden Edo town arrival scene">
          <source src="/assets/arrival-honjin-goze.mp4" type="video/mp4" />
        </video>
        <div className="arrival-video-wash" aria-hidden="true" />
        <header className="arrival-header">
          <p className="eyebrow">ARRIVAL RECORDED</p>
          <h1 id="arrival-title">{completion.rank}</h1>
          <p className="arrival-kicker">Your courier run has found its door.</p>
        </header>
      </section>
      <ArrivalSeal data={sealData} />
      <section className="epilogue">
        <p>{completion.epilogue}</p>
        <p className="rival-arrival-summary">{arrivalRivalSummary(stats.distanceMetres, rivalDistance)}</p>
        <p className="historical-note"><strong>{courier.gameName}:</strong> {courier.missionCompleteQuote}</p>
        <p className="next-mission">Next dispatch: {completion.nextMissionTeaser}</p>
      </section>
      <button className="meal-button" type="button" onClick={() => setMealOpen(true)}>
        <span aria-hidden="true">✦</span> {t(locale, 'arrival.todayMeal')} <small>Watch the courier's reward</small>
      </button>
      {onNutrition && <button className="nutrition-link" type="button" onClick={onNutrition}>{t(locale, 'arrival.couriersTable')} <small>View nutrition report</small></button>}
      <div className="arrival-actions">
        <button className="secondary-button" type="button" onClick={share}>Share Seal</button>
        <button className="primary-button compact" type="button" onClick={onRestart}>Start Another Mission</button>
      </div>
      <p className="share-status" aria-live="polite">{shareStatus}</p>
      {mealOpen && (
        <div className="meal-modal-backdrop" role="presentation" onClick={() => setMealOpen(false)}>
          <section className="meal-modal" role="dialog" aria-modal="true" aria-labelledby="meal-title" onClick={(event) => event.stopPropagation()}>
            <button className="modal-close" type="button" aria-label="Close meal video" onClick={() => setMealOpen(false)}>×</button>
            <p className="eyebrow">COURIER'S REWARD</p>
            <h2 id="meal-title">{t(locale, 'arrival.todayMeal')}</h2>
            <video autoPlay muted playsInline controls preload="none">
              <source src="/assets/meal-reward-kanto.mp4" type="video/mp4" />
            </video>
          </section>
        </div>
      )}
    </main>
  )
}

export default function App() {
  const [state, setState] = useState<JourneyState>('idle')
  const [selectedTab, setSelectedTab] = useState<NavTab>('dispatch')
  const [locale, setLocale] = useState<Locale>('en')
  const [mission, setMission] = useState<Mission | null>(null)
  const [stats, setStats] = useState<JourneyStats>({ elapsedSeconds: 0, progress: 0, distanceMetres: 0 })
  const [completion, setCompletion] = useState<MissionCompletion | null>(null)
  const [latestNutritionReport, setLatestNutritionReport] = useState<NutritionReport | null>(null)
  const [missionCompletedThisSession, setMissionCompletedThisSession] = useState(false)
  const [targetDistanceMetres, setTargetDistanceMetres] = useState<number | null>(null)
  const [availableMinutes, setAvailableMinutes] = useState<AvailableMinutes>(10)
  const [movementMode, setMovementMode] = useState<MovementMode>('demo')
  const [locationStatus, setLocationStatus] = useState('')
  const distanceMetresRef = useRef(0)

  useEffect(() => {
    distanceMetresRef.current = stats.distanceMetres
  }, [stats.distanceMetres])

  useEffect(() => {
    if (state !== 'ready') return
    const start = window.setTimeout(() => setState('active'), 500)
    return () => window.clearTimeout(start)
  }, [state])

  useEffect(() => {
    if (state !== 'active' || movementMode !== 'demo' || targetDistanceMetres === null) return
    const tick = window.setInterval(() => {
      setStats((current) => {
        const progress = Math.min(100, current.progress + 5)
        const next = { elapsedSeconds: current.elapsedSeconds + 5, progress, distanceMetres: progress / 100 * targetDistanceMetres }
        if (next.progress === 100) setState('completing')
        return next
      })
    }, 800)
    return () => window.clearInterval(tick)
  }, [state, movementMode, targetDistanceMetres])

  useEffect(() => {
    if (state !== 'active' || movementMode !== 'walk') return
    const tick = window.setInterval(() => {
      setStats((current) => ({ ...current, elapsedSeconds: current.elapsedSeconds + 1 }))
    }, 1_000)
    return () => window.clearInterval(tick)
  }, [state, movementMode])

  useEffect(() => {
    if (state !== 'active' || movementMode !== 'walk' || targetDistanceMetres === null) return
    if (!navigator.geolocation) {
      const fallback = window.setTimeout(() => {
        setLocationStatus('Location unavailable — continuing with Judge Demo.')
        setMovementMode('demo')
      }, 0)
      return () => window.clearTimeout(fallback)
    }
    return startWalkTracking(
      navigator.geolocation,
      distanceMetresRef.current,
      targetDistanceMetres,
      (distanceMetres, progress) => {
        const completedDistance = Math.min(distanceMetres, targetDistanceMetres)
        distanceMetresRef.current = completedDistance
        setStats((current) => ({ ...current, distanceMetres: completedDistance, progress }))
        if (progress === 100) setState('completing')
      },
      () => {
        setLocationStatus('Location unavailable — continuing with Judge Demo.')
        setMovementMode('demo')
      },
    )
  }, [state, movementMode, targetDistanceMetres])

  useEffect(() => {
    if (state !== 'completing' || !mission || targetDistanceMetres === null) return
    let cancelled = false
    const summary = {
      distanceMeters: targetDistanceMetres,
      durationSeconds: stats.elapsedSeconds,
      completionPercent: 100,
      missionTitle: mission.title,
      courierId: mission.courierId,
      locale: mission.locale,
    }
    void postApi('/api/complete', summary, isMissionCompletion)
      .then((result) => {
        if (cancelled) return
        setCompletion(result)
        setMissionCompletedThisSession(true)
        setState('completed')
      })
      .catch(() => {
        if (cancelled) return
        setState('idle')
      })
    return () => { cancelled = true }
  }, [state, mission, stats.elapsedSeconds, targetDistanceMetres])

  const activeMission = useMemo(() => mission, [mission])

  const generateMission = async (input: MissionInput, selectedMovementMode: MovementMode) => {
    setState('generating')
    try {
      const generatedMission = await postApi('/api/mission', { ...input, locale }, isMission)
      setMission(generatedMission)
      distanceMetresRef.current = 0
      setStats({ elapsedSeconds: 0, progress: 0, distanceMetres: 0 })
      setCompletion(null)
      setTargetDistanceMetres(distanceTargetMetres(input.availableMinutes, input.energy))
      setAvailableMinutes(input.availableMinutes)
      setMovementMode(selectedMovementMode)
      setLocationStatus('')
      setSelectedTab('dispatch')
      setState('idle')
    } catch {
      setState('idle')
    }
  }

  const missionInProgress = state === 'ready' || state === 'active' || state === 'paused' || state === 'completing'
  const townActivityScores = useMemo(() => {
    const run = runScore({
      distanceMetres: stats.distanceMetres,
      targetDistanceMetres: targetDistanceMetres ?? 0,
    })
    const foodAndStrength = calculateActivityScores(latestNutritionReport?.foodScore ?? 0, null, null)
    return { ...foodAndStrength, run }
  }, [latestNutritionReport, stats.distanceMetres, targetDistanceMetres])
  const currentTotalScore = totalScore(townActivityScores.food, townActivityScores.strength, townActivityScores.run)
  const townResources = toGameResources(townActivityScores)
  const mikotoQuote = { en: courierCopy('en').normalQuote, ja: courierCopy('ja').normalQuote }
  const townParams: TownHomeParameter[] = [
    { key: 'vitality', label: { en: 'Town vitality', ja: '町の活気' }, value: currentTotalScore },
    { key: 'food-hall', label: { en: 'Food hall', ja: '食堂' }, value: townResources.foodHallEnergy },
    { key: 'courier-flag', label: { en: 'Courier flag power', ja: '飛脚旗の力' }, value: townResources.courierFlagPower },
  ]
  const goals: TownHomeGoal[] = [
    {
      key: 'carry-goyo',
      label: { en: 'Carry the goyo', ja: '御用を運ぶ' },
      current: missionCompletedThisSession ? 1 : 0,
      target: 1,
      done: missionCompletedThisSession,
    },
    {
      key: 'log-meal',
      label: { en: 'Log a meal', ja: '食事を記録する' },
      current: latestNutritionReport ? 1 : 0,
      target: 1,
      done: latestNutritionReport !== null,
    },
  ]
  const townDuty = activeMission && targetDistanceMetres !== null
    ? {
        name: { en: activeMission.title, ja: activeMission.title },
        description: { en: activeMission.briefing, ja: activeMission.briefing },
        distanceMetres: targetDistanceMetres,
        estimatedMinutes: availableMinutes,
        townEffects: [],
      }
    : null
  const goyoDuty = townDuty
    ? {
        name: townDuty.name,
        description: townDuty.description,
        distance: { en: `${townDuty.distanceMetres} m`, ja: `${townDuty.distanceMetres}m` },
        estimatedMinutes: { en: `${townDuty.estimatedMinutes} min`, ja: `${townDuty.estimatedMinutes}分` },
        remainingDistance: { en: `${Math.max(0, townDuty.distanceMetres - Math.round(stats.distanceMetres))} m`, ja: `${Math.max(0, townDuty.distanceMetres - Math.round(stats.distanceMetres))}m` },
      }
    : null
  const route = checkpointRouteState(stats.progress, targetDistanceMetres ?? 0)
  const goyoCheckpoints: GoyoCheckpoint[] = route.waypoints.map((checkpoint) => ({
    name: checkpoint.name,
    isNext: route.nextCheckpoint?.name.ja === checkpoint.name.ja,
  }))
  const goyoGoals: GoyoGoal[] = goals.map((goal) => ({
    icon: goal.key === 'carry-goyo' ? '📜' : '🍚',
    label: goal.label,
    current: goal.current,
    target: goal.target,
  }))
  const goyoTownEffects: GoyoTownEffect[] = [
    { icon: '🏯', label: townParams[0].label, magnitude: { en: String(townParams[0].value), ja: String(townParams[0].value) } },
    { icon: '🍚', label: townParams[1].label, magnitude: { en: String(townParams[1].value), ja: String(townParams[1].value) } },
    { icon: '🚩', label: townParams[2].label, magnitude: { en: String(townParams[2].value), ja: String(townParams[2].value) } },
  ]
  let content: ReactNode
  const journeyPresentation = journeyPresentationFor(state)

  if (journeyPresentation === 'preparing') {
    content = <MissionPreparingScreen />
  } else if (journeyPresentation === 'nutrition-before-journey') {
    content = <NutritionFlow onBack={() => setState('idle')} backLabel="Dispatch" onContinue={() => setState('ready')} locale={locale} distanceMetres={undefined} elapsedSeconds={undefined} previousFoodScore={latestNutritionReport?.foodScore ?? 0} onReport={setLatestNutritionReport} />
  } else if (journeyPresentation === 'journey' && isJourneyScreenState(state) && activeMission) {
    content = <JourneyScreen mission={activeMission} locale={locale} state={state} stats={stats} targetDistanceMetres={targetDistanceMetres ?? 0} availableMinutes={availableMinutes} movementMode={movementMode} locationStatus={locationStatus} onPause={() => setState((current) => current === 'paused' ? 'active' : 'paused')} onEnd={() => {
      distanceMetresRef.current = targetDistanceMetres ?? 0
      setStats((current) => ({ ...current, progress: 100, distanceMetres: targetDistanceMetres ?? current.distanceMetres }))
      setState('completing')
    }} />
  } else if (journeyPresentation === 'arrival' && activeMission && completion) {
    content = <ArrivalScreen mission={activeMission} completion={completion} locale={locale} stats={stats} targetDistanceMetres={targetDistanceMetres ?? 0} availableMinutes={availableMinutes} onRestart={() => {
      setSelectedTab('dispatch')
      setState('idle')
    }} onNutrition={() => setState('nutrition')} />
  } else if (journeyPresentation === 'nutrition') {
    content = <NutritionFlow onBack={() => setState('completed')} locale={locale} distanceMetres={stats.distanceMetres} elapsedSeconds={stats.elapsedSeconds} previousFoodScore={latestNutritionReport?.foodScore ?? 0} onReport={setLatestNutritionReport} />
  } else if (journeyPresentation) {
    // A transition cannot fall back to a tab if its mission payload is still arriving.
    content = <MissionPreparingScreen />
  } else if (selectedTab === 'town') {
    content = <TownHomeScreen duty={townDuty} goals={goals} townParams={townParams} totalScore={currentTotalScore} mikotoQuote={mikotoQuote} locale={locale} onOpenGoyo={() => setSelectedTab('dispatch')} />
  } else if (selectedTab === 'workout') {
    content = <WorkoutEntryScreen duty={null} onSubmit={generateMission} onBack={() => setSelectedTab('dispatch')} generating={false} locale={locale} />
  } else if (selectedTab === 'flags' || selectedTab === 'records') {
    content = <ComingSoonScreen tab={selectedTab} locale={locale} onReturnToDispatch={() => setSelectedTab('dispatch')} />
  } else {
    content = <GoyoTabContent duty={goyoDuty} checkpoints={goyoCheckpoints} goals={goyoGoals} townEffects={goyoTownEffects} mikotoQuote={goyoDuty ? mikotoQuote : null} locale={locale} onAccept={() => setState(journeyStateAfterGoyoAccept())} onBack={() => setSelectedTab('town')} onGenerate={generateMission} generating={false} />
  }

  return (
    <AppShell
      locale={locale}
      onLocaleToggle={() => setLocale((current) => current === 'en' ? 'ja' : 'en')}
      selectedTab={selectedTab}
      missionInProgress={missionInProgress}
      onTabSelect={setSelectedTab}
    >
      {content}
    </AppShell>
  )
}
