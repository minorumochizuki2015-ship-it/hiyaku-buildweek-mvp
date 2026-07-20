# HIYAKU — OpenAI Build Week submission

## One-liner
HIYAKU turns a short everyday walk into a personalized Edo courier mission powered by GPT-5.6.

## Track
Apps for Your Life.

## Deadlines (JST)
| Boundary | Time |
|---|---|
| Feature freeze | 2026-07-21 20:00 |
| Video recording start | 2026-07-21 21:30 |
| Devpost entry start | 2026-07-21 23:30 |
| Internal submission deadline | **2026-07-22 02:00** |
| Official deadline | 2026-07-22 09:00 (17:00 PDT 07-21) |

After 02:00, only upload/deploy/Devpost-form fixes — no new features.

## Grand goal
A judge opens the URL on a phone, and within 90 seconds receives a personalized
courier mission, experiences the journey, and completes an arrival story.

## Three screens
1. **Dispatch** — pick available minutes (5/10/15), energy (Low/Steady/Ready),
   optional display name → `Generate My Mission` calls `/api/mission`.
2. **Journey** — one courier character, elapsed time, distance, progress %,
   a single route ribbon, GPT-generated milestone messages at 25/50/75%.
   Two movement modes: **Walk Mode** (`navigator.geolocation.watchPosition`,
   foreground-only, coordinates never leave the device) and **Demo Journey**
   (time-based simulated progress, clearly labeled, for judges who can't walk).
3. **Arrival** — distance, duration, completion %, courier rank, GPT-generated
   epilogue, curated historical note, Share Result, Start Another Mission.

## Explicit non-goals
No sandbox/town-building, no map SDK, no HealthKit/Google Fit, no background
tracking, no auth, no ranking/friends, no payments, no multiple routes, no
character customization, no remote-ops integration.

## Architecture
```
Mobile Web / PWA (React + TypeScript + Vite)
  -> Cloudflare Worker: POST /api/mission, POST /api/complete
       -> OpenAI GPT-5.6 (server-side key only, never exposed to client)
```
No auth, no DB, no billing, no push notifications. State machine:
`idle -> generating -> ready -> active -> paused -> completing -> completed -> idle`.

## Control boundary (AI vs app)
- App decides: distance targets, completion checks, safety conditions.
- GPT-5.6 decides: narrative, tone, encouragement, arrival evaluation text.
- Historical facts come from a fixed curated JSON, never model-invented.
- Location is converted to distance on-device; raw coordinates are never sent
  to the server.
- API failure → fixed fallback mission/epilogue, UI never stalls.

## Stop conditions
- GPS unstable by 14:00 → drop background support, ship foreground + Demo
  Journey only.
- GPT output not stable within 90 min of starting integration → schema
  validation + one retry + fixed fallback, move on.
- Not deployed by 17:30 → strip locale switching, audio, sharing extras.
- After 20:00 → no code changes except P0 bugs.
- Video not done by 23:30 → record current state as-is, stop polishing.
- At 02:00 → submit regardless of polish; only fix submission-blocking issues after.

## Required in submission
Devpost: project name `HIYAKU`, subtitle "An AI Edo Courier Companion for
Everyday Walking", track Apps for Your Life, English description, public
YouTube demo video (<=3 min), working URL, this repo, test instructions,
Codex `/feedback` session ID, 3 screenshots, explicit description of how
Codex and GPT-5.6 were used.
