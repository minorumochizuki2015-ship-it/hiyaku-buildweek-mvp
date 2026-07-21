# CHARFIX1 — 東雲ミコト固定化

## Before-code decision record

### (a) Final single-character data shape

`shared/couriers.ts` will export one `MIKOTO` constant, not a roster type. Its
identity fields are fixed to the approved canon:

```ts
{
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
}
```

`紫電` is the seal label because it is the supplied canonical attribute; no
new crest name is invented. A small compatibility subset (`figure`, `class`,
`landmark`, etc.) mirrors these same approved values only because the
out-of-scope `worker/index.ts` still reads those keys. `COURIERS` remains a
one-element compatibility export `[MIKOTO]`, not a selectable roster.

### (b) Old roster call sites and their replacements

| Location | Previous behavior | CHARFIX1 behavior |
| --- | --- | --- |
| `shared/couriers.ts` | Six records, roster-derived `CourierId`, lookup helpers | One `MIKOTO` object; literal `CourierId` of `'mikoto'`; one-element worker compatibility export. |
| `shared/activity.ts` | `narratorCandidates` and `assignNarrator()` selected from the dominant activity | Both are removed. `dominantActivity`, score calculations, and `toGameResources` stay exactly character-independent. |
| `src/App.tsx` / Dispatch | Courier radio picker and mutable `courierId` state | Static Mikoto preview using the normal quote; dispatch submits `MIKOTO.id`. |
| `src/App.tsx` / Journey | `getCourier(mission.courierId)` chose the leader and empowerment copy | Direct `MIKOTO` name/title plus the mission-start quote. |
| `src/App.tsx` / Arrival | `getCourier()` populated variable seal identity | Direct Mikoto identity; the completion quote appears at arrival. |
| `src/ArrivalSeal.tsx` | Caller supplied variable `courierGameName`, `courierFigureEn`, and `crestName` | These fields leave `ArrivalSealData`; the seal reads fixed `MIKOTO` values internally. |
| `shared/mockMission.ts` | Lookup-dependent title, narration, and historical note | Fixed Mikoto identity and approved quote/base content; the deterministic seed no longer includes a selectable courier. |
| `src/activity.test.ts` | `assignNarrator` asserts activity-dependent IDs | Tests the preserved activity tie-break and asserts the fixed Mikoto identity is independent of activity dominance. |
| `src/screens.test.tsx` | Tadataka/Dokan strings, distinct-seal test, and variable worker fallback | Mikoto strings, fixed-seal test, and a Mikoto-only worker fallback. |

### (c) `CourierId` / `courierId` decision

Keep them, narrowed to the sole literal `'mikoto'`. The fields are part of
the existing mission/completion API and are read by `worker/index.ts`, which
is explicitly out of scope. Removing them would require changing that
prohibited file and the request schema. Validation accepts only `'mikoto'`,
and every in-scope producer hardcodes `MIKOTO.id`, so the field no longer
varies in practice.

Quote placement: Dispatch uses the normal quote, Journey uses the
mission-start quote, and Arrival uses the mission-complete quote.

## Implementation and validation record

Implemented the single fixed `MIKOTO` identity throughout the permitted
client/shared surfaces. `assignNarrator` and `narratorCandidates` are gone;
the activity scoring, `dominantActivity`, and `toGameResources` functions are
unchanged. `src/activity.test.ts` is the one additional test file changed:
the dispatch explicitly required its former narrator oracle to be inverted,
so it now proves that food-, strength-, run-, and tie-dominant inputs all
retain Mikoto and that `assignNarrator` is absent.

### Exact command results

All commands exited 0.

```text
$ npm run lint

> hikyaku-buildweek-mvp@0.0.0 lint
> eslint .
```

```text
$ npm run typecheck

> hikyaku-buildweek-mvp@0.0.0 typecheck
> tsc -b --pretty false
```

```text
$ npm run build

> hikyaku-buildweek-mvp@0.0.0 build
> tsc -b && vite build

vite v8.1.4 building client environment for production...
transforming...✓ 24 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.55 kB │ gzip:  0.34 kB
dist/assets/index-9hA8c3zY.css   22.77 kB │ gzip:  5.69 kB
dist/assets/index-AjhzWPdN.js   235.86 kB │ gzip: 75.51 kB

✓ built in 68ms
```

```text
$ npm run test

> hikyaku-buildweek-mvp@0.0.0 test
> vitest run

Test Files  3 passed (3)
Tests  26 passed (26)
Duration  244ms
```

`git diff --check` also passed.

### Live visual and interaction check

Ran the local worker on `127.0.0.1:8787` and Vite dev server on
`127.0.0.1:5173`, then exercised the normal browser route at the latter.

* Mobile (375×812): Dispatch showed the fixed Mikoto card and unchanged
  `courier-kanto-card.png`; accepting Dispatch, continuing through the
  nutrition handoff, and completing Judge Demo showed Mikoto on Journey and
  Arrival.
* Desktop (1440×900): Dispatch, Journey, and Arrival rendered without an
  identity-layout regression. Arrival's seal showed `東雲ミコト`, `carried for
  Shinonome Mikoto`, and `紫電`.
* Interaction variation: after restarting, selecting `15 min` and `Ready`
  still showed the same fixed Mikoto preview. The activity-mix unit test
  separately covers food/strength/run/tie dominance and verifies no narrator
  selector remains.

Visual self-review: the fixed identity has clear hierarchy in Dispatch,
Journey, and Arrival; the approved purple courier artwork remained visible;
no clipping, overlap, or broken rendered asset was observed in the tested
mobile and desktop views. This is local browser evidence only; final
human visual acceptance remains required.

When the manually stopped Vite server closed, its terminal logged an
`Unhandled error` from a `blob:http://127.0.0.1:5173/...` `Communication`
script attempting `addListener`. The completed browser flow did not show an
application failure, but this blob's source was not verified, so it is not
claimed as an application-clean runtime log.

### Scoped non-claims

* `worker/index.ts` was not changed, as required. It retains its generic
  one-item `COURIERS` lookup, but can now resolve only `MIKOTO`.
* `PROGRESS_ACTIVITY1.md` still documents the former `assignNarrator` design
  as historical progress text. It is outside this dispatch's editable scope;
  it is not executable code.
* The existing English localizer renders `江戸` as `EDO` in some English-mode
  UI text (for example, `EDO本陣の御用便`). The fixed source data retains the
  exact approved Japanese canon, and `src/i18n.ts` was intentionally not
  changed.
* No deployment, public-release, device, or production acceptance was
  performed. No git commit was made.

## Status

DONE — CHARFIX1 implementation, automated validation, and local browser
verification are complete. No commit requested or made.
