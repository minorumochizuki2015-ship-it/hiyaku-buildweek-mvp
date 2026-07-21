# NAVSHELL1 — bottom navigation + language toggle

## Reading check

### (a) How does the navigation coexist with the mission state machine?

`App` keeps ownership of the existing `idle → generating → ready → active → paused → completing → completed → nutrition` state machine. The five-item navigation is a persistent shell around its rendered output, not a replacement state machine. **Dispatch** selects that unchanged in-flow renderer: it can therefore show Dispatch, Journey, Arrival, or Nutrition exactly when the current mission state calls for it. Town, Workout, Flags, and Records select their own deliberately small placeholder panel; they do not mutate the mission state.

### (b) How does the JA/EN control swap visible text?

English remains the initial locale. An allowed `src/i18n.ts` dictionary owns English-to-Japanese UI copy, including the shell labels and the existing app copy. The persistent control changes locale state in `App`; the shell applies the dictionary to its current content and restores the English source strings when switched back. Existing Edo term pairs in the nutrition list remain as their English label plus Edo notation rather than being independently retranslated.

### (c) What happens if a mission is in progress and a user selects another tab?

While the state is `ready`, `active`, `paused`, or `completing`, the four non-Dispatch tabs are disabled. This prevents a live countdown, GPS walk, or completion request from being silently hidden or advanced in the background. The current mission remains on screen and its React state is untouched. Once the mission reaches Arrival (or there is no active mission), a user may visit a placeholder tab and return to the preserved Dispatch/Arrival/Nutrition flow.

## Status

**DONE** — no commit created.

## Implementation

- Added a persistent fixed bottom shell with exactly five destinations, in the locked order: `🏯 Town`, `🏃 Workout`, `📜 Dispatch`, `🚩 Flags`, and `📖 Records`.
- Dispatch remains the owner of the existing mission state machine. The four other destinations render an intentionally non-functional coming-soon panel and do not mutate the mission.
- During `ready`, `active`, `paused`, and `completing`, the four non-Dispatch tabs are disabled so an active mission cannot be hidden, advanced in the background, or lost.
- Added the English-default persistent JA/EN control. `src/i18n.ts` owns a dictionary and applies it to the shell subtree, so frozen NutritionScreen and ArrivalSeal copy changes without modifying either prohibited file. Existing English/Edo presentation pairs in the courier and nutrient UI remain paired rather than being double-translated.
- Added regression coverage for the five-tab order, an invoked language-control click changing `Accept Dispatch` to `任務を受ける`, and the Accept transition selecting the existing Journey renderer.

## Required command results

```text
$ npm run lint
> eslint .

$ npm run typecheck
> tsc -b --pretty false

$ npm run build
> tsc -b && vite build
vite v8.1.4 building client environment for production...
transforming...✓ 24 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.55 kB │ gzip:  0.34 kB
dist/assets/index-DkpQsFZ0.css   20.08 kB │ gzip:  5.18 kB
dist/assets/index-eDoSFOLj.js   234.08 kB │ gzip: 74.72 kB
✓ built in 65ms

$ npm run test
> vitest run
Test Files  2 passed (2)
Tests  23 passed (23)
Duration  219ms

$ git diff --check
# exited 0
```

## Browser and visual validation

- Started the required Vite dev server at `http://127.0.0.1:5174/` because port 5173 was already occupied. Also reviewed the built production output at `http://127.0.0.1:5175/`.
- At an explicit `375×812` viewport, the rendered document/body widths were both `360px` (the browser reserved 15px for its vertical scrollbar), so there was no horizontal overflow. Each nav target measured `70×61px`; the language control measured `58×44px`.
- The mobile fold visibly showed the courier identity, language toggle, five-item bar, and selected Dispatch state without clipping or overlap. The Japanese toggle visibly changed the Dispatch heading, controls, nav labels, Arrival/Nutrition headings, buttons, and input placeholder. Edo label pairs such as `Onmyoji · 符` remained intentionally paired.
- Town was viewed as a coming-soon panel; Workout, Flags, and Records were each selected and confirmed to render their matching coming-soon heading without a crash.
- With the local Worker restarted after it stopped, the normal dev route was replayed against the actual Vite proxy: `Accept Dispatch → Journey → End Mission → Arrival → Nutrition`. The Journey snapshot showed the four non-Dispatch tabs disabled while live; Arrival retained the Nutrition entry point; Nutrition rendered after its existing Arrival action.
- Production mobile and desktop captures were viewed. The production desktop used a `540px` shell and `540px` bottom bar; the five controls stayed evenly spaced. Visual review: 20 obvious-miss checks PASS, 0 FAIL, 0 N/A. Craft scores: layout 3, typography 3, color 3, spacing 3, imagery 3, responsiveness 3, motion/detail 3 (average 3.0).

## Non-claims

- Town, Workout, Flags, and Records are placeholders only; they are not implemented product features.
- This is local dev/production-build evidence, not a deployed route, iPhone Safari acceptance, or user acceptance.
- `VISUAL_SELF_REVIEW_PASS`; `USER_VISUAL_REVIEW_REQUIRED`.
