# ACTIVITY+SCORE — Lane 1

## Status: DONE

## Reading comprehension

Authority-source access note: the cited `claude.ai` artifact URL was rejected by this environment, so these answers apply the dispatch's explicit locked §02/§04 outcomes and CMD-resolved Q-table; no broader visual or town-state interpretation was inferred.

1. The three activities are meals, strength exercise, and running. Per §02's game-resource conversion, their current direct resource mappings are food → `foodHallEnergy`, strength → `dojoMight`, and running → `courierFlagPower`.
2. A narrator is automatically assigned from the dominant activity: the highest of the three sub-scores. Ties resolve run first, then strength, then food. The winning activity narrows the roster to its two compatible couriers, and an FNV-1a-style hash of the supplied day-summary seed chooses reproducibly between those two.
3. Total Score must be deterministic in the client because this MVP has no backend database or server-authoritative score path. Identical logged inputs must give the same visible score and narrator during the React session, without network availability or non-reproducible randomness.

## Implementation choice

The module is `shared/activity.ts`, rather than `src/activity.ts`, because later Worker and UI lanes can import the same pure, framework-free scoring contract without moving it.

## MANIFEST

Claim: Provides typed, deterministic pure functions for strength and run sub-scores, assembling all three sub-scores with a Lane 2-ready pre-computed food score, equal-weight Total Score, dominant-activity narrator assignment, and the initial one-to-one game-resource conversion.

Exported signatures:

```ts
strengthScore(activity: StrengthActivityInput | null | undefined): number
runScore(activity: RunActivityInput | null | undefined): number
calculateActivityScores(foodScore: number, strengthActivity: StrengthActivityInput | null | undefined, runActivity: RunActivityInput | null | undefined): ActivityScores
totalScore(foodScore: number, strength: number, run: number): number
dominantActivity(scores: ActivityScores): ActivityKind
assignNarrator(scores: ActivityScores, seed: string): CourierId
toGameResources(scores: ActivityScores): GameResources
```

## Acceptance commands and real output

### `npm run lint`

```text
> hiyaku-buildweek-mvp@0.0.0 lint
> eslint .
```

### `npm run typecheck`

```text
> hiyaku-buildweek-mvp@0.0.0 typecheck
> tsc -b --pretty false
```

### `npm run build`

```text
> hiyaku-buildweek-mvp@0.0.0 build
> tsc -b && vite build

vite v8.1.4 building client environment for production...
transforming...✓ 21 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.55 kB │ gzip:  0.34 kB
dist/assets/index-DG7z8aCn.css   14.88 kB │ gzip:  4.09 kB
dist/assets/index-DPj4sWmp.js   214.24 kB │ gzip: 67.84 kB

✓ built in 85ms
```

### `npm run test`

```text
> hiyaku-buildweek-mvp@0.0.0 test
> vitest run

RUN  v4.1.10 /Users/moc/ORCH-Next/projects/hiyaku-buildweek-mvp/.claude/worktrees/lane-ACTIVITY1-score-model

Test Files  2 passed (2)
     Tests  20 passed (20)
  Start at  11:20:26
  Duration  219ms (transform 67ms, setup 0ms, import 99ms, tests 35ms, environment 0ms)
```

## Non-claims

Does not implement nutrient scoring (Lane 2 responsibility), persistence beyond the current React session, a UI redesign or wiring, nutrition APIs, town-state visuals, or changes to the courier roster.
