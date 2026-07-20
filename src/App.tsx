import { useEffect, useMemo, useState } from 'react'
import {
  mockCompleteMission,
  mockGenerateMission,
  type AvailableMinutes,
  type Energy,
  type Mission,
  type MissionCompletion,
  type MissionInput,
} from '../shared/mockMission'

type JourneyState = 'idle' | 'generating' | 'ready' | 'active' | 'paused' | 'completing' | 'completed'

interface JourneyStats {
  elapsedSeconds: number
  progress: number
}

const progressDistanceMetres = 480

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

export function DispatchScreen({ onGenerate, generating }: { onGenerate: (input: MissionInput) => void; generating: boolean }) {
  const [availableMinutes, setAvailableMinutes] = useState<AvailableMinutes>(10)
  const [energy, setEnergy] = useState<Energy>('Steady')
  const [displayName, setDisplayName] = useState('')

  return (
    <main className="screen dispatch-screen" aria-labelledby="dispatch-title">
      <header className="masthead">
        <span className="brand-mark" aria-hidden="true">飛</span>
        <div>
          <p className="eyebrow">HIYAKU / EDO COURIER</p>
          <h1 id="dispatch-title">A small walk, with a destination.</h1>
        </div>
      </header>

      <section className="mission-intro" aria-label="Mission introduction">
        <span className="seal">DEMO<br />EDO</span>
        <p>Tell us the time and spirit you have today. We will hand you one courier mission.</p>
      </section>

      <form
        className="dispatch-form"
        onSubmit={(event) => {
          event.preventDefault()
          onGenerate({ availableMinutes, energy, displayName: displayName.trim() || undefined })
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
          {generating ? 'Preparing your mission…' : 'Generate My Mission'}
        </button>
      </form>
    </main>
  )
}

export function JourneyScreen({ mission, state, stats, onPause, onEnd }: {
  mission: Mission
  state: Extract<JourneyState, 'ready' | 'active' | 'paused' | 'completing'>
  stats: JourneyStats
  onPause: () => void
  onEnd: () => void
}) {
  const distance = Math.round((stats.progress / 100) * progressDistanceMetres)
  const progressLabel = state === 'ready' ? 'Mission ready' : state === 'paused' ? 'Journey paused' : state === 'completing' ? 'Writing arrival…' : 'Demo Journey'

  return (
    <main className="screen journey-screen" aria-labelledby="journey-title">
      <header className="journey-header">
        <div>
          <p className="eyebrow">{progressLabel}</p>
          <h1 id="journey-title">{mission.title}</h1>
        </div>
        <span className="demo-badge">DEMO</span>
      </header>

      <section className="journey-stage" aria-label="Courier route progress">
        <svg className="route-ribbon" viewBox="0 0 320 260" role="img" aria-label={`${stats.progress}% along the route`}>
          <path d="M31 222 C54 152 102 211 125 130 S196 42 217 103 S277 128 292 31" pathLength="100" />
          <path className="route-progress" d="M31 222 C54 152 102 211 125 130 S196 42 217 103 S277 128 292 31" pathLength="100" style={{ strokeDasharray: `${stats.progress} 100` }} />
          <circle cx="31" cy="222" r="6" />
          <circle cx="292" cy="31" r="7" />
        </svg>
        <div className="courier" style={{ left: `${18 + stats.progress * 0.62}%`, top: `${67 - stats.progress * 0.48}%` }} aria-label="Courier">
          <span className="courier-hat" />
          <span className="courier-head" />
          <span className="courier-body" />
          <span className="courier-pack" />
        </div>
      </section>

      <section className="mission-message" aria-live="polite">
        <p>{milestoneFor(stats.progress, mission)}</p>
      </section>

      <section className="metrics" aria-label="Journey metrics">
        <div><strong>{formatDuration(stats.elapsedSeconds)}</strong><span>elapsed</span></div>
        <div><strong>{distance}m</strong><span>distance</span></div>
        <div><strong>{stats.progress}%</strong><span>progress</span></div>
      </section>

      <div className="journey-actions">
        <button className="secondary-button" type="button" onClick={onPause} disabled={state === 'ready' || state === 'completing'}>
          {state === 'paused' ? 'Resume Journey' : 'Pause'}
        </button>
        <button className="primary-button compact" type="button" onClick={onEnd} disabled={state === 'ready' || state === 'completing'}>End Mission</button>
      </div>
    </main>
  )
}

export function ArrivalScreen({ mission, completion, stats, onRestart }: {
  mission: Mission
  completion: MissionCompletion
  stats: JourneyStats
  onRestart: () => void
}) {
  const distance = Math.round((stats.progress / 100) * progressDistanceMetres)
  const [shareStatus, setShareStatus] = useState('')
  const text = `HIYAKU — ${mission.title}: ${completion.rank}. ${distance}m in ${formatDuration(stats.elapsedSeconds)}.`

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: 'My HIYAKU mission', text })
        setShareStatus('Result shared.')
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(text)
        setShareStatus('Result copied to clipboard.')
      } else {
        setShareStatus(text)
      }
    } catch {
      setShareStatus('Sharing was cancelled. Your result is still complete.')
    }
  }

  return (
    <main className="screen arrival-screen" aria-labelledby="arrival-title">
      <header className="arrival-header">
        <span className="arrival-sun" aria-hidden="true" />
        <p className="eyebrow">ARRIVAL RECORDED</p>
        <h1 id="arrival-title">{completion.rank}</h1>
        <p className="arrival-kicker">Your courier run has found its door.</p>
      </header>
      <section className="arrival-stats" aria-label="Completed journey metrics">
        <div><strong>{distance}m</strong><span>distance</span></div>
        <div><strong>{formatDuration(stats.elapsedSeconds)}</strong><span>duration</span></div>
        <div><strong>{stats.progress}%</strong><span>complete</span></div>
      </section>
      <section className="epilogue">
        <p>{completion.epilogue}</p>
        <p className="historical-note"><strong>From Edo:</strong> {mission.historicalNote}</p>
        <p className="next-mission">Next dispatch: {completion.nextMissionTeaser}</p>
      </section>
      <div className="arrival-actions">
        <button className="secondary-button" type="button" onClick={share}>Share Result</button>
        <button className="primary-button compact" type="button" onClick={onRestart}>Start Another Mission</button>
      </div>
      <p className="share-status" aria-live="polite">{shareStatus}</p>
    </main>
  )
}

export default function App() {
  const [state, setState] = useState<JourneyState>('idle')
  const [mission, setMission] = useState<Mission | null>(null)
  const [stats, setStats] = useState<JourneyStats>({ elapsedSeconds: 0, progress: 0 })
  const [completion, setCompletion] = useState<MissionCompletion | null>(null)

  useEffect(() => {
    if (state !== 'ready') return
    const start = window.setTimeout(() => setState('active'), 500)
    return () => window.clearTimeout(start)
  }, [state])

  useEffect(() => {
    if (state !== 'active') return
    const tick = window.setInterval(() => {
      setStats((current) => {
        const next = { elapsedSeconds: current.elapsedSeconds + 5, progress: Math.min(100, current.progress + 5) }
        if (next.progress === 100) setState('completing')
        return next
      })
    }, 800)
    return () => window.clearInterval(tick)
  }, [state])

  useEffect(() => {
    if (state !== 'completing' || !mission) return
    const finish = window.setTimeout(() => {
      setCompletion(mockCompleteMission({
        distanceMeters: progressDistanceMetres,
        durationSeconds: stats.elapsedSeconds,
        completionPercent: 100,
        missionTitle: mission.title,
      }))
      setState('completed')
    }, 500)
    return () => window.clearTimeout(finish)
  }, [state, mission, stats.elapsedSeconds])

  const activeMission = useMemo(() => mission, [mission])

  const generateMission = (input: MissionInput) => {
    setState('generating')
    window.setTimeout(() => {
      setMission(mockGenerateMission(input))
      setStats({ elapsedSeconds: 0, progress: 0 })
      setCompletion(null)
      setState('ready')
    }, 650)
  }

  if (state === 'idle' || state === 'generating') return <DispatchScreen onGenerate={generateMission} generating={state === 'generating'} />
  if ((state === 'ready' || state === 'active' || state === 'paused' || state === 'completing') && activeMission) {
    return <JourneyScreen mission={activeMission} state={state} stats={stats} onPause={() => setState((current) => current === 'paused' ? 'active' : 'paused')} onEnd={() => {
      setStats((current) => ({ ...current, progress: 100 }))
      setState('completing')
    }} />
  }
  if (state === 'completed' && activeMission && completion) return <ArrivalScreen mission={activeMission} completion={completion} stats={stats} onRestart={() => setState('idle')} />
  return <DispatchScreen onGenerate={generateMission} generating={false} />
}
