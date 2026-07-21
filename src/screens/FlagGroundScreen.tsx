import type { CSSProperties } from 'react'
import './flag-ground.css'

export type FlagGroundLocale = 'en' | 'ja'
export type FlagGroundState = 'stable' | 'contested' | 'at-risk'

/**
 * `courierFlagPower` is the 0–100 run score. At 35 a ground becomes contested;
 * at 70 it is stable. Anything below 35 is at risk, including a measured zero.
 */
export const FLAG_GROUND_STATE_THRESHOLDS = {
  contestedAt: 35,
  stableAt: 70,
} as const

export function flagGroundStateForPower(power: number): FlagGroundState {
  if (power >= FLAG_GROUND_STATE_THRESHOLDS.stableAt) return 'stable'
  if (power >= FLAG_GROUND_STATE_THRESHOLDS.contestedAt) return 'contested'
  return 'at-risk'
}

function normalizedPower(power: number): number {
  if (!Number.isFinite(power)) return 0
  return Math.max(0, Math.min(100, Math.round(power)))
}

const COPY = {
  en: {
    eyebrow: 'YOUR FLAG GROUND',
    title: 'Flag ground',
    lead: 'A quiet place held by your walking.',
    personalGround: 'Nihonbashi Honjin',
    personalLabel: 'Your ground',
    power: 'Courier flag power',
    powerHelp: 'Walking a goyo raises your flag power.',
    stable: 'Stable',
    contested: 'Contested',
    atRisk: 'At risk',
    stableCopy: 'Your ground is steady.',
    contestedCopy: 'Keep walking to strengthen your ground.',
    atRiskCopy: 'A short goyo can help reinforce your ground.',
    previewTitle: 'Grounds opening later',
    previewCopy: 'These grounds will open in a later chapter.',
    locked: 'Locked',
    walkAction: 'Walk a goyo',
    reassurance: 'Rest whenever you need. There is no penalty.',
    groundNames: ['Shiba', 'Ikebukuro', 'Shinagawa', 'Shinjuku'],
  },
  ja: {
    eyebrow: 'あなたの旗場',
    title: '旗場',
    lead: '歩いた分だけ、静かに守られる場所です。',
    personalGround: '日本橋本陣',
    personalLabel: 'あなたの旗場',
    power: '飛脚旗の力',
    powerHelp: '御用を歩くと、旗力が上がります。',
    stable: '安定',
    contested: '競り合い',
    atRisk: '危険',
    stableCopy: '落とされる心配はほとんどありません。',
    contestedCopy: '互いに競っています。気を抜かずに！',
    atRiskCopy: '落とされる可能性が高い状態です。',
    previewTitle: 'これから開く旗場',
    previewCopy: 'ほかの旗場は、次の章で開きます。',
    locked: 'ロック中',
    walkAction: '御用を歩く',
    reassurance: '休憩してもペナルティはありません。',
    groundNames: ['芝', '池袋', '品川', '新宿'],
  },
} as const

export interface FlagGroundScreenProps {
  courierFlagPower: number
  locale: FlagGroundLocale
  onWalk: () => void
}

export function FlagGroundScreen({ courierFlagPower, locale, onWalk }: FlagGroundScreenProps) {
  const power = normalizedPower(courierFlagPower)
  const state = flagGroundStateForPower(power)
  const copy = COPY[locale]
  const stateLabel = state === 'stable' ? copy.stable : state === 'contested' ? copy.contested : copy.atRisk
  const stateCopy = state === 'stable' ? copy.stableCopy : state === 'contested' ? copy.contestedCopy : copy.atRiskCopy

  return (
    <main className="flag-ground" aria-labelledby="flag-ground-title" lang={locale}>
      <header className="flag-ground__header">
        <span className="flag-ground__crest" aria-hidden="true">⚑</span>
        <div>
          <p className="flag-ground__eyebrow">{copy.eyebrow}</p>
          <h1 id="flag-ground-title">{copy.title}</h1>
          <p className="flag-ground__lead">{copy.lead}</p>
        </div>
      </header>

      <section className="flag-ground__district" aria-label={copy.personalLabel}>
        <div className="flag-ground__routes" aria-hidden="true" />
        <article className={`flag-ground__own-ground is-${state}`}>
          <span className="flag-ground__flag" aria-hidden="true">⚑</span>
          <span className="flag-ground__own-label">{copy.personalLabel}</span>
          <strong>{copy.personalGround}</strong>
          <span className={`flag-ground__state-pill is-${state}`}>{stateLabel}</span>
        </article>
        <div className="flag-ground__locked-grounds" aria-label={copy.previewTitle}>
          {copy.groundNames.map((name) => (
            <div className="flag-ground__locked-ground" key={name}>
              <span aria-hidden="true">🔒</span>
              <strong>{name}</strong>
              <small>{copy.locked}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="flag-ground__power" aria-labelledby="flag-ground-power-title">
        <div className="flag-ground__power-heading">
          <div>
            <h2 id="flag-ground-power-title">{copy.power}</h2>
            <p>{stateCopy}</p>
          </div>
          <strong aria-label={`${copy.power}: ${power} / 100`}>{power}<small>/100</small></strong>
        </div>
        <div
          className={`flag-ground__gauge is-${state}`}
          role="meter"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={power}
          aria-label={copy.power}
        >
          <span style={{ '--flag-power': `${power}%` } as CSSProperties} />
        </div>
        <p className="flag-ground__power-help">{copy.powerHelp}</p>
      </section>

      <section className="flag-ground__preview" aria-labelledby="flag-ground-preview-title">
        <span className="flag-ground__preview-lock" aria-hidden="true">🔒</span>
        <div>
          <h2 id="flag-ground-preview-title">{copy.previewTitle}</h2>
          <p>{copy.previewCopy}</p>
        </div>
      </section>

      {/* powerHelp is already printed under the gauge it explains; repeating it
          directly above the button said the same sentence twice on one screen. */}
      <section className="flag-ground__action" aria-label={copy.walkAction}>
        <button type="button" onClick={onWalk}>{copy.walkAction} <span aria-hidden="true">›</span></button>
        <p>{copy.reassurance}</p>
      </section>
    </main>
  )
}
