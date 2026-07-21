# HIKYAKU 飛脚

A short walk becomes a courier run in Edo.

You tell HIKYAKU how many minutes you have. It issues you a dispatch, you walk it, and the town on the
other side of the screen reacts to what you did — including what you ate. The guide is Shinonome Mikoto,
an official courier of the Nihonbashi headquarters.

Mobile-first web app. React 19 + TypeScript + Vite on the front, a Cloudflare Worker on the back.
No database, no accounts, no build step beyond `npm`.

---

## Quick start

Requires Node.js 20.19+ (22 recommended).

```bash
npm install
npm run dev          # front end on http://localhost:5173
```

That is enough to walk the whole demo. Open it at a phone width (375px) — the layout is built for that.

To exercise the backend as well, run the Worker in a second terminal:

```bash
npm run worker:dev   # Cloudflare Worker on http://127.0.0.1:8787
```

Vite proxies `/api` to it (see `vite.config.ts`). An `OPENAI_API_KEY` is optional — see
[Running without an API key](#running-without-an-api-key).

### Try it in about a minute

1. On **Goyo**, leave *Judge Demo* selected and press **Accept Dispatch**. Judge Demo simulates the walk
   so you can finish a run without leaving your desk. *Real Walk* uses the browser Geolocation API and
   your position never leaves the device.
2. Let the journey run, or press **End** to arrive immediately.
3. On the arrival screen press **食の帳簿 / View nutrition report**.
4. Type a food and submit. Try `onigiri`, `tofu`, `Kit Kat` — these hit real products in Open Food Facts.
   Try `miso soup` to see what happens when nothing matches.
5. Step through the four report screens with **Next**.

No fixture files or seed data are needed. Every number on those screens comes from the response to that
one request.

### Gates

```bash
npm run typecheck && npm run lint && npm run test && npm run build
```

86 tests across 14 files at the time of writing.

---

## How GPT-5.6 was used

Three call sites, two model variants, all going through the Chat Completions API with **Structured Outputs**
(`response_format: { type: 'json_schema', strict: true }`) so the Worker never has to parse loose prose.

| Where | Model | What it does |
|---|---|---|
| `worker/index.ts` — `missionRequest` | `gpt-5.6-terra` | Writes the dispatch: title, briefing, and encouragement at 25/50/75% progress, in Mikoto's voice |
| `worker/index.ts` — `completionRequest` | `gpt-5.6-terra` | Writes the arrival epilogue and the next-run teaser, weaving in the distance actually walked |
| `worker/nutrition.ts` — `estimateMissingWithAi` | `gpt-5.6-sol` | Fills in only the nutrients Open Food Facts did not carry |

The third one is the interesting one, and it is the reason this app has the shape it does.

Open Food Facts is real crowd-sourced data, which means it is patchy: a product will have energy and
protein but no fibre, or nothing at all. Most nutrition apps paper over that gap and present one confident
number. We ask `gpt-5.6-sol` for **only the missing keys**, and then show the user, per nutrient, where each
figure came from:

- **Food database** — measured, straight from the matched Open Food Facts product
- **AI estimate** — supplied by GPT-5.6 because the product record had a hole in it
- **Category estimate** — neither was available, so a deterministic fallback by food category

That provenance column is on screen 2 of the report. Nothing is hidden behind an average. If GPT-5.6 was
unavailable the screen says so in plain words rather than quietly degrading: `aiAttempt` in the response
distinguishes *not needed*, *succeeded*, *no key configured*, and *failed, with the reason*, and the UI
renders it.

Two deliberate constraints on the model, both enforced in the system prompts:

- It may not invent history. Mikoto's world is fictional; the app owns every factual claim.
- On nutrition it may not give medical advice, commentary or substitutions — only the numbers it was asked for.

### Running without an API key

The app stays usable when the model is not reachable, because a judge should be able to clone it and see it
work. With no `OPENAI_API_KEY`:

- Missions fall back to a curated narrative assembled from Mikoto's canonical quote bank
- Nutrition falls back to Open Food Facts alone, then to category estimates
- The report screen says **"GPT-5.6 unavailable — showing category estimates"**, so you are never misled
  about which path produced the numbers

To enable the model, put `OPENAI_API_KEY=sk-...` in `.env.local`. Wrangler picks it up automatically; it is
never committed and never reaches the browser.

---

## How Codex was used

Codex Sol carried this project end to end — not just the code:

| Area | What Codex Sol did |
|---|---|
| Product code | Every source file in `src/`, `shared/` and `worker/` |
| Asset images | The character art, the town backgrounds, the food icons and the emblems were generated with Codex Sol |
| UI generation | Screen layouts and component structure were produced from the canonical reference boards |
| Video scripting | The scripts behind the in-app scene videos |
| Review | Independent audit passes over the branch — spec-completeness, dead code, attribution hygiene |

The code work was split into isolated lanes, each in its own git worktree on its own branch, each given a
written brief containing: the exact files it was allowed to touch, the files it was forbidden to touch, the
reference material it had to read first, the acceptance gates it had to pass, and an obligation to report
honestly what it could *not* verify.

That last part mattered more than expected. Two examples:

- The lane wiring the nutrition flow was asked to display step count and calories burned. It refused,
  because neither value exists anywhere in this app, and passed zeroes rather than deriving fake numbers
  from distance. We replaced those fields with distance and duration, which are genuinely measured.
- Every UI lane ended its report with a line to the effect of *"no screenshot was possible in this sandbox,
  so no visual claim is made."* Visual acceptance was done separately, by rendering the real app in a
  browser and looking at it — which is how a language toggle that was silently covering the Next button got
  caught, after the code review had passed it.

Lanes ran in parallel where their file sets were disjoint: the four nutrition report screens were built
simultaneously as four independent components, then merged. Where a fix spanned shared files it ran alone.

One thing a code review could not catch: a language toggle was silently covering the report's Next button,
so the screen could not be advanced by touch at all. Every automated gate passed. It was only found by
rendering the real app at 375px and trying to press the button. Visual acceptance stayed a separate,
human step for exactly that reason.

The commit history is the record.

---

## What is in here

```
src/App.tsx              screens, journey state machine, bottom navigation
src/nutrition/           the four-screen nutrition report and its flow container
src/movement.ts          Geolocation walk tracking with a permission fallback
src/i18n.ts              JA/EN copy
shared/nutrition.ts      nutrient definitions, per-standard reference values, report types
shared/activity.ts       the score model
worker/index.ts          /api/mission and /api/complete
worker/nutrition.ts      /api/nutrition — Open Food Facts lookup, GPT-5.6 gap fill, scoring
```

### Nutrition reference standards

Reference values are carried for four standards — Japan, FDA, EU and International — and the comparison
column switches between them live (`shared/nutrition.ts`). The guide shown is a per-meal portion, not a whole
day's target, because you are logging one meal; the column is labelled accordingly.

### Privacy

Real Walk uses `navigator.geolocation` and keeps coordinates on the device. Nothing is stored server-side;
there is no database and no account. Food descriptions are sent to Open Food Facts and, when a nutrient is
missing and a key is configured, to OpenAI.

---

## Known limits

- HealthKit step and calorie data is not reachable from a browser, so the app measures distance and duration
  by GPS instead. Step counts would need a native wrapper.
- Weekly and monthly reports are not built; the daily loop is.
