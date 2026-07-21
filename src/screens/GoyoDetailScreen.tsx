import { useState, type CSSProperties } from 'react'
import { t } from '../i18n'
import './goyo-detail.css'

export type GoyoLocale = 'en' | 'ja'

export interface GoyoLocalizedText {
  en: string
  ja: string
}

export interface GoyoDuty {
  name: GoyoLocalizedText
  description: GoyoLocalizedText
  distance?: GoyoLocalizedText
  estimatedMinutes?: GoyoLocalizedText
  remainingDistance?: GoyoLocalizedText
}

export interface GoyoCheckpoint {
  name: GoyoLocalizedText
  /** The caller identifies the immediate next stop; no route position is inferred here. */
  isNext?: boolean
}

export interface GoyoGoal {
  icon: string
  label: GoyoLocalizedText
  current?: number
  target?: number
}

export interface GoyoTownEffect {
  icon: string
  label: GoyoLocalizedText
  magnitude?: GoyoLocalizedText
}

export interface GoyoDetailScreenProps {
  duty: GoyoDuty
  checkpoints: readonly GoyoCheckpoint[]
  goals: readonly GoyoGoal[]
  townEffects: readonly GoyoTownEffect[]
  mikotoQuote: GoyoLocalizedText | null
  locale: GoyoLocale
  isLocalNarrative?: boolean
  onAccept: () => void
  onBack: () => void
}

const copy = {
  title: { en: 'Today Goyo', ja: '本日の御用' },
  back: { en: 'Back', ja: '戻る' },
  help: { en: 'What is this?', ja: 'これは？' },
  helpText: {
    en: 'A goyo is an official courier duty: review its route and conditions before accepting.',
    ja: '御用とは公の飛脚任務です。道のりと条件を確認してから承ってください。',
  },
  fuda: { en: 'GOYO', ja: '御用' },
  distance: { en: 'Distance', ja: 'みちのり' },
  estimatedMinutes: { en: 'Estimate', ja: '目安' },
  route: { en: 'Route checkpoints', ja: '道中の関所' },
  next: { en: 'Next checkpoint', ja: '次の関所' },
  remaining: { en: 'Remaining distance', ja: 'のこりの道のり' },
  townEffects: { en: 'Effect on the town', ja: '町への効き' },
  goals: { en: 'Today’s goyo goals', ja: '今日の御用目標' },
  progress: { en: 'Progress', ja: '進み具合' },
  mikoto: { en: 'Mikoto · Official courier', ja: 'ミコト・御用飛脚' },
  accept: { en: 'Accept Goyo ›', ja: '御用を承る ›' },
  returnToTown: { en: 'Return to town', ja: '町へ戻る' },
} as const satisfies Record<string, GoyoLocalizedText>

function text(value: GoyoLocalizedText, locale: GoyoLocale): string {
  return value[locale]
}

function hasProgress(goal: GoyoGoal): boolean {
  return typeof goal.current === 'number' && typeof goal.target === 'number' && goal.target > 0
}

function progressWidth(goal: GoyoGoal): string {
  const { current, target } = goal
  if (typeof current !== 'number' || typeof target !== 'number' || target <= 0) return '0%'
  return `${Math.max(0, Math.min(100, (current / target) * 100))}%`
}

function progressValue(goal: GoyoGoal): string {
  if (!hasProgress(goal)) return '—'
  return `${goal.current} / ${goal.target}`
}

export function GoyoDetailScreen({
  duty,
  checkpoints,
  goals,
  townEffects,
  mikotoQuote,
  locale,
  isLocalNarrative = false,
  onAccept,
  onBack,
}: GoyoDetailScreenProps) {
  const [helpOpen, setHelpOpen] = useState(false)
  const nextCheckpoint = checkpoints.find((checkpoint) => checkpoint.isNext)

  return (
    <main className="goyo-detail" aria-labelledby="goyo-detail-title">
      <header className="goyo-detail__header">
        <button className="goyo-detail__icon-button" type="button" onClick={onBack} aria-label={text(copy.back, locale)}>
          <span aria-hidden="true">‹</span>
        </button>
        <h1 id="goyo-detail-title">{text(copy.title, locale)}</h1>
        <button
          className="goyo-detail__icon-button goyo-detail__help-button"
          type="button"
          onClick={() => setHelpOpen((open) => !open)}
          aria-label={text(copy.help, locale)}
          aria-expanded={helpOpen}
          aria-controls="goyo-detail-help"
        >
          <span aria-hidden="true">?</span>
        </button>
      </header>

      {helpOpen && <p className="goyo-detail__help" id="goyo-detail-help" role="status">{text(copy.helpText, locale)}</p>}

          <section className="goyo-detail__contract" aria-labelledby="goyo-detail-duty-title">
            <div className="goyo-detail__contract-heading">
              <span className="goyo-detail__fuda" aria-hidden="true">{text(copy.fuda, locale)}</span>
              <div>
                <p>{text(copy.fuda, locale)}</p>
                <h2 id="goyo-detail-duty-title">{text(duty.name, locale)}</h2>
                <span>{text(duty.description, locale)}</span>
              </div>
            </div>
            {isLocalNarrative && <p className="goyo-detail__offline-demo-notice" role="status">{t(locale, 'offline.mission')}</p>}
            <dl className="goyo-detail__facts">
              <div>
                <dt>{text(copy.distance, locale)}</dt>
                <dd>{duty.distance ? text(duty.distance, locale) : '—'}</dd>
              </div>
              <div>
                <dt>{text(copy.estimatedMinutes, locale)}</dt>
                <dd>{duty.estimatedMinutes ? text(duty.estimatedMinutes, locale) : '—'}</dd>
              </div>
            </dl>
          </section>

          <section className="goyo-detail__section goyo-detail__route" aria-labelledby="goyo-detail-route-title">
            <h2 id="goyo-detail-route-title">{text(copy.route, locale)}</h2>
            {checkpoints.length > 0 ? (
              <ol className="goyo-detail__rail" style={{ '--goyo-checkpoints': checkpoints.length } as CSSProperties}>
                {checkpoints.map((checkpoint, index) => (
                  <li className={checkpoint.isNext ? 'goyo-detail__stop goyo-detail__stop--next' : 'goyo-detail__stop'} key={`${checkpoint.name.en}-${index}`} aria-current={checkpoint.isNext ? 'step' : undefined}>
                    <span className="goyo-detail__node" aria-hidden="true">{checkpoint.isNext ? '⚑' : index === checkpoints.length - 1 ? '✦' : '●'}</span>
                    <span>{text(checkpoint.name, locale)}</span>
                  </li>
                ))}
              </ol>
            ) : <p className="goyo-detail__unavailable">—</p>}
            <p className="goyo-detail__remaining">
              <span>{text(copy.next, locale)}</span>
              <strong>{nextCheckpoint ? text(nextCheckpoint.name, locale) : '—'}</strong>
              <span>{text(copy.remaining, locale)}</span>
              <strong>{duty.remainingDistance ? text(duty.remainingDistance, locale) : '—'}</strong>
            </p>
          </section>

          <section className="goyo-detail__section" aria-labelledby="goyo-detail-effects-title">
            <h2 id="goyo-detail-effects-title">{text(copy.townEffects, locale)}</h2>
            {townEffects.length > 0 ? (
              <ul className="goyo-detail__effects">
                {townEffects.map((effect, index) => (
                  <li key={`${effect.label.en}-${index}`}>
                    <span className="goyo-detail__effect-icon" aria-hidden="true">{effect.icon}</span>
                    <span>{text(effect.label, locale)}</span>
                    <strong>{effect.magnitude ? text(effect.magnitude, locale) : '—'}</strong>
                  </li>
                ))}
              </ul>
            ) : <p className="goyo-detail__unavailable">—</p>}
          </section>

          <section className="goyo-detail__section" aria-labelledby="goyo-detail-goals-title">
            <h2 id="goyo-detail-goals-title">{text(copy.goals, locale)}</h2>
            {goals.length > 0 ? (
              <ul className="goyo-detail__goals">
                {goals.map((goal, index) => (
                  <li key={`${goal.label.en}-${index}`}>
                    <span className="goyo-detail__goal-icon" aria-hidden="true">{goal.icon}</span>
                    <span className="goyo-detail__goal-label">{text(goal.label, locale)}</span>
                    <span className="goyo-detail__goal-value">{progressValue(goal)}</span>
                    {hasProgress(goal)
                      ? <span className="goyo-detail__bar" aria-label={`${text(copy.progress, locale)}: ${progressValue(goal)}`}><span style={{ width: progressWidth(goal) } as CSSProperties} /></span>
                      : <span className="goyo-detail__goal-missing">—</span>}
                  </li>
                ))}
              </ul>
            ) : <p className="goyo-detail__unavailable">—</p>}
          </section>

          {mikotoQuote && (
            <aside className="goyo-detail__mikoto" aria-label={text(copy.mikoto, locale)}>
              <span className="goyo-detail__mikoto-seal" aria-hidden="true">御</span>
              <p><strong>{text(copy.mikoto, locale)}</strong>{text(mikotoQuote, locale)}</p>
            </aside>
          )}

          <footer className="goyo-detail__actions">
            <button className="goyo-detail__accept-button" type="button" onClick={onAccept}>{text(copy.accept, locale)}</button>
            <button className="goyo-detail__ghost-button" type="button" onClick={onBack}>{text(copy.returnToTown, locale)}</button>
          </footer>
    </main>
  )
}
