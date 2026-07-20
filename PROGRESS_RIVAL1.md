# RIVAL1 — Virtual Pacer

## Status

**DONE** — Yuzu is a deterministic, entirely client-side simulated AI pacer.
No multiplayer, network calls, mode-selection changes, or Dispatch/Arrival theme changes were introduced.

## Formula

`rivalPaceMultiplier(title) = 0.92 + (FNV-1a-32(title) / 0xffffffff) * 0.16`

The 32-bit FNV-1a implementation matches the small pure hash approach in
`shared/mockMission.ts`, but remains local to `src/movement.ts` so movement
logic does not take a dependency on mock mission selection.

`rivalDistance = min(targetDistanceMetres, (targetDistanceMetres / (availableMinutes * 60)) * multiplier * elapsedSeconds)`

Negative elapsed values are defensively clamped to zero. The `[0.92, 1.08]`
range keeps the fictional pacer close enough to feel like a comparable pace
while still making its position mission-specific and deterministic.

## UI behavior

Journey shows `AI PACER · SIMULATED` next to Yuzu and never presents Yuzu as a
real person. The comparison is derived from the existing `stats` state, so it
updates with Demo Journey's current interval and Walk Mode's existing elapsed
timer/GPS updates; no second timer exists. Arrival uses the exact same
calculation with the final elapsed time and player distance.

## Demo Journey state trace

Traced against the existing deterministic mock mission for
`{ availableMinutes: 10, energy: 'Steady', displayName: 'Ada' }`, which is
`The Tea House Reply` with an 800m target. Demo Journey advances 5% and 5
elapsed seconds per tick.

| Point | Player | Yuzu simulated distance | Rendered comparison |
| --- | ---: | ---: | --- |
| Start (0s) | 0m | 0.000m | `Yuzu: even with you` |
| 50% (50s) | 400m | 61.695m | `Yuzu: 338m behind` |
| Finish (100s) | 800m | 123.390m | `Yuzu: 677m behind` |

The fast Demo Journey intentionally remains a judge-facing simulation; Yuzu's
pace uses the mission's selected available minutes exactly as specified.

## Verification

All commands were run from
`/Users/moc/ORCH-Next/projects/hiyaku-buildweek-mvp/.claude/worktrees/lane-RIVAL1-virtual-pacer`:

```text
$ npm run lint
> eslint .

$ npm run typecheck
> tsc -b --pretty false

$ npm run build
> tsc -b && vite build
✓ built in 78ms

$ npm run test
> vitest run
Test Files  1 passed (1)
Tests  8 passed (8)
```

The unit suite includes an independently calculated FNV-1a oracle:
`Courier` hashes to `151230708`, yielding multiplier `0.925633782894731`;
with a 600m target, 10 minutes, and 300 seconds, the expected rival distance
is `277.6901348684193m`.
