import { useCallback, useEffect, useRef, useState } from 'react'
import './achievement-scene.css'

type Locale = 'en' | 'ja'
type AchievementMode = 'light' | 'video'
type DisplayDelta = string | number | null | undefined

export interface AchievementDelta {
  key: string
  label: string | null | undefined
  delta: DisplayDelta
}

export interface AchievementSceneProps {
  mode: AchievementMode
  deltas: Array<AchievementDelta>
  locale: Locale
  onComplete: () => void
}

export type AchievementSceneStage = 'meal-video' | 'town-video' | 'light' | 'deltas'

const copy = {
  en: {
    title: 'Meal achievement',
    eyebrow: 'MEAL ACHIEVEMENT',
    changes: 'Town parameter changes',
    skip: 'Skip celebration',
    video: 'Meal achievement celebration',
  },
  ja: {
    title: '食事からの達成',
    eyebrow: '食事からの達成',
    changes: '町のパラメータ変化',
    skip: '達成演出をスキップ',
    video: '食事からの達成演出',
  },
} as const

/** The light reflection stays within the frozen 0.8–1.5 second budget. */
export const LIGHT_EFFECT_DURATION_MS = 1000

export function resolveAchievementMode(mode: AchievementMode, prefersReducedMotion: boolean): AchievementMode {
  return mode === 'video' && prefersReducedMotion ? 'light' : mode
}

export function initialAchievementSceneStage(mode: AchievementMode): AchievementSceneStage {
  return mode === 'video' ? 'meal-video' : 'light'
}

export function nextAchievementSceneStage(stage: AchievementSceneStage): AchievementSceneStage {
  switch (stage) {
    case 'meal-video':
      return 'town-video'
    case 'town-video':
    case 'light':
      return 'deltas'
    case 'deltas':
      return 'deltas'
  }
}

export function skipAchievementSequence(stage: AchievementSceneStage): 'deltas' {
  switch (stage) {
    case 'meal-video':
    case 'town-video':
    case 'light':
    case 'deltas':
      return 'deltas'
  }
}

export function videoSourceForAchievementStage(stage: AchievementSceneStage): string | null {
  switch (stage) {
    case 'meal-video':
      return '/assets/meal-mikoto-portrait.mp4'
    case 'town-video':
      return '/assets/reflection-daily-special.mp4'
    case 'light':
    case 'deltas':
      return null
  }
}

function readReducedMotionPreference(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function displayValue(value: DisplayDelta): string {
  if (value === null || value === undefined || value === '') return '—'
  return String(value)
}

/**
 * Full-screen reflection after the caller has decided that a meal earned it.
 * It deliberately accepts only supplied deltas; it does not determine a threshold.
 */
export function AchievementScene({ mode, deltas, locale, onComplete }: AchievementSceneProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(readReducedMotionPreference)
  const effectiveMode = resolveAchievementMode(mode, prefersReducedMotion)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches)
    mediaQuery.addEventListener('change', updatePreference)
    return () => mediaQuery.removeEventListener('change', updatePreference)
  }, [])

  return <AchievementScenePresentation key={effectiveMode} mode={effectiveMode} deltas={deltas} locale={locale} onComplete={onComplete} />
}

function AchievementScenePresentation({ mode, deltas, locale, onComplete }: AchievementSceneProps) {
  const [stage, setStage] = useState<AchievementSceneStage>(() => initialAchievementSceneStage(mode))
  const completeOnce = useRef(false)
  const labels = copy[locale]

  const complete = useCallback(() => {
    if (completeOnce.current) return
    completeOnce.current = true
    onComplete()
  }, [onComplete])

  const advanceSequence = useCallback(() => {
    if (stage === 'town-video') {
      setStage('deltas')
      complete()
      return
    }
    setStage((currentStage) => nextAchievementSceneStage(currentStage))
  }, [stage, complete])

  const skipSequence = useCallback(() => {
    setStage((currentStage) => skipAchievementSequence(currentStage))
    complete()
  }, [complete])

  useEffect(() => {
    if (stage !== 'light') return
    const timer = window.setTimeout(() => {
      setStage('deltas')
      complete()
    }, LIGHT_EFFECT_DURATION_MS)
    return () => window.clearTimeout(timer)
  }, [stage, complete])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') skipSequence()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [skipSequence])

  const videoSource = videoSourceForAchievementStage(stage)
  const showDeltas = stage === 'light' || stage === 'deltas'

  return (
    <section className="achievement-scene" role="dialog" aria-modal="true" aria-labelledby="achievement-scene-title">
      {videoSource && (
        <video
          className="achievement-scene-video"
          autoPlay
          muted
          playsInline
          preload="none"
          aria-label={labels.video}
          onEnded={advanceSequence}
          onError={advanceSequence}
        >
          <source src={videoSource} type="video/mp4" />
        </video>
      )}

      <div className={`achievement-scene-content ${showDeltas ? 'achievement-scene-content-visible' : ''}`}>
        {stage === 'light' && <div className="achievement-scene-glow" aria-hidden="true" />}
        <header className="achievement-scene-header">
          <p className="achievement-scene-eyebrow">{labels.eyebrow}</p>
          <h1 id="achievement-scene-title">{labels.title}</h1>
        </header>

        {showDeltas && deltas.length > 0 && (
          <section className="achievement-scene-deltas" aria-labelledby="achievement-scene-deltas-title">
            <h2 id="achievement-scene-deltas-title">{labels.changes}</h2>
            <dl>
              {deltas.map((item, index) => (
                <div className="achievement-scene-delta" key={`${item.key}-${index}`}>
                  <dt>{displayValue(item.label)}</dt>
                  <dd>{displayValue(item.delta)}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}
      </div>

      <button className="achievement-scene-skip" type="button" onClick={skipSequence}>
        {labels.skip}
      </button>
    </section>
  )
}
