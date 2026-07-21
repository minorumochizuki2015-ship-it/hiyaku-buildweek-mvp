import './town-home.css'

export type TownHomeLocale = 'en' | 'ja'

export interface LocalizedTownHomeText {
  en: string
  ja: string
}

export interface TownHomeEffect {
  key: string
  label: LocalizedTownHomeText
  value: string | number
}

export interface TownHomeGoal {
  key: string
  label: LocalizedTownHomeText
  current: number
  target: number
  done: boolean
}

export interface TownHomeParameter {
  key: string
  label: LocalizedTownHomeText
  value: string | number
}

export interface TownHomeDuty {
  name: LocalizedTownHomeText
  description: LocalizedTownHomeText
  distanceMetres: number
  estimatedMinutes: number
  townEffects: readonly TownHomeEffect[]
}

export interface TownHomeScreenProps {
  duty: TownHomeDuty | null
  goals: readonly TownHomeGoal[]
  townParams: readonly TownHomeParameter[]
  totalScore: number
  mikotoQuote: LocalizedTownHomeText
  locale: TownHomeLocale
  onOpenGoyo: () => void
}

interface LocalizedCopy {
  en: string
  ja: string
}

const copy = {
  total: { en: 'TOTAL', ja: '総計' },
  todayGoyo: { en: 'Today’s Goyo', ja: '本日の御用' },
  townEffects: { en: 'Town impact', ja: '町への効き' },
  acceptGoyo: { en: 'Accept Goyo', ja: '御用を承る' },
  noDuty: { en: 'No duty yet. Accept one from Goyo.', ja: '御用はまだありません。御用から受けましょう。' },
  openGoyo: { en: 'Go to Goyo', ja: '御用へ行く' },
  todayGoals: { en: 'Today’s Goyo', ja: '今日の御用' },
  minutes: { en: 'min', ja: '分' },
  townImage: { en: 'Night street in town', ja: '夜の町並み' },
  townScene: { en: 'Town scene', ja: '町の風景' },
} as const satisfies Record<string, LocalizedCopy>

function text(value: LocalizedTownHomeText | LocalizedCopy, locale: TownHomeLocale): string {
  return value[locale]
}

function progressPercent(current: number, target: number): number | null {
  if (!Number.isFinite(current) || !Number.isFinite(target) || target <= 0) return null
  return Math.min(100, Math.max(0, (current / target) * 100))
}

function formatDistance(distanceMetres: number, locale: TownHomeLocale): string {
  return locale === 'ja' ? `${distanceMetres}m` : `${distanceMetres} m`
}

export function TownHomeScreen({ duty, goals, townParams, totalScore, mikotoQuote, locale, onOpenGoyo }: TownHomeScreenProps) {
  const completedGoals = goals.filter((goal) => goal.done).length

  return (
    <main className="town-home" aria-labelledby="town-home-duty-title">
      <header className="town-home__header">
        <span className="town-home__crest" aria-label={locale === 'ja' ? '飛脚の紋' : 'Hikyaku crest'}>飛</span>
        <div className="town-home__score">
          <span>{text(copy.total, locale)}</span>
          <strong>{totalScore}</strong>
        </div>
      </header>

      <section className="town-home__panel" aria-labelledby="town-home-duty-title">
        <header className="town-home__panel-header">
          <h1 id="town-home-duty-title">{text(copy.todayGoyo, locale)}</h1>
        </header>
        <div className="town-home__panel-body">
          {duty ? (
            <>
              <div className="town-home__mission">
                <span className="town-home__fuda" aria-hidden="true">{locale === 'ja' ? '御用' : 'GOYO'}</span>
                <div className="town-home__mission-copy">
                  <strong>{text(duty.name, locale)}</strong>
                  <span>{text(duty.description, locale)}</span>
                  <span className="town-home__distance">{formatDistance(duty.distanceMetres, locale)}</span>
                </div>
              </div>

              <div className="town-home__effects" aria-label={text(copy.townEffects, locale)}>
                <span className="town-home__effects-label">{text(copy.townEffects, locale)}</span>
                {duty.townEffects.map((effect) => (
                  <span className="town-home__effect" key={effect.key}>
                    <span>{text(effect.label, locale)}</span>
                    <strong>{effect.value}</strong>
                  </span>
                ))}
                <span className="town-home__effect">
                  <strong>{duty.estimatedMinutes} {text(copy.minutes, locale)}</strong>
                </span>
              </div>

              <button className="town-home__accept" type="button" onClick={onOpenGoyo} aria-label={text(copy.acceptGoyo, locale)}>
                {text(copy.acceptGoyo, locale)} <span aria-hidden="true">›</span>
              </button>
            </>
          ) : (
            <section className="town-home__empty-duty" aria-label={text(copy.todayGoyo, locale)}>
              <p>{text(copy.noDuty, locale)}</p>
              <button className="town-home__accept" type="button" onClick={onOpenGoyo}>{text(copy.openGoyo, locale)} <span aria-hidden="true">›</span></button>
            </section>
          )}

          {goals.length > 0 && (
            <section className="town-home__goals" aria-labelledby="town-home-goals-title">
              <header className="town-home__goals-header">
                <h2 id="town-home-goals-title">{text(copy.todayGoals, locale)}</h2>
                <span>{completedGoals} / {goals.length} <span aria-hidden="true">›</span></span>
              </header>
              <ul className="town-home__goal-list">
                {goals.map((goal) => {
                  const percent = progressPercent(goal.current, goal.target)
                  return (
                    <li className="town-home__goal" key={goal.key}>
                      <div className="town-home__goal-line">
                        <span className="town-home__goal-label">{text(goal.label, locale)}</span>
                        <span className={goal.done ? 'town-home__goal-value town-home__goal-value--done' : 'town-home__goal-value'}>
                          {goal.current}/{goal.target}{goal.done ? ' ✓' : ''}
                        </span>
                      </div>
                      <span className="town-home__goal-bar" aria-hidden="true">
                        {percent !== null && <span className="town-home__goal-progress" style={{ width: `${percent}%` }} />}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </section>
          )}
        </div>
      </section>

      <section className="town-home__town" aria-label={text(copy.townScene, locale)}>
        <img className="town-home__town-image" src="/assets/bg-town-night-street.png" alt={text(copy.townImage, locale)} />
        <p className="town-home__quote">{text(mikotoQuote, locale)}</p>
      </section>

      <dl className="town-home__params" aria-label={locale === 'ja' ? '町の指標' : 'Town parameters'}>
        {townParams.map((parameter) => (
          <div className="town-home__param" key={parameter.key}>
            <dt>{text(parameter.label, locale)}</dt>
            <dd>{parameter.value}</dd>
          </div>
        ))}
      </dl>
    </main>
  )
}
