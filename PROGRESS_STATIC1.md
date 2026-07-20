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
