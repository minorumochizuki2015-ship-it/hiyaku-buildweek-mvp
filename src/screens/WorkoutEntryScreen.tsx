import { useState } from 'react'
import type { AvailableMinutes, Energy, MissionInput } from '../../shared/mockMission'
import { MIKOTO } from '../../shared/couriers'
import type { MovementMode } from '../movement'
import './workout-entry.css'

type Locale = 'en' | 'ja'

export interface AcceptedDuty {
  name: string
  route: string
  distanceMetres: number
}

export interface WorkoutEntryScreenProps {
  duty: AcceptedDuty | null
  onSubmit: (input: MissionInput, movementMode: MovementMode) => void
  onBack: () => void
  generating: boolean
  locale: Locale
}

const COPY = {
  en: {
    title: 'Setting out',
    subtitle: 'WORKOUT ENTRY',
    dutyTag: 'Goyo',
    availableMinutes: 'Available minutes',
    minute: 'min',
    movementMode: 'Movement mode',
    realWalk: 'Real Walk',
    judgeDemo: 'Judge Demo',
    judgeDemoHelp: 'Judge Demo simulates the walk so you can complete a full mission without moving.',
    privacyHelp: 'Real Walk: your location stays on your device.',
    energy: 'Energy',
    low: 'Low',
    steady: 'Steady',
    ready: 'Ready',
    displayName: 'Your name',
    optional: '(optional)',
    displayNamePlaceholder: 'Courier name',
    submit: 'Set out',
    generating: 'Preparing your mission…',
    back: 'Back to Goyo',
    destination: 'Accepted duty',
  },
  ja: {
    title: '出立の支度',
    subtitle: 'ワークアウト入力',
    dutyTag: '御用札',
    availableMinutes: '歩ける時間',
    minute: '分',
    movementMode: '移動のしかた',
    realWalk: '実際に歩く',
    judgeDemo: 'デモで進む',
    judgeDemoHelp: 'デモで進むを選ぶと、動かずに御用を最後まで見届けられます。',
    privacyHelp: '実際に歩く：位置情報は端末から出ません。',
    energy: '今日の調子',
    low: '低い',
    steady: 'ふつう',
    ready: '万全',
    displayName: '飛脚名',
    optional: '（任意）',
    displayNamePlaceholder: '飛脚の名',
    submit: '出立する',
    generating: '御用を整えています…',
    back: '御用へ戻る',
    destination: '承った御用',
  },
} as const

export function buildWorkoutMissionInput(availableMinutes: AvailableMinutes, energy: Energy, displayName: string): MissionInput {
  return {
    availableMinutes,
    energy,
    courierId: MIKOTO.id,
    displayName: displayName.trim() || undefined,
  }
}

function formatDistance(distanceMetres: number, locale: Locale): string {
  return `${distanceMetres.toLocaleString(locale === 'ja' ? 'ja-JP' : 'en-US')} m`
}

export function WorkoutEntryScreen({ duty, onSubmit, onBack, generating, locale }: WorkoutEntryScreenProps) {
  const [availableMinutes, setAvailableMinutes] = useState<AvailableMinutes>(10)
  const [energy, setEnergy] = useState<Energy>('Steady')
  const [displayName, setDisplayName] = useState('')
  const [movementMode, setMovementMode] = useState<MovementMode>('demo')
  const copy = COPY[locale]

  const energies: ReadonlyArray<{ value: Energy; label: string }> = [
    { value: 'Low', label: copy.low },
    { value: 'Steady', label: copy.steady },
    { value: 'Ready', label: copy.ready },
  ]

  return (
    <main className="workout-entry-screen" aria-labelledby="workout-entry-title" lang={locale}>
      <header className="workout-entry-header">
        <span className="workout-entry-crest" aria-hidden="true">飛</span>
        <div className="workout-entry-heading">
          <h1 id="workout-entry-title">{copy.title}</h1>
          <p>{copy.subtitle}</p>
        </div>
      </header>

      {duty && (
        <section className="workout-entry-destination" aria-label={copy.destination}>
          <span className="workout-entry-duty-tag" aria-hidden="true">{copy.dutyTag}</span>
          <div>
            <strong>{duty.name}</strong>
            <span>{duty.route} ・ {formatDistance(duty.distanceMetres, locale)}</span>
          </div>
        </section>
      )}

      <form
        className="workout-entry-form"
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit(buildWorkoutMissionInput(availableMinutes, energy, displayName), movementMode)
        }}
      >
        <fieldset className="workout-entry-fieldset">
          <legend>{copy.availableMinutes}</legend>
          <div className="workout-entry-choice-row">
            {([5, 10, 15] as AvailableMinutes[]).map((minutes) => (
              <label className="workout-entry-choice" key={minutes}>
                <input type="radio" name="workout-entry-minutes" value={minutes} checked={availableMinutes === minutes} onChange={() => setAvailableMinutes(minutes)} />
                <span>{minutes}<small>{copy.minute}</small></span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="workout-entry-fieldset">
          <legend>{copy.movementMode}</legend>
          <div className="workout-entry-choice-row workout-entry-two-columns">
            <label className="workout-entry-choice">
              <input type="radio" name="workout-entry-movement-mode" value="walk" checked={movementMode === 'walk'} onChange={() => setMovementMode('walk')} />
              <span>{copy.realWalk}</span>
            </label>
            <label className="workout-entry-choice">
              <input type="radio" name="workout-entry-movement-mode" value="demo" checked={movementMode === 'demo'} onChange={() => setMovementMode('demo')} />
              <span>{copy.judgeDemo}</span>
            </label>
          </div>
          <p className="workout-entry-helper">{copy.judgeDemoHelp}</p>
          <p className="workout-entry-helper workout-entry-privacy-note">{copy.privacyHelp}</p>
        </fieldset>

        <fieldset className="workout-entry-fieldset">
          <legend>{copy.energy}</legend>
          <div className="workout-entry-choice-row">
            {energies.map(({ value, label }) => (
              <label className="workout-entry-choice" key={value}>
                <input type="radio" name="workout-entry-energy" value={value} checked={energy === value} onChange={() => setEnergy(value)} />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="workout-entry-name-field">
          <span>{copy.displayName} <em>{copy.optional}</em></span>
          <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={40} placeholder={copy.displayNamePlaceholder} />
        </label>

        <div className="workout-entry-actions">
          <button className="workout-entry-submit" type="submit" disabled={generating}>{generating ? copy.generating : copy.submit}</button>
          <button className="workout-entry-back" type="button" onClick={onBack}>{copy.back}</button>
        </div>
      </form>
    </main>
  )
}
