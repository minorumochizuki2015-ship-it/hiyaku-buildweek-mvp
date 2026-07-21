export type Locale = 'en' | 'ja'

type TranslationKey =
  | 'nav.aria'
  | 'nav.town'
  | 'nav.workout'
  | 'nav.dispatch'
  | 'nav.flags'
  | 'nav.records'
  | 'nav.goyoHelp.aria'
  | 'nav.goyoHelp.copy'
  | 'arrival.couriersTable'
  | 'placeholder.eyebrow'
  | 'placeholder.title'
  | 'placeholder.copy'
  | 'placeholder.return'
  | 'offline.mission'
  | 'offline.nutrition'

const UI_COPY: Record<Locale, Record<TranslationKey, string>> = {
  en: {
    'nav.aria': 'HIKYAKU navigation',
    'nav.town': 'Town',
    'nav.workout': 'Workout',
    'nav.dispatch': 'Goyo',
    'nav.flags': 'Flags',
    'nav.records': 'Records',
    'nav.goyoHelp.aria': 'Explain Goyo',
    'nav.goyoHelp.copy': 'Goyo — today\'s courier duty from the Nihonbashi headquarters.',
    'arrival.couriersTable': "Courier's table",
    'placeholder.eyebrow': 'HIKYAKU LEDGER',
    'placeholder.title': '{tab} is coming soon.',
    'placeholder.copy': 'This destination is reserved for a future HIKYAKU chapter. Your courier mission remains available from Dispatch.',
    'placeholder.return': 'Return to Dispatch',
    'offline.mission': 'Offline demo — narrative generated locally',
    'offline.nutrition': 'Offline demo — nutrition estimated locally',
  },
  ja: {
    'nav.aria': 'HIKYAKU ナビゲーション',
    'nav.town': '町',
    'nav.workout': 'ワークアウト',
    'nav.dispatch': '御用',
    'nav.flags': '旗場',
    'nav.records': '記録帳',
    'nav.goyoHelp.aria': '御用の説明を表示',
    'nav.goyoHelp.copy': '御用 — 日本橋本陣から届く、本日のつとめ。',
    'arrival.couriersTable': '食の帳簿',
    'placeholder.eyebrow': 'HIKYAKU 帳簿',
    'placeholder.title': '{tab} は準備中です。',
    'placeholder.copy': 'この行き先は、HIKYAKU の次章のために用意されています。飛脚任務は「任務」からいつでも続けられます。',
    'placeholder.return': '任務へ戻る',
    'offline.mission': 'オフラインのデモ表示 — 物語は端末内で生成しています',
    'offline.nutrition': 'オフラインのデモ表示 — 栄養値は端末内で推定しています',
  },
}

/**
 * Static copy is kept as a source-to-translation table so the allowed shell
 * can localize the existing frozen screen components without changing them.
 */
const JA_TEXT: Record<string, string> = {
  'Shinonome Mikoto': '東雲ミコト',
  'Violet Lightning': '紫電',
  'HIKYAKU / EDO COURIER': '飛脚 HIKYAKU / 江戸の配達人',
  EDO: '江戸',
  'Turn a short walk into an Edo courier mission.': '短い散歩を、江戸の飛脚任務に変えよう。',
  'Edo courier introduction': '江戸の飛脚の紹介',
  'Edo courier of Kanto, ready for dispatch': '任務に備える関東の江戸飛脚',
  DEMO: '体験版',
  'You are an Edo hikyaku (courier). Accept a dispatch, carry it, arrive.': 'あなたは江戸の飛脚。任務を受け、荷を運び、到着しよう。',
  'Available minutes': '使える時間',
  ' min': ' 分',
  'Choose your courier': '飛脚を選ぶ',
  'Choose your historical courier': '歴史上の飛脚を選ぶ',
  'Empowered by ': '活力の源: ',
  'Movement mode': '移動モード',
  'Real Walk': '実際に歩く',
  'Judge Demo': '審査デモ',
  'Judge Demo simulates the walk so you can complete a full mission without moving.': '審査デモでは歩行を再現するため、歩かなくても任務を完了できます。',
  'Real Walk: your location stays on your device.': '実際に歩く: 位置情報はこの端末だけに残ります。',
  Energy: '体力',
  Low: '低め',
  Steady: '安定',
  Ready: '万全',
  'Your name ': 'あなたの名前 ',
  '(optional)': '（任意）',
  'Courier name': '飛脚名',
  'Preparing your mission…': '任務を準備しています…',
  'Accept Dispatch': '任務を受ける',
  'Edo checkpoint route': '江戸の関所ルート',
  'Next:': '次:',
  'Final stretch — the destination awaits.': '最後の道のりです。目的地が待っています。',
  'Mission ready': '任務の準備完了',
  'Journey paused': '旅を一時停止中',
  'Writing arrival…': '到着記録を作成中…',
  'REAL WALK': '実際に歩く',
  'JUDGE DEMO': '審査デモ',
  'Courier route progress': '飛脚ルートの進行状況',
  'Illustrated Kanto route map': '関東ルートの案内図',
  '% along the route': '% ルート進行',
  '% complete': '% 完了',
  'Your ': 'あなたの ',
  ' strengthens ': ' が支える ',
  ' elapsed': ' 経過',
  ' remaining': ' 残り',
  'Journey metrics': '旅の記録',
  'AI PACER · SIMULATED': 'AI ペーサー · シミュレーション',
  'even with you': 'あなたと並走',
  'm ahead': 'm 前方',
  'm behind': 'm 後方',
  'You and Yuzu, the simulated AI pacer, finished even.': 'あなたとシミュレーション AI ペーサーのユズは同時に到着しました。',
  'You finished ': 'あなたは ',
  'm ahead of Yuzu, the simulated AI pacer.': 'm、シミュレーション AI ペーサーのユズより先に到着しました。',
  'Yuzu, the simulated AI pacer, finished ': 'シミュレーション AI ペーサーのユズは ',
  'm ahead of you.': 'm、あなたより先に到着しました。',
  'Resume Journey': '旅を再開',
  Pause: '一時停止',
  'End Mission': '任務を終える',
  'Location unavailable — continuing with Judge Demo.': '位置情報を利用できないため、審査デモを続けます。',
  'Golden Edo town arrival scene': '黄金色の江戸の町への到着風景',
  'ARRIVAL RECORDED': '到着を記録しました',
  'Your courier run has found its door.': 'あなたの飛脚行は、目的の扉へたどり着きました。',
  'From Edo:': '江戸から:',
  'Next dispatch:': '次の任務:',
  'View nutrition report': '栄養レポートを見る',
  'Share Seal': '印を共有',
  'Return to town': '町へ戻る',
  'Start Another Mission': '次の任務を始める',
  'Seal shared as an image.': '印を画像として共有しました。',
  'Seal summary shared.': '印の概要を共有しました。',
  'Seal PNG downloaded.': '印の PNG を保存しました。',
  'Seal summary copied to clipboard.': '印の概要をクリップボードにコピーしました。',
  'Sharing was cancelled. Your result is still complete.': '共有を中止しました。任務結果は完了したままです。',
  'HIKYAKU · ARRIVAL SEAL': 'HIKYAKU · 到着の印',
  'carried for ': '届け先: ',
  DELIVERED: '配達済',
  distance: '距離',
  duration: '時間',
  complete: '完了',
  'COURIER’S TABLE': '飛脚の食卓',
  'Nutrition Report': '栄養レポート',
  '← Arrival': '← 到着',
  'Log one meal. Real package data leads; estimates fill only what is missing.': '食事を一つ記録しましょう。実際の食品データを優先し、足りない部分だけを推定で補います。',
  'What did you eat?': '何を食べましたか？',
  'e.g. banana or salmon rice bowl': '例: バナナ、または鮭の丼',
  'Amount (grams)': '量（グラム）',
  'Reading the table…': '食卓を調べています…',
  'Make nutrition report': '栄養レポートを作る',
  'Looking up your meal…': '食事を調べています…',
  'That report could not be prepared. Try again in a moment.': 'レポートを作成できませんでした。少ししてからもう一度お試しください。',
  'Meal nutrition report': '食事の栄養レポート',
  'FOOD SCORE': '食事スコア',
  'Open Food Facts + estimate': 'Open Food Facts + 推定',
  'Open Food Facts': 'Open Food Facts',
  'AI estimate for missing data': '不足データの AI 推定',
  'AI estimate': 'AI 推定',
  'Reliable local estimate': '信頼できるローカル推定',
  'Real food data': '実際の食品データ',
  'Local fallback estimate': 'ローカルの代替推定',
  '“Low”, “OK”, and “High” compare this meal with the app’s three-meal Japanese baseline; this is not medical advice.': '「低め」「適正」「高め」は、この食事をアプリ内の日本の三食基準と比較した目安であり、医療上の助言ではありません。',
  OK: '適正',
  High: '高め',
  'the Lantern Dispatch': '灯籠の任務',
  'the Dawn Reply': '夜明けの返書',
  'the Wayfarer’s Token': '旅人の印',
  'A sealed dispatch awaits beneath the evening lanterns.': '夕暮れの灯籠の下で、封じた任務が待っています。',
  'A reply must reach its door before the morning crowd gathers.': '朝の人波が集まる前に、返書を届けなければなりません。',
  'A wayfarer’s token needs a steady hand and a clear road.': '旅人の印には、確かな手と澄んだ道が必要です。',
  'marks the first stretch.': 'が最初の道のりを記します。',
  'spirit is steady.': 'の心は安定しています。',
  'Halfway to the handoff — ': '受け渡し地点まで半分です — ',
  'keeps the route clear.': 'が道を整えています。',
  'Keep your ': 'あなたの ',
  ' focus and carry it with care.': 'の集中を保ち、大切に運びましょう。',
  onmyoji: '陰陽師',
  samurai: '侍',
  miko: '巫女',
  archer: '弓使い',
  musician: '楽士',
  spearman: '槍使い',
  'feels close. One more measured push for the dispatch.': 'が近づいています。任務へ、もうひと踏ん張りです。',
  records: 'は記録します',
  'as complete. Your ': 'を完了として。あなたの ',
  'metre journey reached its destination as an ': 'メートルの旅を完了しました。称号: ',
  'Edo Roadrunner': '江戸の疾走飛脚',
  'Steady Courier': '堅実な飛脚',
  'rest, hydration, and steady walks': '休息、水分補給、安定した歩行',
  'strength training and focus': '筋力トレーニングと集中',
  'logging meals, water, and rest': '食事・水分・休息の記録',
  'long walks and distance': '長い歩行と距離',
  'music and light movement': '音楽と軽い運動',
  'strength and hill climbs': '筋力と坂道歩行',
  ' leads from Sawara, Katori.': 'は香取・佐原から先導します。',
  ' leads from Edo Castle.': 'は江戸城から先導します。',
  ' leads from Mito.': 'は水戸から先導します。',
  ' leads from Nasu.': 'は那須から先導します。',
  ' leads from Nihonbashi.': 'は日本橋から先導します。',
  ' leads from Fukaya, Musashi.': 'は武蔵・深谷から先導します。',
  'will have another dispatch ready beyond Sawara, Katori.': 'は香取・佐原の先に、次の任務を用意しています。',
  'will have another dispatch ready beyond Edo Castle.': 'は江戸城の先に、次の任務を用意しています。',
  'will have another dispatch ready beyond Mito.': 'は水戸の先に、次の任務を用意しています。',
  'will have another dispatch ready beyond Nasu.': 'は那須の先に、次の任務を用意しています。',
  'will have another dispatch ready beyond Nihonbashi.': 'は日本橋の先に、次の任務を用意しています。',
  'will have another dispatch ready beyond Fukaya, Musashi.': 'は武蔵・深谷の先に、次の任務を用意しています。',
  'Sawara, Katori': '香取・佐原',
  Yuzu: 'ユズ',
  'An Edo-period merchant who took up surveying at 55 and walked roughly 40,000 km along Japan\'s coasts to complete the first accurate map of the country.': '55歳で測量を始め、日本の海岸を約4万km歩いて最初の正確な日本地図を完成させた江戸時代の商人です。',
  'A 15th-century warrior-poet who built the first Edo Castle in 1457, on the ground that would centuries later become Tokyo.': '1457年、後に東京となる地に最初の江戸城を築いた15世紀の武人詩人です。',
  "The second lord of the Mito domain, who sponsored the vast 'Dai Nihonshi' chronicle of Japan and lived on as a legendary traveling folk hero.": '『大日本史』の編さんを支え、伝説的な旅の英雄として語り継がれた水戸藩第二代藩主です。',
  'A young archer of the Genpei War, famed in the Tale of the Heike for shooting down a fan target set on a boat at the Battle of Yashima.': '源平合戦で、屋島の戦いの舟上の扇を射落としたことで『平家物語』に名高い若き弓使いです。',
  'An Edo publisher (1750-1797) who launched the careers of the ukiyo-e masters Sharaku and Utamaro from his shop near Nihonbashi.': '日本橋近くの店から、写楽や歌麿ら浮世絵師の活躍を支えた江戸の出版人です。',
  'A Kamakura-period warrior of Musashi renowned for strength and honor, celebrated for carrying his own horse down a steep cliff in battle.': '強さと名誉で知られ、戦いで自らの馬を担いで急な崖を下ったと伝わる鎌倉期の武蔵武士です。',
}

function replacementEntries(locale: Locale): Array<[string, string]> {
  const source: Array<[string, string]> = locale === 'ja'
    ? Object.entries(JA_TEXT)
    : Object.entries(JA_TEXT).map(([english, japanese]) => [japanese, english] as [string, string])
  return source.sort(([first], [second]) => second.length - first.length)
}

function replaceAll(value: string, from: string, to: string): string {
  return value.split(from).join(to)
}

export function translateText(value: string, locale: Locale): string {
  if (locale === 'en' && !Object.values(JA_TEXT).some((japanese) => value.includes(japanese))) return value
  return replacementEntries(locale).reduce((translated, [from, to]) => replaceAll(translated, from, to), value)
}

export function t(locale: Locale, key: TranslationKey, replacements: Record<string, string> = {}): string {
  return Object.entries(replacements).reduce(
    (value, [token, replacement]) => replaceAll(value, `{${token}}`, replacement),
    UI_COPY[locale][key],
  )
}

function shouldKeepEdoTerm(element: Element): boolean {
  return Boolean(element.closest('.nutrient-list'))
}

function translateElement(element: Element, locale: Locale): void {
  if (shouldKeepEdoTerm(element)) return
  for (const attribute of ['alt', 'aria-label', 'placeholder', 'title']) {
    const value = element.getAttribute(attribute)
    const translated = value ? translateText(value, locale) : value
    if (value && translated && translated !== value) element.setAttribute(attribute, translated)
  }
}

/** Applies the dictionary to a live shell subtree, including frozen child screens. */
export function localizeContent(root: HTMLElement, locale: Locale): void {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const textNodes: Text[] = []
  while (walker.nextNode()) textNodes.push(walker.currentNode as Text)
  for (const node of textNodes) {
    const parent = node.parentElement
    if (!parent || shouldKeepEdoTerm(parent)) continue
    const translated = translateText(node.data, locale)
    if (translated !== node.data) node.data = translated
  }
  root.querySelectorAll('*').forEach((element) => translateElement(element, locale))
}
