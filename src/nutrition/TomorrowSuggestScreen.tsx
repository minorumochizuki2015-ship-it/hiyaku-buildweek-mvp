import {
  NUTRIENT_DEFINITIONS,
  type NutritionReport,
} from '../../shared/nutrition'
import './tomorrow-suggest.css'

type Locale = 'en' | 'ja'

interface TomorrowSuggestScreenProps {
  report: NutritionReport
  locale: Locale
  onRecordMeal: () => void
  onViewGoyo: () => void
  onBackToTown: () => void
}

interface SuggestionNutrient {
  label: string
  amount: number
  referenceValue: number
  unit: string
}

const copy = {
  ja: {
    title: '明日の軽いおすすめ',
    subtitle: '無理のない次の一歩',
    mealTitle: '食事のおすすめ',
    mealLead: '魚定食か豆腐御膳を記録すると、御膳処が育ちます。',
    mealGapStart: '少なめだった',
    mealGapEnd: 'を補えます。',
    menu: 'おすすめメニューを見る →',
    foodAlt: '魚定食の膳',
    journeyTitle: '巡行のおすすめ',
    journeyLineOne: '明日は軽めの巡行でも十分です。',
    journeyLineTwo: '心地よいリズムを大切にしましょう。',
    townTitle: '町のおすすめアクション',
    townCopy: '御膳処の報酬を受け取って、町の活気をさらに高めましょう。',
    receive: '受け取る',
    record: '食事を記録する',
    viewGoyo: '明日の御用を見る',
    backToTown: '町へ戻る',
  },
  en: {
    title: 'A gentle suggestion for tomorrow',
    subtitle: 'One easy next step',
    mealTitle: 'Meal suggestion',
    mealLead: 'Log a fish set or tofu meal to help the food hall grow.',
    mealGapStart: 'It can gently top up your',
    mealGapEnd: '.',
    menu: 'See suggested meals →',
    foodAlt: 'Fish set meal tray',
    journeyTitle: 'Journey suggestion',
    journeyLineOne: 'A light journey is more than enough tomorrow.',
    journeyLineTwo: 'Keep a rhythm that feels good.',
    townTitle: 'Town action suggestion',
    townCopy: 'Collect the food hall reward and gently lift the town’s spirit.',
    receive: 'Collect',
    record: 'Record a meal',
    viewGoyo: 'View tomorrow’s errand',
    backToTown: 'Return to town',
  },
} as const

function suggestionNutrient(report: NutritionReport, locale: Locale): SuggestionNutrient {
  const candidates = NUTRIENT_DEFINITIONS.flatMap((definition) => {
    const nutrient = report.nutrients.find((item) => item.key === definition.key)
    if (!nutrient || nutrient.judgment === 'OK') return []
    return [{
      label: locale === 'ja' ? definition.edoLabel : definition.label,
      amount: nutrient.amount,
      referenceValue: definition.referenceValue,
      unit: definition.unit,
      ratio: definition.referenceValue > 0 ? nutrient.amount / definition.referenceValue : Number.POSITIVE_INFINITY,
    }]
  })

  const lowest = candidates.sort((left, right) => left.ratio - right.ratio)[0]
  if (lowest) return lowest

  const fallback = NUTRIENT_DEFINITIONS[0]
  const nutrient = report.nutrients.find((item) => item.key === fallback.key)
  return {
    label: locale === 'ja' ? fallback.edoLabel : fallback.label,
    amount: nutrient?.amount ?? 0,
    referenceValue: fallback.referenceValue,
    unit: fallback.unit,
  }
}

function formatAmount(amount: number): string {
  return Number.isInteger(amount) ? String(amount) : amount.toFixed(1).replace(/\.0$/, '')
}

export function TomorrowSuggestScreen({
  report,
  locale,
  onRecordMeal,
  onViewGoyo,
  onBackToTown,
}: TomorrowSuggestScreenProps) {
  const text = copy[locale]
  const nutrient = suggestionNutrient(report, locale)
  const nutrientValue = `${formatAmount(nutrient.amount)} ${nutrient.unit} / ${formatAmount(nutrient.referenceValue)} ${nutrient.unit}`

  return (
    <main className="g07-tomorrow-screen" aria-labelledby="g07-tomorrow-title">
      <header className="g07-tomorrow-header">
        <h1 id="g07-tomorrow-title">{text.title}</h1>
        <p>{text.subtitle}</p>
      </header>

      <section className="g07-tomorrow-card" aria-labelledby="g07-meal-title">
        <h2 id="g07-meal-title">{text.mealTitle}</h2>
        <div className="g07-recommendation">
          <img src="/assets/food/fish-set-tray.png" alt={text.foodAlt} />
          <p>
            {text.mealLead}<br />
            {text.mealGapStart} <strong>{nutrient.label} <span>({nutrientValue})</span></strong>{text.mealGapEnd}
          </p>
        </div>
        <button className="g07-button g07-button-gold" type="button" onClick={onRecordMeal}>{text.menu}</button>
      </section>

      <section className="g07-tomorrow-card" aria-labelledby="g07-journey-title">
        <h2 id="g07-journey-title">{text.journeyTitle}</h2>
        <p className="g07-card-copy">{text.journeyLineOne}<br />{text.journeyLineTwo}</p>
      </section>

      <section className="g07-tomorrow-card" aria-labelledby="g07-town-title">
        <h2 id="g07-town-title">{text.townTitle}</h2>
        <p className="g07-card-copy g07-town-copy">{text.townCopy}</p>
        <button className="g07-button g07-button-ghost" type="button" onClick={onBackToTown}>{text.receive}</button>
      </section>

      <nav className="g07-tomorrow-actions" aria-label={text.title}>
        <button className="g07-button g07-button-ghost" type="button" onClick={onRecordMeal}>{text.record}</button>
        <button className="g07-button g07-button-gold" type="button" onClick={onViewGoyo}>{text.viewGoyo}</button>
        <button className="g07-button g07-button-plain" type="button" onClick={onBackToTown}>{text.backToTown}</button>
      </nav>
    </main>
  )
}
