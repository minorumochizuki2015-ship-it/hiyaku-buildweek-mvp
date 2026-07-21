# NUTRITION3 progress

## Before coding

- **Bars and radar:** Each of the six rows will have a semantic horizontal CSS meter. Its width is the meal amount/reference ratio, capped visually at 150%, with Low/OK/High colour. The adjacent radar will be a hand-written SVG: six radial axes and one six-point polygon whose radius uses the same capped ratio. No chart dependency will be added.
- **Reference-standard switch:** `shared/nutrition.ts` presently has one `referenceValue` per nutrient (the Japanese three-meal baseline used by the Worker), so it cannot represent the requested choices. I will add an additive `referenceValues` map for Japan/FDA/EU/international while preserving `referenceValue` for the read-only Worker. Japan retains the existing baseline. FDA and EU values are rough single-meal thirds of public adult label/reference daily values; EU salt is converted to sodium with its 2.5 salt-to-sodium definition, and its fibre value uses EFSA's 25g/day adult adequate intake. The `international` entry is an illustrative global crosswalk, not an official WHO/FAO unified standard. These figures are a comparison UI approximation, not individualized medical guidance or a complete food database. The client will recompute each displayed gap from the selected reference; the Worker remains on the existing Japan baseline.
- **Micros simplification:** the sixth underlying key remains `sodium`, because the Worker currently estimates only sodium. Its display label will become **Micros / 微量札**, explicitly described as a sodium-only proxy for the wider micronutrient category (Ca/Fe/K/VD/B/n-3 are not yet estimated). No Worker change is in scope.
- **Town contribution:** the report will surface: “This meal's score feeds your Food Hall energy.” This directly reflects `shared/activity.ts`'s existing `foodScore -> foodHallEnergy` mapping; it creates no new game resource or mechanic.
- **Advice:** the existing `gpt-5.6-sol` call is schema-constrained to nutrient amounts and explicitly prohibits commentary, so it supplies no reusable advice. I will provide a short static in-character courier line keyed to the current dominant displayed gap judgment.
- **Flow position:** after `Accept Dispatch` successfully generates a mission, App will enter a new pre-journey Nutrition state rather than jumping straight to `ready`. Nutrition will show a clear **Continue to Journey** action that moves to `ready`; its back action returns to Dispatch. The existing Arrival -> Nutrition action and return to Arrival remain intact. The App edit will be limited to these Nutrition state transitions/mount props so the parallel navigation-shell lane can retain its own work.

## Status

DONE — implementation and validation complete. No git commit was made.

## Delivered

- Added the six CSS-width nutrient bars, selected-standard gap labels, hand-written six-axis SVG radar, static in-character counsel, and Food Hall energy contribution copy.
- Added Japan/FDA/EU/international per-nutrient single-meal references in `shared/nutrition.ts` while keeping the Worker’s existing `referenceValue` untouched.
- Changed the sixth display category from Sodium to **Micros / 微量札** while keeping the underlying Worker key as `sodium`; the UI states that it is sodium-only.
- Moved the primary flow to Dispatch -> Nutrition -> Journey. The Arrival -> Nutrition path remains and returns to Arrival.
- Added rendering tests for 50% and capped-150% bar widths, Japan-to-FDA displayed Fat judgment change, and the Arrival nutrition route.

## Automated verification

All commands exited 0:

```text
$ npm run lint
> eslint .

$ npm run typecheck
> tsc -b --pretty false

$ npm run build
> tsc -b && vite build
vite v8.1.4 building client environment for production...
✓ 23 modules transformed.
dist/index.html                   0.55 kB │ gzip:  0.34 kB
dist/assets/index-C-vtv5sk.css   20.43 kB │ gzip:  5.16 kB
dist/assets/index-CobA9cyI.js   223.83 kB │ gzip: 70.67 kB
✓ built in 71ms

$ npm run test
Test Files  3 passed (3)
Tests  23 passed (23)
Duration  220ms
```

## Runtime and visual verification

- Copied the existing root `.env.local` into this worktree with mode `0600`, started `wrangler dev --ip 127.0.0.1 --port 8787`, and started Vite on `127.0.0.1:5173`.
- A live `POST /api/nutrition` for `salmon rice bowl`, `300g` returned a complete six-nutrient report. Its result source was `deterministic-fallback`, so this proves the real endpoint/data path but does **not** claim Open Food Facts or GPT enrichment succeeded in that run.
- In the actual 375px app, the live report rendered all six bars, Micros/sodium-only copy, the SVG radar, static courier counsel, Food Hall energy line, and Continue to Journey. Switching Japan -> FDA changed visible reference/bar values (Energy 64.3% of 700kcal -> 67.5% of 666.7kcal); a browser width check reported `horizontalOverflow: false`.
- Normal-user route replay passed: Accept Dispatch -> Nutrition -> Continue to Journey -> Journey -> End Mission -> Arrival -> 食の帳簿 -> Nutrition (with `← Arrival`).

### Visual self-review

- Viewed real normal-viewport captures at 375px (top, nutrient rows, radar/action) and 1440px (fold and lower report). The nutrition screen’s first impression is a clearly identified meal report with one obvious next action; it reads as a professional product-tool surface rather than a broken/unfinished page.
- Obvious-miss checklist: 1 text clipping PASS; 2 overlap PASS; 3 broken images N/A on the Nutrition report; 4 mobile horizontal scroll PASS; 5 375px collapse PASS; 6 raw/unstyled flash PASS; 7a/7b photo checks N/A; 7 contrast PASS; 8 placeholder content PASS; 9 product identity PASS; 10 alignment PASS; 11 sibling spacing PASS; 12 control consistency PASS; 13 tap targets PASS for form/select/primary actions; 14 font fallback PASS; 15 JP text setting PASS; 16 fixed interference N/A; 17 title/favicon N/A; 18 dead whitespace PASS; 19 scale PASS; 20 designed result state PASS.
- Craft rubric: layout 3 (score, selector, then bars establish a clear path); typography 3 (serif report title and compact data labels remain distinct); color 3 (gold actions and blue/green/orange judgment accents stay consistent); spacing 3 (rows and cards maintain a repeated rhythm); imagery/assets 2 (the chart is functional but intentionally minimal); responsiveness 3 (375px rows retain meter and value readability); motion/detail 2 (bounded meter transition and reduced-motion rule, otherwise intentionally restrained). Average: 2.7/4; no axis is <=1.
- The browser’s stitched full-page preview showed colour-fringe artifacts that were absent from the corresponding ordinary viewport screenshots. The normal viewport captures are the visual review evidence; no claim is made that the stitched preview is a product rendering.
- Verdict: `VISUAL_SELF_REVIEW_PASS`.

## Non-claims

- FDA/EU/international figures are a simplified comparison crosswalk, not personalized medical advice or a complete official nutrition database. Japan preserves the app’s existing baseline; international is illustrative rather than a single official WHO/FAO standard.
- Micros is a sodium-only proxy, not a broad calculation of calcium, iron, potassium, vitamin D/B, omega-3, or other micronutrients.
- The static courier advice is a fallback, not model-generated advice; the current AI schema deliberately returns nutrient amounts only.
- `VISUAL_SELF_REVIEW_PASS` is not user visual acceptance.
- The Vite server was stopped with Ctrl-C after review. The browser-control extension emitted one injected `Communication` blob error in the dev-server log; it is not attributed to app source here, and no clean-console claim is made.
