export const MIKOTO = {
  id: 'mikoto',
  gameName: '東雲ミコト',
  gameNameEn: 'Shinonome Mikoto',
  title: '江戸本陣の御用便',
  titleEn: 'Edo HQ Official Courier',
  role: '関東代表・将軍御用飛脚',
  roleEn: 'Kanto representative and shogun’s official courier',
  base: '日本橋本陣',
  baseEn: 'Nihonbashi headquarters',
  attributes: '江戸 / 御用 / 統率 / 紫電',
  attributesEn: 'Edo / official duty / command / violet lightning',
  normalQuote: '本日の御用、確認いたしましょう。',
  normalQuoteEn: 'Let us confirm today’s duty.',
  missionStartQuote: '日本橋本陣より、御用出立です。',
  missionStartQuoteEn: 'A dispatch sets out from Nihonbashi headquarters.',
  missionCompleteQuote: '御用、確かに届けました。',
  missionCompleteQuoteEn: 'The dispatch has been delivered safely.',
  crestName: '紫電',
  crestNameEn: 'Violet Lightning',

  // Compatibility fields for the out-of-scope Worker narrative payload.
  figure: '東雲ミコト',
  figureEn: 'Shinonome Mikoto',
  class: '江戸本陣の御用便',
  classEn: 'Edo HQ Official Courier',
  attribute: '江戸 / 御用 / 統率 / 紫電',
  landmark: '日本橋本陣',
  empoweredBy: '江戸 / 御用 / 統率 / 紫電',
  historicalFact: '日本橋本陣より、御用出立です。',
  historicalFactEn: 'A dispatch sets out from Nihonbashi headquarters.',
} as const

// The Worker is outside CHARFIX1 scope and consumes this collection. It now
// contains only the fixed courier, so no request can select a roster member.
export const COURIERS = [MIKOTO] as const

export type CourierId = typeof MIKOTO.id
export type CourierLocale = 'en' | 'ja'

export function courierCopy(locale: CourierLocale, courier = MIKOTO) {
  if (locale === 'en') {
    return {
      gameName: courier.gameNameEn,
      title: courier.titleEn,
      role: courier.roleEn,
      base: courier.baseEn,
      attributes: courier.attributesEn,
      normalQuote: courier.normalQuoteEn,
      missionStartQuote: courier.missionStartQuoteEn,
      missionCompleteQuote: courier.missionCompleteQuoteEn,
      crestName: courier.crestNameEn,
      figure: courier.figureEn,
      class: courier.classEn,
      attribute: courier.attributesEn,
      landmark: courier.baseEn,
      empoweredBy: courier.attributesEn,
      historicalFact: courier.historicalFactEn,
    }
  }

  return {
    gameName: courier.gameName,
    title: courier.title,
    role: courier.role,
    base: courier.base,
    attributes: courier.attributes,
    normalQuote: courier.normalQuote,
    missionStartQuote: courier.missionStartQuote,
    missionCompleteQuote: courier.missionCompleteQuote,
    crestName: courier.crestName,
    figure: courier.figure,
    class: courier.class,
    attribute: courier.attribute,
    landmark: courier.landmark,
    empoweredBy: courier.empoweredBy,
    historicalFact: courier.historicalFact,
  }
}

export function isCourierId(value: unknown): value is CourierId {
  return value === MIKOTO.id
}
