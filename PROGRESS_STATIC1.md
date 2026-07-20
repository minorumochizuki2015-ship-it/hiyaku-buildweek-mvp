# Static happy path — lane STATIC1

## Status: BLOCKED (commit permission)

## Fix round — TypeScript configuration

The build had two missing ambient type declarations: Vite client types for the
CSS side-effect import in `src/main.tsx`, and the Cloudflare Worker
`ExportedHandler` type in `worker/index.ts`.

Changed:

- Added `src/vite-env.d.ts` with `/// <reference types="vite/client" />`;
  `tsconfig.app.json` already includes `src`.
- Added `@cloudflare/workers-types` as a development dependency, updated the
  lockfile, and scoped it to `tsconfig.node.json`, which includes `worker/`.

Real verification output:

```text
$ npm run typecheck
> tsc -b --pretty false

$ npm run build
> tsc -b && vite build
vite v8.1.4 building client environment for production...
✓ 17 modules transformed.
✓ built in 476ms

$ npm run lint
> eslint .

$ npm run test
> vitest run
Test Files  1 passed (1)
Tests  3 passed (3)
```

The TypeScript fix round is **DONE**. The earlier sandbox-only installation and
visual review notes below are historical; the required package scripts above
were run successfully in this worktree after the fixes.

Commit status is **BLOCKED** by this sandbox's filesystem boundary. `git add -A`
could not create
`/Users/moc/ORCH-Next/projects/hiyaku-buildweek-mvp/.git/worktrees/lane-STATIC1-happy-path/index.lock`
because that parent Git metadata directory is not writable from this worktree.
No files were staged or committed.

The requested source implementation is present, including the three-screen UI,
deterministic local mocks, state machine, Worker scaffold, smoke tests, and
local-run README. The required `npm` validation commands and browser walkthrough
are blocked in this sandbox because it cannot resolve `registry.npmjs.org` to
install the declared toolchain. This report does not claim that lint,
typecheck, build, test, a Vite dev server, or a 390px visual review passed.

## What was built

- Manual equivalent of the Vite React TypeScript scaffold: Vite config,
  TypeScript configs, ESLint config, package scripts, app entrypoint, and
  responsive CSS.
- Dispatch screen with constrained 5/10/15 minute and Low/Steady/Ready choices,
  optional name, and `Generate My Mission` action.
- Exact named app states: `idle -> generating -> ready -> active -> paused ->
  completing -> completed -> idle`. `ready` and `completing` are deliberate
  brief transition states before Journey becomes active and before Arrival is
  shown. Pause/Resume and End Mission are available in Journey; restart returns
  to idle.
- Journey screen with a CSS courier, single SVG route ribbon, elapsed time,
  distance, percent, milestone copy at 25/50/75%, and a clearly visible `DEMO`
  / `Demo Journey` label. The local demo tick is deterministic and reaches
  completion; GPS is intentionally not included.
- Arrival screen with summary metrics, rank, mock epilogue, curated carried
  historical note, share-or-copy fallback, and restart.
- Shared deterministic mocks. Selection uses a FNV-style input hash of minutes,
  energy, and normalized display name; it does not use `Math.random()`.
- Cloudflare Worker scaffold in `worker/index.ts` plus `wrangler.toml`.
  `POST /api/mission` and `POST /api/complete` validate their JSON body and
  return the same local mock response contracts. Invalid input returns 400.
- Vitest smoke tests for Dispatch, Journey, and Arrival rendering/primary
  actions, ready to run after `npm install` succeeds.
- README local-run section.

## Judgment call: missing API examples

`HACKATHON.md` names the routes but contains no literal JSON response examples.
I used the JSON field contracts explicitly stated in the dispatch:

- mission: `title`, `briefing`, `milestones` keyed by `25`/`50`/`75`,
  `historicalNote`, `completionStyle`;
- completion: `rank`, `epilogue`, `nextMissionTeaser`.

This preserves the product’s control boundary: the app owns demo progress and
completion; the mock/next AI lane owns narrative fields only. Historical notes
are fixed local data.

## Commands run and actual output

### Toolchain installation (blocked by DNS)

Command:

```text
npm install --loglevel verbose
```

Output before the command was interrupted after repeated retries:

```text
npm verbose cli /opt/homebrew/Cellar/node/25.9.0_3/bin/node /opt/homebrew/bin/npm
npm info using npm@11.12.1
npm info using node@v25.9.0
npm verbose title npm install
npm verbose argv "install" "--loglevel" "verbose"
npm verbose logfile logs-max:10 dir:/Users/moc/.npm/_logs/2026-07-20T21_43_21_340Z-
npm verbose logfile could not be created: Error: EPERM: operation not permitted, open '/Users/moc/.npm/_logs/2026-07-20T21_43_21_340Z-debug-0.log'
npm verbose logfile no logfile created
npm http fetch GET https://registry.npmjs.org/@vitejs%2fplugin-react attempt 1 failed with ENOTFOUND
npm http fetch GET https://registry.npmjs.org/@vitejs%2fplugin-react attempt 2 failed with ENOTFOUND
npm http fetch GET https://registry.npmjs.org/@vitejs%2fplugin-react attempt 3 failed with ENOTFOUND
npm http fetch GET https://registry.npmjs.org/vite attempt 1 failed with ENOTFOUND
npm http fetch GET https://registry.npmjs.org/vite attempt 2 failed with ENOTFOUND
```

The offline-cache retry also failed because the sandbox cache has no usable
package-index response for this install:

```text
npm error code ENOTCACHED
npm error request to https://registry.npmjs.org/@eslint%2fjs failed: cache mode is 'only-if-cached' but no cached response is available.
npm error Log files were not written due to an error writing to the directory: /Users/moc/.npm/_logs
npm error You can rerun the command with `--loglevel=verbose` to see the logs in your terminal
```

### Required package scripts (not passing: dependencies are unavailable)

```text
$ npm run lint

> hiyaku-buildweek-mvp@0.0.0 lint
> eslint .

sh: eslint: command not found
```

```text
$ npm run typecheck

> hiyaku-buildweek-mvp@0.0.0 typecheck
> tsc -b --pretty false

sh: tsc: command not found
```

```text
$ npm run build

> hiyaku-buildweek-mvp@0.0.0 build
> tsc -b && vite build

sh: tsc: command not found
```

```text
$ npm run test

> hiyaku-buildweek-mvp@0.0.0 test
> vitest run

sh: vitest: command not found
```

### Static source bundle and Worker endpoint invocation (passed)

Command:

```text
/Users/moc/.npm/_npx/c943b712072b77c4/node_modules/esbuild/bin/esbuild src/App.tsx --bundle --format=esm --external:react --external:react-dom --outfile=/private/tmp/hiyaku-app-check.mjs
/Users/moc/.npm/_npx/c943b712072b77c4/node_modules/esbuild/bin/esbuild worker/index.ts --bundle --format=esm --platform=browser --outfile=/private/tmp/hiyaku-worker-check.mjs
node -e "import('/private/tmp/hiyaku-worker-check.mjs').then(...)"
```

Output:

```text
../../../../../../../../private/tmp/hiyaku-app-check.mjs  14.7kb

Done in 4ms

../../../../../../../../private/tmp/hiyaku-worker-check.mjs  4.3kb

Done in 1ms
mission 200 {"title":"The Tea House Reply","briefing":"Deliver a gracious reply before the tea house closes its sliding doors.","milestones":{"25":"The scent of roasted tea points you onward.","50":"Your destination is now part of the evening bustle.","75":"The tea house bell is within reach."},"historicalNote":"Edo tea houses were lively social stops for travelers, messengers, and merchants.","completionStyle":"Warm and swift"}
invalid-mission 400 {"error":"Invalid mission input. Expected availableMinutes (5, 10, or 15), energy, and optional displayName."}
complete 200 {"rank":"Edo Roadrunner","epilogue":"The Lantern Ledger is complete. Your 480 metre journey reached its destination as an Edo Roadrunner.","nextMissionTeaser":"Next time, a dawn message waits at the river crossing."}
```

### Wrangler local dev attempt (blocked by sandbox)

Command:

```text
node /Users/moc/.npm/_npx/c943b712072b77c4/node_modules/wrangler/bin/wrangler.js dev --local --port 8787
```

Output:

```text
ERROR Failed to write to log file: EPERM: operation not permitted, open '/Users/moc/Library/Preferences/.wrangler/logs/wrangler-2026-07-20_21-48-15_056.log'
wrangler 4.111.0
ERROR Failed to bind to 127.0.0.1:9229: permission denied.
This usually means a sandbox or security policy is preventing network access.
```

### Diff/secret-shaped-string check (passed)

Command:

```text
git diff --check
grep -RInE '(sk-[A-Za-z0-9_-]{8,}|api[_-]?key|authorization:[[:space:]]*bearer|BEGIN (RSA|OPENSSH|EC) PRIVATE KEY)' --exclude-dir=.git --exclude=PROGRESS_STATIC1.md .
```

Output: no matches and `git diff --check` produced no errors.

The accompanying no-`Math.random()` / no-hikyaku-source check found only the
pre-existing text `hikyaku-app project` in `PLAN.md`, which this lane was
explicitly forbidden to edit. No new app source imports or references it.

## Remaining validation / blocker

1. Restore npm registry access (or provide the dependency cache) and run
   `npm install`, then all four required scripts.
2. Start `npm run dev`, click the full state path at 390px, and capture/view
   all three screens. This is currently `VISUAL_REVIEW_BLOCKED_NO_RENDER`, not
   a visual pass; no browser/dev-server claim is made.
3. Optionally run `npm run worker:dev` outside this restrictive sandbox; its
   source code and direct request behavior were validated above, but local
   loopback binding was not available here.

## 2026-07-21 — VISUAL1 asset redesign

### Status: DONE

Replaced only the presentation layer for the existing Dispatch → Journey →
Arrival flow. The state machine, mock generation/completion data, and Worker
contracts were not changed.

### What changed

- Adopted a deep indigo surface (`#0C1022`), lantern gold (`#F4B942`), and
  courier violet (`#9C78FF`) theme with high-contrast cream body copy.
- **Dispatch:** made `courier-kanto-card.png` the prominent visual focal point
  above the unchanged mission form.
- **Journey:** replaced the CSS courier and SVG squiggle with
  `kanto-route-map.png` plus a foreground SVG `<circle>` ring. Its
  `strokeDasharray` is calculated from the existing `stats.progress`; the
  center reports completed metres/progress and retains elapsed/remaining
  information, milestone copy, Pause, and End Mission controls.
- **Arrival:** added `arrival-honjin-goze.mp4` as muted, looping, inline hero
  media with a dark legibility wash; existing completion content sits below it.
- **Optional closing beat:** chose Arrival for a single small `今日の一食`
  button so Dispatch stays focused on starting a mission. It conditionally
  mounts a closable modal with muted, inline `meal-reward-kanto.mp4`; it is not
  in Arrival's initial rendered markup.
- Extended smoke tests to cover the new Dispatch/Arrival assets, Journey ring
  label, and the initial absence of the meal-video source.

### Design plan and self-critique

Palette: ink `#0C1022`, raised indigo `#191D36`, cream `#F7F2E8`, lantern gold
`#F4B942` / `#F7D98A`, courier violet `#9C78FF`. Display uses Georgia with
Japanese Mincho fallback; body/utility uses Avenir Next with Hiragino/Meiryo
fallback. On mobile the first viewport places the courier card and start
context before the form; Journey places the ring over the actual route map;
Arrival gives the golden town video the hero slot. The signature element is
the circular lantern-gold route ring. Motion is limited to the existing
progress-ring transition; the silent Arrival video is muted/inline and all
motion is reduced under `prefers-reduced-motion`.

Self-critique: this avoids the previous cream/maroon treatment and does not
use generic abstract hero art—the prepared character, map, and town footage
are the subject. Gold is reserved for active selections, status, and actions;
violet is secondary. The only nested overlay is the meal dialog, where it is
the intentional interaction. No scroll-reveal animation was added.

### Real verification output

```text
$ npm run lint
> eslint .

$ npm run typecheck
> tsc -b --pretty false

$ npm run test
> vitest run
Test Files  1 passed (1)
Tests  3 passed (3)

$ npm run build
> tsc -b && vite build
vite v8.1.4 building client environment for production...
✓ 17 modules transformed.
dist/index.html                   0.55 kB │ gzip:  0.34 kB
dist/assets/index-Ck52ROmU.css    9.30 kB │ gzip:  2.88 kB
dist/assets/index-PQE5h3LJ.js   201.43 kB │ gzip: 63.54 kB
✓ built in 84ms
```

Browser walkthrough on `http://127.0.0.1:5173/` exercised Generate → active
Journey → End Mission → Arrival at `375×812` and `1440×900`. The same run
opened the meal dialog. Request logging found:

```text
initialMealRequests: []
afterMealRequests: [
  "http://127.0.0.1:5173/assets/meal-reward-kanto.mp4",
  "http://127.0.0.1:5173/assets/meal-reward-kanto.mp4",
  "http://127.0.0.1:5173/assets/meal-reward-kanto.mp4"
]
```

The browser made no meal-video request on initial load at either viewport; it
requested the clip only after the optional modal was opened. The source lives
inside the conditional `mealOpen` branch and uses `preload="none"`.
Vite copies supplied `public/` files to `dist/` as static files, but the MP4 is
not imported or inlined into the initial JS/CSS payload and was not fetched by
the initial page request.

### Contrast/readability spot-check

Computed styles at 375px: Dispatch heading `rgb(247,242,232)`, intro/form
labels `rgb(232,228,220)`, and primary-button text `rgb(33,24,14)` on
`rgb(244,185,66)`; Journey milestone/ring `rgb(247,242,232)` / `rgb(255,250,240)`
on `#191D36` / translucent `#0C1022`; detail labels `rgb(201,197,208)` on
`#0C1022`; Arrival epilogue `rgb(247,242,232)`, note `rgb(232,228,220)`, and
meal label `rgb(247,217,138)` on indigo raised surfaces. Opaque pair ratios:
cream/ink `16.91:1`, pale body/ink `14.88:1`, dark CTA text/gold `9.87:1`,
cream/raised indigo `14.82:1`, detail/ink `11.13:1`, gold/ink `13.70:1`.
Arrival-video header uses `#FFFAF0`, `#FFE3A1`, and `#FFF7E8` over a dark
bottom gradient plus text shadow; screenshots showed the words clearly over
the moving town imagery.

### Visual self-review

Viewed captures: Dispatch, Journey, Arrival, and meal dialog at 375px and
1440px (plus two duplicate Dispatch captures from the initial production
capture), 10 images total. Mobile first impression: clearly a courier mission,
with the courier card as intended focal point and a visible primary action;
professional rather than template-like. Obvious-miss checklist: 20 PASS,
0 FAIL, with photo-text competition mitigated by the Journey wash/ring and
Arrival gradient. Craft scores: layout 3, typography 3, color 4, spacing 3,
imagery 4, responsiveness 3, motion/detail 3 (average 3.29). Result:
`VISUAL_SELF_REVIEW_PASS`.

Highest-value future improvement (not required for this lane): capture a
non-zero live Journey frame for promotion/demo material so the gold ring is
shown partially completed rather than at the 0% start state.

Non-claim: `USER_VISUAL_REVIEW_REQUIRED`; this is local desktop browser
evidence, not deployed-route or iPhone Safari acceptance.
