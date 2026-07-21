# REFRAME1 — Courier framing

## Status

**DONE** — Dispatch and Journey copy now leads with Edo courier identity and a
self-contained dispatch episode. No Arrival screen or arrival-related code/CSS
was changed.

## Copy changes

| Surface | Before | After |
| --- | --- | --- |
| Dispatch hero | `A small walk, with a destination.` | `Turn a short walk into an Edo courier mission.` |
| Dispatch intro | `Tell us the time and spirit you have today. We will hand you one courier mission.` | `You are an Edo hikyaku (courier). Accept a dispatch, carry it, arrive.` |
| Primary action | `Generate My Mission` | `Accept Dispatch` |
| Walk option | `Walk Mode` | `Real Walk` |
| Demo option | `Demo Journey` | `Judge Demo` |
| Journey progress label | `Walk Mode` / `Demo Journey` | `Real Walk` / `Judge Demo` |
| Journey badge | `WALK` / `DEMO` | `REAL WALK` / `JUDGE DEMO` |
| GPS fallback | `Location unavailable — continuing with Demo Journey.` | `Location unavailable — continuing with Judge Demo.` |

## Judge and privacy framing

- Judge Demo helper: `Judge Demo simulates the walk so you can complete a full mission without moving.`
- Real Walk privacy line: `Real Walk: your location stays on your device.`
- The privacy claim is explicitly limited to Real Walk.

## Functional boundary

The radio inputs retain `value="walk"` and `value="demo"`; their handlers
retain `setMovementMode('walk')` and `setMovementMode('demo')`. Journey
rendering and the existing state effects continue to branch on those unchanged
values. This is a label/copy-only reframe.

## Validation

`git diff --check` exited 0.

```text
$ npm run lint

> hiyaku-buildweek-mvp@0.0.0 lint
> eslint .

$ npm run typecheck

> hiyaku-buildweek-mvp@0.0.0 typecheck
> tsc -b --pretty false

$ npm run build

> hiyaku-buildweek-mvp@0.0.0 build
> tsc -b && vite build

vite v8.1.4 building client environment for production...
transforming...✓ 19 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.55 kB │ gzip:  0.34 kB
dist/assets/index-BhDOXcui.css   11.80 kB │ gzip:  3.42 kB
dist/assets/index-CCUuIHIN.js   206.10 kB │ gzip: 64.66 kB

✓ built in 81ms

$ npm run test

> hiyaku-buildweek-mvp@0.0.0 test
> vitest run

Test Files  1 passed (1)
Tests  10 passed (10)
Duration  169ms
```
