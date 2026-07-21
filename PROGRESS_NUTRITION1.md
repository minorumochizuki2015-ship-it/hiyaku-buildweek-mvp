# NUTRITION — Lane 2

## Status: DONE

## Required reading and interpretation

Authority-source access note: the cited Claude Artifact shell was reachable, but its protected frame API returned Cloudflare 403 in this environment. This lane therefore implements the locked §03/§03b shape explicitly restated in the dispatch and does not infer wider requirements from the unavailable artifact.

### (a) Real-data-first pipeline

On an Open Food Facts hit, the Worker takes the first relevant returned product, reads each available per-100g nutrient, scales it by the user’s logged grams, and marks that nutrient `open-food-facts`. It never asks AI to replace those fields. A zero `page_count`, empty product list, absent nutrients, or an unrelated top-result name is a miss; the last check protects users from an OFF edge response that returns a global first product for an unmatched term. On a miss, all six fields are requested from GPT-5.6-sol using Structured Outputs. On a partial hit, only the absent individual fields go to GPT; this is the required hybrid path. Each external call has an 8s timeout and one retry. If GPT is unavailable, invalid, or quota-blocked, the remaining fields receive a deterministic balanced-meal estimate, so the UI never shows an unfilled nutrient.

### (b) Six reported nutrients and references

The app reports Energy / 力飯値 (`energy-kcal_100g`), Protein / 御力札 (`proteins_100g`), Fat / 油分札 (`fat_100g`), Carbs / 糖質札 (`carbohydrates_100g`), Fiber / 整え札 (`fiber_100g`), and Sodium / 微量札 (`sodium_100g`).

| Nutrient | App reference per meal | Japan framing (daily) | FDA Daily Value | EU reference framing |
| --- | ---: | --- | ---: | --- |
| Energy | 700 kcal | individual estimated energy requirement; 2,100 kcal MVP midpoint | 2,000 kcal label basis | 2,000 kcal RI |
| Protein | 20 g | 50 g women / 65 g men adult RDA | 50 g | 50 g RI |
| Fat | 18 g | 20–30% of energy; about 47–70 g at 2,100 kcal | 78 g | 70 g RI |
| Carbs | 70 g | 50–65% of energy; about 263–341 g at 2,100 kcal | 275 g | 260 g RI |
| Fiber | 7 g | 18–22 g or more for adults, age/sex dependent | 28 g | 25 g adequate intake |
| Sodium | 0.8 g | salt equivalent under 6.5 g women / 7.5 g men; about 0.8 g sodium per meal from a 6 g salt proxy | 2.3 g | 2.4 g sodium / 6 g salt RI |

The implementation uses the explicitly chosen three-meal baseline: 700 kcal, 20 g protein, 18 g fat, 70 g carbs, 7 g fiber, and 0.8 g sodium (roughly 2 g salt equivalent). Japan’s 2025 Dietary Reference Intakes are the baseline framing; FDA/EU figures are disclosed comparison label references, not user-specific prescriptions. Gap judgment is exact and deterministic: `estimated < 0.85 * reference` is `Low`; `estimated > 1.15 * reference` is `High`; otherwise `OK`. `foodScore = round(100 * OK_count / 6)`.

### (c) Deterministic / AI boundary

The app owns OFF fetching, amount scaling, preserving real fields, nutrient definitions and reference values, gap judgment, `foodScore`, all retry/timeout policy, and the hard deterministic fallback. GPT-5.6-sol owns only a numeric estimate for the explicitly missing nutrient keys at the stated meal and gram amount. It does not judge gaps, calculate score, overwrite OFF data, choose the screen state, or give medical advice.

## Manifest

- `shared/nutrition.ts`: typed request/report contracts and matching type guards.
- `worker/nutrition.ts`: OFF lookup, partial fallback, GPT Structured Outputs call, deterministic fallback, and pure scoring helpers.
- `worker/index.ts`: one additive `POST /api/nutrition` route only.
- `src/NutritionScreen.tsx`: fast two-field meal logging and an accessible six-row report.
- `src/App.tsx` / `src/styles.css`: additive Arrival link, route branch, and Nutrition-only styles.

## Design plan and self-critique

- Palette: `#0c1022` night-indigo base, `#171631` raised surface, `#f7f2e8` reading ink, `#f7d98a` Edo-gold labels, `#f4b942` only for the report action/score, and `#9c78ff` restrained supporting accent.
- Type: Georgia / Hiragino Mincho for the report title and Edo nutrient labels; Avenir Next / Hiragino Kaku Gothic / Meiryo for controls and values. This continues HIYAKU’s existing Japanese/English hierarchy rather than introducing a second visual language.
- Mobile-first layout: Arrival return, report promise, two quick inputs, one full-width action, then the score as the report’s focal block and six compact repeated nutrient rows. The primary action remains above the mobile fold.
- Signature: the score plaque pairs Edo terms with auditable per-nutrient provenance, so the game tone remains visible without concealing whether a value is real, AI-estimated, or local fallback.
- Motion: only the app’s existing short button transitions apply; `prefers-reduced-motion` already suppresses them.
- Self-critique: this avoids abstract gradient art, generic dashboard cards, extra fonts, and new imagery. The six nutrient rows are a genuine repeated data list, not decorative card nesting. A 25g numeric step initially contradicted the gram-entry promise and rejected 118g; visual exercise exposed it and the final UI uses 1g precision.

## Acceptance evidence

### Live Worker: Open Food Facts hit

Command:

```text
curl -sS -X POST http://127.0.0.1:8787/api/nutrition -H 'content-type: application/json' --data '{"description":"Fromage Blanc Nature","amountGrams":118}'
```

Raw response:

```json
{
  "description": "Fromage Blanc Nature",
  "amountGrams": 118,
  "productName": "Fromage Blanc Nature",
  "source": "open-food-facts",
  "nutrients": [
    { "key": "energy", "amount": 187.6, "source": "open-food-facts", "judgment": "Low" },
    { "key": "protein", "amount": 5.9, "source": "open-food-facts", "judgment": "Low" },
    { "key": "fat", "amount": 13, "source": "open-food-facts", "judgment": "Low" },
    { "key": "carbohydrates", "amount": 11.8, "source": "open-food-facts", "judgment": "Low" },
    { "key": "fiber", "amount": 0, "source": "open-food-facts", "judgment": "Low" },
    { "key": "sodium", "amount": 0.1, "source": "open-food-facts", "judgment": "Low" }
  ],
  "foodScore": 0
}
```

This exercised the Worker’s live OFF path: all displayed values are real OFF fields scaled from per-100g data, not GPT-shaped text.

### Live Worker: OFF miss and quota-safe deterministic fallback

Command:

```text
curl -sS -X POST http://127.0.0.1:8787/api/nutrition -H 'content-type: application/json' --data '{"description":"自家製の山椒香る豆腐と野菜の夕食 2026","amountGrams":320}'
```

Raw response:

```json
{
  "description": "自家製の山椒香る豆腐と野菜の夕食 2026",
  "amountGrams": 320,
  "productName": null,
  "source": "deterministic-fallback",
  "nutrients": [
    { "key": "energy", "amount": 480, "source": "deterministic-fallback", "judgment": "Low" },
    { "key": "protein", "amount": 19.2, "source": "deterministic-fallback", "judgment": "OK" },
    { "key": "fat", "amount": 16, "source": "deterministic-fallback", "judgment": "OK" },
    { "key": "carbohydrates", "amount": 64, "source": "deterministic-fallback", "judgment": "OK" },
    { "key": "fiber", "amount": 9.6, "source": "deterministic-fallback", "judgment": "High" },
    { "key": "sodium", "amount": 0.8, "source": "deterministic-fallback", "judgment": "OK" }
  ],
  "foodScore": 67
}
```

The Worker reached the fallback after the OFF miss and unavailable model completion; every field remained present. The known account quota state means this is a verified deterministic-fallback exercise, not a claimed live GPT-5.6-sol completion.

### Oracle checks

Temporary oracle validation imported the actual exported helpers. Expected values were derived independently from the dispatch: `50 < 0.85 × 100`, therefore `Low`; `round(100 × 4 / 6)`, therefore `67`.

```text
 RUN  v4.1.10 /Users/moc/ORCH-Next/projects/hiyaku-buildweek-mvp/.claude/worktrees/lane-NUTRITION2

 Test Files  1 passed (1)
      Tests  2 passed (2)
   Start at  11:34:02
   Duration  121ms (transform 17ms, setup 0ms, import 24ms, tests 2ms, environment 0ms)
```

The temporary test file was removed after execution to honor the lane’s closed file scope.

### Required suite: raw final output

```text
> hiyaku-buildweek-mvp@0.0.0 lint
> eslint .

> hiyaku-buildweek-mvp@0.0.0 typecheck
> tsc -b --pretty false

> hiyaku-buildweek-mvp@0.0.0 build
> tsc -b && vite build

vite v8.1.4 building client environment for production...
transforming...✓ 23 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.55 kB │ gzip:  0.34 kB
dist/assets/index-BtmZHx88.css   17.73 kB │ gzip:  4.65 kB
dist/assets/index-BzFfXffx.js   219.59 kB │ gzip: 69.42 kB

✓ built in 63ms

> hiyaku-buildweek-mvp@0.0.0 test
> vitest run

 RUN  v4.1.10 /Users/moc/ORCH-Next/projects/hiyaku-buildweek-mvp/.claude/worktrees/lane-NUTRITION2

 Test Files  2 passed (2)
      Tests  20 passed (20)
   Start at  11:34:27
   Duration  225ms (transform 74ms, setup 0ms, import 108ms, tests 41ms, environment 0ms)
```

`git diff --check` also exited 0 after the suite.

### Visual self-review

Production build captures were taken after the real Arrival → Nutrition route and report submission: `/tmp/nutrition-mobile-fold.png`, `/tmp/nutrition-mobile-full.png`, `/tmp/nutrition-desktop-fold.png`, and `/tmp/nutrition-desktop-full.png`. All four were visually inspected.

- Mobile metrics: 375px document/client/screen width; report width 335px. No horizontal overflow.
- Desktop metrics: 1440px document/client width; intentionally centered 540px screen and 500px report column.
- First impression: the report purpose and meal action are obvious; the Food Score is the intended first report focal point; the screen reads as professional and consistent with the existing Edo courier UI.
- Obvious-miss checklist: 20 PASS, 0 FAIL, 0 N/A. The form is styled, labels and Japanese Edo terms are intact, controls have usable touch sizes, and no overlap, clipping, broken asset, or accidental whitespace appeared.
- Craft rubric: layout/hierarchy 3 (score plaque leads the repeated rows); typography 3 (serif title versus legible utility text); color 3 (gold reserved for score/action); spacing/alignment 3 (8px-like row rhythm); imagery/assets 2 (intentionally no new image on a data-report screen); responsiveness 3 (mobile form/report sizing and desktop reading column); motion/micro-detail 3 (consistent controls and existing reduced-motion handling). Average 2.9; no axis is 1 or below.
- Highest-leverage improvement: future product work could persist the last logged meal so reopening the screen shows a saved report rather than a fresh form; persistence was not in this lane’s scope.

Verdict: `VISUAL_SELF_REVIEW_PASS`. Non-claim: `USER_VISUAL_REVIEW_REQUIRED`.

## Non-claims

- A real non-fallback GPT-5.6-sol response was not verified: the live miss exercised the deterministic fallback under the known quota/unavailability condition.
- OFF data is a selected matching product record, not a diagnosis, personalized diet plan, medical recommendation, or guarantee about a homemade meal.
- The report is in the branch-local production build and local Worker exercise only; it is not deployed, publicly released, or user-accepted.
- No git commit was created.

## Remediation round 1

Independent curl confirmation on 2026-07-21: the old `https://world.openfoodfacts.org/api/v2/search?search_terms=<q>&fields=product_name,nutriments&page_size=1` endpoint returned `count: 4631594`, `page_count: 1`, and first product `Fromage Blanc Nature` for both `banana` and `chocolate`, confirming that `search_terms` was not filtering it. The replacement `https://world.openfoodfacts.org/cgi/search.pl?search_terms=banana&search_simple=1&action=process&json=1&page_size=1&fields=product_name,nutriments` returned `count: "12276"`, `page_count: 1`, and `Yogurt Bnine BANANA`. A retried nonsense-query curl returned `count: 0`, `page_count: 0`, and `products: []` (the initial request received a transient HTTP 503).

I am changing only the OFF request base path to `/cgi/search.pl` and adding the static `search_simple=1`, `action=process`, and `json=1` parameters. The legacy endpoint preserves the `products` array and `page_count` zero-result signal, so the existing response parsing and miss detection remain applicable.

### Remediation acceptance

After the change, `wrangler dev --port 8790` served the normal local Worker route. The exact `banana` request and full response were:

```text
curl -sS --max-time 45 -X POST http://127.0.0.1:8790/api/nutrition -H 'content-type: application/json' --data '{"description":"banana","amountGrams":120}'
```

```json
{
  "description": "banana",
  "amountGrams": 120,
  "productName": "Yogurt Bnine BANANA",
  "source": "hybrid",
  "nutrients": [
    { "key": "energy", "amount": 105.7, "source": "open-food-facts", "judgment": "Low" },
    { "key": "protein", "amount": 4.7, "source": "open-food-facts", "judgment": "Low" },
    { "key": "fat", "amount": 2, "source": "open-food-facts", "judgment": "Low" },
    { "key": "carbohydrates", "amount": 17.2, "source": "open-food-facts", "judgment": "Low" },
    { "key": "fiber", "amount": 3.6, "source": "deterministic-fallback", "judgment": "Low" },
    { "key": "sodium", "amount": 0, "source": "open-food-facts", "judgment": "Low" }
  ],
  "foodScore": 0
}
```

This is a verified `hybrid` response: five nutrients are from Open Food Facts and missing fiber correctly uses deterministic fallback. It is not claimed to be a six-field OFF response or a general guarantee about OFF single-word search quality.

The clearly fictional home-cooked miss and full response were:

```text
curl -sS --max-time 45 -X POST http://127.0.0.1:8790/api/nutrition -H 'content-type: application/json' --data '{"description":"moonlit phoenix stew with stardust noodles from the imaginary village of Qelvoria","amountGrams":320}'
```

```json
{
  "description": "moonlit phoenix stew with stardust noodles from the imaginary village of Qelvoria",
  "amountGrams": 320,
  "productName": null,
  "source": "deterministic-fallback",
  "nutrients": [
    { "key": "energy", "amount": 480, "source": "deterministic-fallback", "judgment": "Low" },
    { "key": "protein", "amount": 19.2, "source": "deterministic-fallback", "judgment": "OK" },
    { "key": "fat", "amount": 16, "source": "deterministic-fallback", "judgment": "OK" },
    { "key": "carbohydrates", "amount": 64, "source": "deterministic-fallback", "judgment": "OK" },
    { "key": "fiber", "amount": 9.6, "source": "deterministic-fallback", "judgment": "High" },
    { "key": "sodium", "amount": 0.8, "source": "deterministic-fallback", "judgment": "OK" }
  ],
  "foodScore": 67
}
```

The miss remains safe: it has no product name and no unrelated OFF data. No retry, timeout, matching, value conversion, AI estimate, or fallback orchestration code was changed.

Required commands all exited 0:

```text
> hiyaku-buildweek-mvp@0.0.0 lint
> eslint .

> hiyaku-buildweek-mvp@0.0.0 typecheck
> tsc -b --pretty false

> hiyaku-buildweek-mvp@0.0.0 build
> tsc -b && vite build

vite v8.1.4 building client environment for production...
transforming...✓ 23 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.55 kB │ gzip:  0.34 kB
dist/assets/index-BtmZHx88.css   17.73 kB │ gzip:  4.65 kB
dist/assets/index-BzFfXffx.js   219.59 kB │ gzip: 69.42 kB

✓ built in 73ms

> hiyaku-buildweek-mvp@0.0.0 test
> vitest run

 RUN  v4.1.10 /Users/moc/ORCH-Next/projects/hiyaku-buildweek-mvp/.claude/worktrees/lane-NUTRITION2

 Test Files  2 passed (2)
      Tests  20 passed (20)
   Start at  11:47:48
   Duration  206ms (transform 70ms, setup 0ms, import 101ms, tests 32ms, environment 0ms)
```

### Remediation status: DONE

No git commit was created.
