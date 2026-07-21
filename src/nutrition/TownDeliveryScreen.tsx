import {
  NUTRIENT_DEFINITIONS,
  type NutrientKey,
  type NutritionReport,
} from '../../shared/nutrition'
import './town-delivery.css'

type Locale = 'en' | 'ja'

interface TownDeliveryScreenProps {
  report: NutritionReport
  locale: Locale
}

interface LocalizedText {
  en: string
  ja: string
}

interface TownEffect extends LocalizedText {
  icon: string
  key: NutrientKey
  edoLabel: LocalizedText
}

const copy = {
  title: { en: 'Today’s meal has reached the town', ja: '今日の食事が町に届きました' },
  subtitle: { en: 'Nutrition’s reflection on the town', ja: '栄養から町への反映' },
  effectHeading: { en: 'Nutrition’s reflection on the town', ja: '栄養から町への反映' },
  townHeading: { en: 'The town today', ja: '町の様子' },
  summaryHeading: { en: 'Today’s town impact summary', ja: '今日の町への影響まとめ' },
  reached: { en: 'Met', ja: '達成' },
  needMore: { en: 'Need more', ja: 'もう少し' },
  tooMuch: { en: 'Too much', ja: 'とりすぎ' },
  small: { en: '+ Small', ja: '+ 小' },
  inactive: { en: '—', ja: '—' },
  townImage: { en: 'Night street in town', ja: '夜の町並み' },
  townImageDescription: { en: 'Town background showing the effect of today’s meal', ja: '今日の食事の影響を映す町の背景' },
  townVitality: { en: 'Town vitality', ja: '町の活気' },
  foodHall: { en: 'Food hall', ja: '御膳処' },
  supporterSatisfaction: { en: 'Supporter satisfaction', ja: '支え手満足' },
  teaHouse: { en: 'Tea house', ja: '茶屋' },
} as const satisfies Record<string, LocalizedText>

const townEffects: readonly TownEffect[] = [
  {
    key: 'protein',
    icon: '🥩',
    edoLabel: { en: 'Strength token', ja: '御力札' },
    en: 'Courier dojo vitality',
    ja: '飛脚道場の活気',
  },
  {
    key: 'sodium',
    icon: '🥛',
    edoLabel: { en: 'Micros token', ja: '微量札' },
    en: 'Food hall menu options',
    ja: '御膳処メニュー候補',
  },
  {
    key: 'fiber',
    icon: '🥬',
    edoLabel: { en: 'Balance token', ja: '整え札' },
    en: 'A richer town table',
    ja: '町の食卓が豊かに',
  },
  {
    key: 'energy',
    icon: '💧',
    edoLabel: { en: 'Meal energy', ja: '力飯値' },
    en: 'Tea house bustle',
    ja: '茶屋のにぎわい',
  },
  {
    key: 'carbohydrates',
    icon: '🍚',
    edoLabel: { en: 'Carb token', ja: '糖質札' },
    en: 'Merchant reputation',
    ja: '商い評判',
  },
  {
    key: 'fat',
    icon: '💜',
    edoLabel: { en: 'Oil token', ja: '油分札' },
    en: 'Supporter satisfaction',
    ja: '支え手満足',
  },
] as const

const summaryItems = [
  { icon: '🏘', label: copy.townVitality, key: 'protein' },
  { icon: '🏮', label: copy.foodHall, key: 'sodium' },
  { icon: '👥', label: copy.supporterSatisfaction, key: 'fat' },
  { icon: '🍵', label: copy.teaHouse, key: 'energy' },
] as const

function text(value: LocalizedText, locale: Locale): string {
  return value[locale]
}

function formatAmount(amount: number): string {
  return Number.isInteger(amount) ? String(amount) : String(Number(amount.toFixed(2)))
}

function judgmentLabel(judgment: NutritionReport['nutrients'][number]['judgment'], locale: Locale): string {
  if (judgment === 'OK') return text(copy.reached, locale)
  if (judgment === 'Low') return text(copy.needMore, locale)
  return text(copy.tooMuch, locale)
}

export function TownDeliveryScreen({ report, locale }: TownDeliveryScreenProps) {
  const nutrientsByKey = new Map(report.nutrients.map((nutrient) => [nutrient.key, nutrient]))

  return (
    <main className="g07-town-delivery" aria-labelledby="g07-town-delivery-title">
      <header className="g07-town-delivery__header">
        <h1 id="g07-town-delivery-title">{text(copy.title, locale)}</h1>
        <p>{text(copy.subtitle, locale)}</p>
      </header>

      <section className="g07-town-delivery__card" aria-labelledby="g07-town-effects-title">
        <h2 id="g07-town-effects-title">{text(copy.effectHeading, locale)}</h2>
        <ul className="g07-town-delivery__effects">
          {townEffects.map((effect) => {
            const nutrient = nutrientsByKey.get(effect.key)
            const definition = NUTRIENT_DEFINITIONS.find((item) => item.key === effect.key)
            const judgment = nutrient?.judgment ?? 'Low'
            const contributes = judgment === 'OK'
            const nutrientName = locale === 'ja' ? definition?.edoLabel ?? text(effect.edoLabel, locale) : definition?.label ?? text(effect.edoLabel, locale)
            const amount = `${formatAmount(nutrient?.amount ?? 0)}${definition?.unit ?? 'g'}`

            return (
              <li className="g07-town-delivery__effect-row" key={effect.key}>
                <span
                  className="g07-town-delivery__chip"
                  aria-label={`${nutrientName}, ${amount}, ${judgmentLabel(judgment, locale)}`}
                >
                  <span className="g07-town-delivery__chip-icon" aria-hidden="true">{effect.icon}</span>
                  <span>{nutrientName}</span>
                  <span className={`g07-town-delivery__status g07-town-delivery__status--${judgment.toLowerCase()}`}>
                    {judgmentLabel(judgment, locale)}
                  </span>
                </span>
                <span className="g07-town-delivery__effect-arrow" aria-hidden="true">→</span>
                <span className="g07-town-delivery__effect-label">{text(effect, locale)}</span>
                <strong className={contributes ? 'g07-town-delivery__magnitude' : 'g07-town-delivery__magnitude g07-town-delivery__magnitude--muted'}>
                  {contributes ? text(copy.small, locale) : text(copy.inactive, locale)}
                </strong>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="g07-town-delivery__card g07-town-delivery__card--town" aria-labelledby="g07-town-scene-title">
        <h2 id="g07-town-scene-title">{text(copy.townHeading, locale)}</h2>
        <div className="g07-town-delivery__scene">
          <img src="/assets/bg-town-night-street.png" alt={text(copy.townImage, locale)} aria-describedby="g07-town-scene-description" />
          <span className="g07-town-delivery__scene-description" id="g07-town-scene-description">{text(copy.townImageDescription, locale)}</span>
        </div>
      </section>

      <section className="g07-town-delivery__card" aria-labelledby="g07-town-summary-title">
        <h2 id="g07-town-summary-title">{text(copy.summaryHeading, locale)}</h2>
        <ul className="g07-town-delivery__summary">
          {summaryItems.map((item) => (
            <li key={item.label.en}>
              <span aria-hidden="true">{item.icon}</span>
              <span>{text(item.label, locale)}</span>
              {nutrientsByKey.get(item.key)?.judgment === 'OK'
                ? <strong aria-label={locale === 'ja' ? '上昇' : 'Increase'}>↑</strong>
                : <strong className="g07-town-delivery__summary-neutral" aria-label={locale === 'ja' ? '上昇なし' : 'No increase'}>—</strong>}
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
