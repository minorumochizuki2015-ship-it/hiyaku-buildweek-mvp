import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { GoyoDetailScreen, type GoyoDetailScreenProps } from './GoyoDetailScreen'

const props: GoyoDetailScreenProps = {
  duty: {
    name: { en: 'Carry the sealed letter', ja: '封書を届ける' },
    description: { en: 'Deliver the letter to the next checkpoint.', ja: '次の関所まで封書を届けます。' },
    distance: { en: '1.2 km', ja: '1.2 km' },
    estimatedMinutes: { en: '15 min', ja: '15分' },
    remainingDistance: { en: '900 m', ja: '900 m' },
  },
  checkpoints: [
    { name: { en: 'Nihonbashi', ja: '日本橋' } },
    { name: { en: 'Ryogoku Bridge', ja: '両国橋' }, isNext: true },
    { name: { en: 'Senso-ji', ja: '浅草寺' } },
  ],
  goals: [
    { icon: '🏃', label: { en: 'Walk the route', ja: '道を歩く' }, current: 300, target: 1200 },
    { icon: '🏮', label: { en: 'Keep the letter safe', ja: '封書を守る' }, current: 1, target: 1 },
    { icon: '🤝', label: { en: 'Reach the handoff', ja: '受け渡しに着く' }, current: 0, target: 1 },
  ],
  townEffects: [
    { icon: '🏯', label: { en: 'Town trust', ja: '町の信頼' }, magnitude: { en: '+1', ja: '+1' } },
  ],
  mikotoQuote: { en: 'The road is clear. Let us depart.', ja: '道は開けています。出立しましょう。' },
  locale: 'en',
  onAccept: () => undefined,
  onBack: () => undefined,
}

describe('GoyoDetailScreen', () => {
  it('renders only the supplied route checkpoints and emphasizes the supplied next stop', () => {
    const screen = renderToStaticMarkup(<GoyoDetailScreen {...props} />)

    expect(screen).toContain('Nihonbashi')
    expect(screen).toContain('Ryogoku Bridge')
    expect(screen).toContain('Senso-ji')
    expect(screen).toContain('aria-current="step"')
    expect(screen).toContain('class="goyo-detail__stop goyo-detail__stop--next"')
  })

  it('uses supplied values for facts, effects, quote, and goal progress', () => {
    const screen = renderToStaticMarkup(<GoyoDetailScreen {...props} />)

    expect(screen).toContain('1.2 km')
    expect(screen).toContain('15 min')
    expect(screen).toContain('900 m')
    expect(screen).toContain('Town trust')
    expect(screen).toContain('+1')
    expect(screen).toContain('The road is clear. Let us depart.')
    expect(screen).toContain('300 / 1200')
    expect(screen).toContain('width:25%')
  })

  it('requires a supplied duty for the detail screen', () => {
    const screen = renderToStaticMarkup(<GoyoDetailScreen {...props} />)

    expect(screen).toContain('Carry the sealed letter')
    expect(screen).toContain('Accept Goyo')
    expect(screen).not.toContain('No duty has been issued yet')
  })

  it('discloses locally generated narrative in both languages and keeps worker narrative clean', () => {
    const localEnglish = renderToStaticMarkup(<GoyoDetailScreen {...props} isLocalNarrative />)
    const localJapanese = renderToStaticMarkup(<GoyoDetailScreen {...props} locale="ja" isLocalNarrative />)
    const workerNarrative = renderToStaticMarkup(<GoyoDetailScreen {...props} isLocalNarrative={false} />)

    expect(localEnglish).toContain('Offline demo — narrative generated locally')
    expect(localJapanese).toContain('オフラインのデモ表示 — 物語は端末内で生成しています')
    expect(workerNarrative).not.toContain('Offline demo — narrative generated locally')
  })

  it('switches every local label and supplied value to Japanese', () => {
    const screen = renderToStaticMarkup(<GoyoDetailScreen {...props} locale="ja" />)

    expect(screen).toContain('本日の御用')
    expect(screen).toContain('封書を届ける')
    expect(screen).toContain('次の関所')
    expect(screen).toContain('町への効き')
    expect(screen).toContain('御用を承る ›')
    expect(screen).not.toContain('Today Goyo')
  })

  it('uses dashes when optional supplied values do not exist', () => {
    const screen = renderToStaticMarkup(
      <GoyoDetailScreen
        {...props}
        duty={{ name: props.duty!.name, description: props.duty!.description }}
        checkpoints={[]}
        goals={[]}
        townEffects={[]}
        mikotoQuote={null}
      />,
    )

    expect((screen.match(/—/g) ?? []).length).toBeGreaterThanOrEqual(5)
    expect(screen).not.toContain('The road is clear. Let us depart.')
  })
})
