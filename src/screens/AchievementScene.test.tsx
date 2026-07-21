import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import {
  AchievementScene,
  LIGHT_EFFECT_DURATION_MS,
  initialAchievementSceneStage,
  nextAchievementSceneStage,
  resolveAchievementMode,
  skipAchievementSequence,
  videoSourceForAchievementStage,
} from './AchievementScene'

describe('AchievementScene', () => {
  it('uses the light presentation for reduced-motion users even when video is requested', () => {
    expect(resolveAchievementMode('video', true)).toBe('light')
    expect(resolveAchievementMode('video', false)).toBe('video')
    expect(resolveAchievementMode('light', true)).toBe('light')
    expect(LIGHT_EFFECT_DURATION_MS).toBeGreaterThanOrEqual(800)
    expect(LIGHT_EFFECT_DURATION_MS).toBeLessThanOrEqual(1500)
  })

  it('uses the light sequence for reduced motion instead of either video', () => {
    expect(initialAchievementSceneStage(resolveAchievementMode('video', true))).toBe('light')
  })

  it('plays the meal clip before the town clip, with one control that skips the entire sequence', () => {
    const mealStage = initialAchievementSceneStage('video')
    const townStage = nextAchievementSceneStage(mealStage)

    expect(mealStage).toBe('meal-video')
    expect(videoSourceForAchievementStage(mealStage)).toBe('/assets/meal-mikoto-portrait.mp4')
    expect(townStage).toBe('town-video')
    expect(videoSourceForAchievementStage(townStage)).toBe('/assets/reflection-daily-special.mp4')
    expect(nextAchievementSceneStage(townStage)).toBe('deltas')
    expect(skipAchievementSequence(mealStage)).toBe('deltas')
    expect(skipAchievementSequence(townStage)).toBe('deltas')
  })

  it('renders the first muted, inline, non-looping video and one visible skip control', () => {
    const screen = renderToStaticMarkup(
      <AchievementScene mode="video" deltas={[]} locale="en" onComplete={vi.fn()} />,
    )

    expect(screen).toContain('<video')
    expect(screen).toContain('muted=""')
    expect(screen).toContain('playsInline=""')
    expect(screen).toContain('preload="none"')
    expect(screen).toContain('src="/assets/meal-mikoto-portrait.mp4"')
    expect(screen).not.toContain('loop=""')
    expect(screen).toContain('Skip celebration')
  })

  it('renders only caller-supplied deltas and uses an em dash when a supplied value is absent', () => {
    const screen = renderToStaticMarkup(
      <AchievementScene
        mode="light"
        locale="ja"
        onComplete={vi.fn()}
        deltas={[
          { key: 'vitality', label: '町の活気', delta: '+2' },
          { key: 'support', label: '支え手', delta: 0 },
          { key: 'unknown', label: null, delta: null },
        ]}
      />,
    )

    expect(screen).not.toContain('<video')
    expect(screen).toContain('町のパラメータ変化')
    expect(screen).toContain('町の活気')
    expect(screen).toContain('+2')
    expect(screen).toContain('支え手')
    expect(screen).toContain('>0</dd>')
    expect(screen).toContain('<dt>—</dt><dd>—</dd>')
    expect(screen).not.toContain('Meal achievement')
  })

  it('localizes the overlay-owned copy without changing caller-provided data', () => {
    const screen = renderToStaticMarkup(
      <AchievementScene mode="light" locale="en" onComplete={vi.fn()} deltas={[{ key: 'food-hall', label: 'Food hall', delta: '+1' }]} />,
    )

    expect(screen).toContain('MEAL ACHIEVEMENT')
    expect(screen).toContain('Town parameter changes')
    expect(screen).toContain('Skip celebration')
    expect(screen).toContain('Food hall')
    expect(screen).not.toContain('食事からの達成')
  })
})
