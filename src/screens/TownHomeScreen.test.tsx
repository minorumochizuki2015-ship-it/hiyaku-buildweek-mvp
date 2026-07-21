import { Children, isValidElement, type ReactElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { TownHomeScreen, type TownHomeScreenProps } from './TownHomeScreen'

export const SAMPLE_TOWN_HOME_PROPS: TownHomeScreenProps = {
  duty: {
    name: { en: 'Carry a letter to the gate', ja: '関所へ文を届ける' },
    description: { en: 'A courier duty from the honjin.', ja: '本陣から届いた飛脚の御用です。' },
    distanceMetres: 845,
    estimatedMinutes: 8,
    townEffects: [
      { key: 'vitality', label: { en: 'Vitality', ja: '活気' }, value: '+2' },
      { key: 'supporters', label: { en: 'Supporters', ja: '支え手' }, value: '+1' },
    ],
  },
  goals: [
    { key: 'walk', label: { en: 'Carry a duty', ja: '御用を運ぶ' }, current: 1, target: 1, done: true },
    { key: 'meal', label: { en: 'Log a meal', ja: '食事を記録する' }, current: 0, target: 1, done: false },
    { key: 'support', label: { en: 'Gain supporters', ja: '支え手を増やす' }, current: 18, target: 50, done: false },
  ],
  townParams: [
    { key: 'vitality', label: { en: 'Town vitality', ja: '町の活気' }, value: 18 },
    { key: 'supporters', label: { en: 'Supporters', ja: '支え手' }, value: 12 },
    { key: 'food', label: { en: 'Food hall', ja: '御膳処' }, value: 7 },
    { key: 'trade', label: { en: 'Trade', ja: '商い' }, value: 4 },
  ],
  totalScore: 845,
  mikotoQuote: { en: 'Let us check today’s duty.', ja: '本日の御用、確認いたしましょう。' },
  locale: 'en',
  onOpenGoyo: () => undefined,
}

function findAcceptButton(node: ReactNode): ReactElement<{ onClick?: () => void }> | undefined {
  if (!isValidElement(node)) return undefined
  const element = node as ReactElement<{ children?: ReactNode; className?: string; onClick?: () => void }>
  if (element.type === 'button' && element.props.className === 'town-home__accept') return element
  return Children.toArray(element.props.children)
    .map((child) => findAcceptButton(child))
    .find((button): button is ReactElement<{ onClick?: () => void }> => button !== undefined)
}

describe('TownHomeScreen', () => {
  it('renders caller-supplied duty, goal, score, and town values without mock numbers', () => {
    const screen = renderToStaticMarkup(<TownHomeScreen {...SAMPLE_TOWN_HOME_PROPS} />)

    expect(screen).toContain('Carry a letter to the gate')
    expect(screen).toContain('845 m')
    expect(screen).toContain('8 min')
    expect(screen).toContain('1 / 3')
    expect(screen).toContain('18/50')
    expect(screen).toContain('width:36%')
    expect(screen).toContain('src="/assets/district-base.png"')
    expect(screen).not.toContain('1,240')
  })

  it('uses the Japanese copy and caller-supplied Japanese text without English static copy', () => {
    const screen = renderToStaticMarkup(<TownHomeScreen {...SAMPLE_TOWN_HOME_PROPS} locale="ja" />)

    expect(screen).toContain('本日の御用')
    expect(screen).toContain('関所へ文を届ける')
    expect(screen).toContain('8 分')
    expect(screen).toContain('町の活気')
    expect(screen).not.toContain('Today’s Goyo')
    expect(screen).not.toContain('Accept Goyo')
  })

  it('wires the primary button to the caller callback', () => {
    const onOpenGoyo = vi.fn()
    const button = findAcceptButton(TownHomeScreen({ ...SAMPLE_TOWN_HOME_PROPS, onOpenGoyo }))

    expect(button).toBeDefined()
    button?.props.onClick?.()
    expect(onOpenGoyo).toHaveBeenCalledTimes(1)
  })

  it('renders the measured zero parameter strip and a Goyo action when no duty exists', () => {
    const screen = renderToStaticMarkup(
      <TownHomeScreen
        {...SAMPLE_TOWN_HOME_PROPS}
        duty={null}
        goals={[
          { key: 'carry-goyo', label: { en: 'Carry the goyo', ja: '御用を運ぶ' }, current: 0, target: 1, done: false },
          { key: 'log-meal', label: { en: 'Log a meal', ja: '食事を記録する' }, current: 0, target: 1, done: false },
        ]}
        townParams={[
          { key: 'vitality', label: { en: 'Town vitality', ja: '町の活気' }, value: 0 },
          { key: 'food-hall', label: { en: 'Food hall', ja: '食堂' }, value: 0 },
          { key: 'courier-flag', label: { en: 'Courier flag power', ja: '飛脚旗の力' }, value: 0 },
        ]}
      />,
    )

    expect(screen).toContain('class="town-home__params"')
    expect((screen.match(/<dd>0<\/dd>/g) ?? [])).toHaveLength(3)
    expect(screen).toContain('No duty yet. Accept one from Goyo.')
    expect(screen).toContain('Go to Goyo')
    expect(screen).toContain('0/1')
    expect(screen).toContain('src="/assets/district-base.png"')
  })

  it('places rank-tiered town facilities after the scene using the supplied measured parameters', () => {
    const screen = renderToStaticMarkup(
      <TownHomeScreen
        {...SAMPLE_TOWN_HOME_PROPS}
        totalScore={70}
        townParams={[
          { key: 'food-hall', label: { en: 'Food hall', ja: '御膳処' }, value: 50 },
          { key: 'courier-flag', label: { en: 'Courier flag power', ja: '飛脚旗の力' }, value: 75 },
        ]}
      />,
    )

    expect(screen).toContain('src="/assets/town/gozendokoro-3.png"')
    expect(screen).toContain('src="/assets/town/rojolive-4.png"')
    expect(screen).toContain('src="/assets/town/chaya-3.png"')
    expect(screen.indexOf('town-growth')).toBeLessThan(screen.indexOf('town-home__quote'))
    expect(screen.indexOf('town-home__quote')).toBeLessThan(screen.indexOf('town-home__params'))
  })

  it('omits the folded goal strip when the caller has no goals', () => {
    const screen = renderToStaticMarkup(<TownHomeScreen {...SAMPLE_TOWN_HOME_PROPS} goals={[]} />)

    expect(screen).not.toContain('1 / 3')
    expect(screen).not.toContain('0 / 0')
  })
})
