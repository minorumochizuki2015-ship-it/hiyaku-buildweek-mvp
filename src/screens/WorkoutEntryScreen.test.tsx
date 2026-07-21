import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { MIKOTO } from '../../shared/couriers'
import { buildWorkoutMissionInput, WorkoutEntryScreen } from './WorkoutEntryScreen'

const duty = {
  name: 'Deliver the sealed letter',
  route: 'Nihonbashi → Asakusa',
  distanceMetres: 1200,
}

function renderScreen(locale: 'en' | 'ja', acceptedDuty: typeof duty | null = duty, generating = false): string {
  return renderToStaticMarkup(
    <WorkoutEntryScreen
      duty={acceptedDuty}
      generating={generating}
      locale={locale}
      onBack={() => undefined}
      onSubmit={() => undefined}
    />,
  )
}

describe('WorkoutEntryScreen', () => {
  it('renders an accepted duty only when the caller provides one', () => {
    const accepted = renderScreen('en')
    const none = renderScreen('en', null)

    expect(accepted).toContain(duty.name)
    expect(accepted).toContain(duty.route)
    expect(accepted).toContain('1,200 m')
    expect(none).not.toContain('workout-entry-destination')
    expect(none).not.toContain('Accepted duty')
  })

  it('keeps the dispatch option sets and fixed courier mission payload', () => {
    const screen = renderScreen('en')
    const input = buildWorkoutMissionInput(15, 'Ready', '  Ada  ')

    expect(screen).toContain('value="5"')
    expect(screen).toContain('value="10"')
    expect(screen).toContain('value="15"')
    expect(screen).toContain('value="walk"')
    expect(screen).toContain('value="demo"')
    expect(screen).toContain('maxLength="40"')
    expect(input).toEqual({ availableMinutes: 15, energy: 'Ready', courierId: MIKOTO.id, displayName: 'Ada' })
  })

  it('uses a Japanese-only visible interface when Japanese is selected', () => {
    const screen = renderScreen('ja')

    expect(screen).toContain('出立の支度')
    expect(screen).toContain('歩ける時間')
    expect(screen).toContain('デモで進む')
    expect(screen).toContain('御用へ戻る')
    expect(screen).not.toContain('Set out')
    expect(screen).not.toContain('Available minutes')
  })

  it('disables the primary action and keeps the secondary back action during generation', () => {
    const screen = renderScreen('en', duty, true)

    expect(screen).toMatch(/<button[^>]*disabled[^>]*>Preparing your mission…<\/button>/)
    expect(screen).toContain('Back to Goyo')
  })
})
