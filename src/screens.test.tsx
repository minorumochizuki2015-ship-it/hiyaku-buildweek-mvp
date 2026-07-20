import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ArrivalScreen, DispatchScreen, JourneyScreen } from './App'
import { mockCompleteMission, mockGenerateMission } from '../shared/mockMission'

const mission = mockGenerateMission({ availableMinutes: 10, energy: 'Steady', displayName: 'Ada' })

describe('HIYAKU static screens', () => {
  it('renders Dispatch and its primary action', () => {
    const screen = renderToStaticMarkup(<DispatchScreen onGenerate={() => undefined} generating={false} />)
    expect(screen).toContain('Generate My Mission')
    expect(screen).toContain('A small walk, with a destination.')
  })

  it('renders Journey and its primary action', () => {
    const screen = renderToStaticMarkup(<JourneyScreen mission={mission} state="active" stats={{ elapsedSeconds: 20, progress: 50 }} onPause={() => undefined} onEnd={() => undefined} />)
    expect(screen).toContain('End Mission')
    expect(screen).toContain('Demo Journey')
  })

  it('renders Arrival and its primary action', () => {
    const completion = mockCompleteMission({ distanceMeters: 480, durationSeconds: 100, completionPercent: 100, missionTitle: mission.title })
    const screen = renderToStaticMarkup(<ArrivalScreen mission={mission} completion={completion} stats={{ elapsedSeconds: 100, progress: 100 }} onRestart={() => undefined} />)
    expect(screen).toContain('Start Another Mission')
    expect(screen).toContain(completion.rank)
  })
})
