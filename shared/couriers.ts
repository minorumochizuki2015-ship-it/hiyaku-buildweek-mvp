export interface Courier {
  id: string
  gameName: string
  gameNameEn: string
  figure: string
  figureEn: string
  class: string
  classEn: string
  attribute: string
  rarity: string
  era: string
  landmark: string
  empoweredBy: string
  crestName: string
  historicalFact: string
}

export const COURIERS = [
  {
    id: 'tadataka',
    gameName: '星図ノ測姫・忠敬', gameNameEn: 'Tadataka, the Star-Chart Surveyor',
    figure: '伊能忠敬', figureEn: 'Ino Tadataka',
    class: '陰陽師', classEn: 'Onmyoji', attribute: '符', rarity: 'UR',
    era: 'Edo', landmark: 'Sawara, Katori',
    empoweredBy: 'rest, hydration, and steady walks',
    crestName: '測道星輪紋',
    historicalFact: "An Edo-period merchant who took up surveying at 55 and walked roughly 40,000 km along Japan's coasts to complete the first accurate map of the country.",
  },
  {
    id: 'dokan',
    gameName: '山吹ノ城姫・道灌', gameNameEn: 'Dokan, the Yamabuki Castle Blade',
    figure: '太田道灌', figureEn: 'Ota Dokan',
    class: '侍', classEn: 'Samurai', attribute: '斬', rarity: 'UR',
    era: 'Muromachi', landmark: 'Edo Castle',
    empoweredBy: 'strength training and focus',
    crestName: '山吹城輪紋',
    historicalFact: 'A 15th-century warrior-poet who built the first Edo Castle in 1457, on the ground that would centuries later become Tokyo.',
  },
  {
    id: 'mitsukuni',
    gameName: '梅巡ノ御姫・光圀', gameNameEn: 'Mitsukuni, the Plum-Pilgrim Miko',
    figure: '水戸光圀', figureEn: 'Tokugawa Mitsukuni',
    class: '巫女', classEn: 'Miko', attribute: '祓', rarity: 'UR',
    era: 'Edo', landmark: 'Mito',
    empoweredBy: 'logging meals, water, and rest',
    crestName: '御用梅輪紋',
    historicalFact: "The second lord of the Mito domain, who sponsored the vast 'Dai Nihonshi' chronicle of Japan and lived on as a legendary traveling folk hero.",
  },
  {
    id: 'yoichi',
    gameName: '扇矢ノ弓姫・与一', gameNameEn: 'Yoichi, the Fan-Target Archer',
    figure: '那須与一', figureEn: 'Nasu no Yoichi',
    class: '弓取', classEn: 'Archer', attribute: '射', rarity: 'UR',
    era: 'Kamakura', landmark: 'Nasu',
    empoweredBy: 'long walks and distance',
    crestName: '扇的一矢紋',
    historicalFact: 'A young archer of the Genpei War, famed in the Tale of the Heike for shooting down a fan target set on a boat at the Battle of Yashima.',
  },
  {
    id: 'juzaburo',
    gameName: '蔦紅ノ版姫・重三郎', gameNameEn: 'Juzaburo, the Ivy-Seal Publisher',
    figure: '蔦屋重三郎', figureEn: 'Tsutaya Juzaburo',
    class: '楽士', classEn: 'Musician', attribute: '音', rarity: 'UR',
    era: 'Edo', landmark: 'Nihonbashi',
    empoweredBy: 'music and light movement',
    crestName: '版元蔦輪紋',
    historicalFact: 'An Edo publisher (1750-1797) who launched the careers of the ukiyo-e masters Sharaku and Utamaro from his shop near Nihonbashi.',
  },
  {
    id: 'shigetada',
    gameName: '武蔵剛ノ槍姫・重忠', gameNameEn: 'Shigetada, the Musashi Spear',
    figure: '畠山重忠', figureEn: 'Hatakeyama Shigetada',
    class: '槍士', classEn: 'Spearman', attribute: '突', rarity: 'UR',
    era: 'Kamakura', landmark: 'Fukaya, Musashi',
    empoweredBy: 'strength and hill climbs',
    crestName: '武蔵剛輪紋',
    historicalFact: 'A Kamakura-period warrior of Musashi renowned for strength and honor, celebrated for carrying his own horse down a steep cliff in battle.',
  },
] as const satisfies readonly Courier[]

export type CourierId = typeof COURIERS[number]['id']

export function isCourierId(value: unknown): value is CourierId {
  return typeof value === 'string' && COURIERS.some((courier) => courier.id === value)
}

export function getCourier(id: CourierId): Courier {
  return COURIERS.find((courier) => courier.id === id) as Courier
}
