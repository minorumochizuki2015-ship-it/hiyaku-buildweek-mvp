export const MIKOTO = {
  id: 'mikoto',
  gameName: '東雲ミコト',
  gameNameEn: 'Shinonome Mikoto',
  title: '江戸本陣の御用便',
  titleEn: 'Edo HQ Official Courier',
  role: '関東代表・将軍御用飛脚',
  roleEn: 'Kanto representative, shogunal official courier',
  base: '日本橋本陣',
  baseEn: 'Nihonbashi Headquarters',
  attributes: '江戸 / 御用 / 統率 / 紫電',
  normalQuote: '本日の御用、確認いたしましょう。',
  missionStartQuote: '日本橋本陣より、御用出立です。',
  missionCompleteQuote: '御用、確かに届けました。',
  crestName: '紫電',

  // Compatibility fields for the out-of-scope Worker narrative payload.
  figure: '東雲ミコト',
  figureEn: 'Shinonome Mikoto',
  class: '江戸本陣の御用便',
  classEn: 'Edo HQ Official Courier',
  attribute: '江戸 / 御用 / 統率 / 紫電',
  landmark: '日本橋本陣',
  empoweredBy: '江戸 / 御用 / 統率 / 紫電',
  historicalFact: '日本橋本陣より、御用出立です。',
} as const

// The Worker is outside CHARFIX1 scope and consumes this collection. It now
// contains only the fixed courier, so no request can select a roster member.
export const COURIERS = [MIKOTO] as const

export type CourierId = typeof MIKOTO.id

export function isCourierId(value: unknown): value is CourierId {
  return value === MIKOTO.id
}
