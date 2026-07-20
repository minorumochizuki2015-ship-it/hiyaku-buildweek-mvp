# GPT-5.6 Worker integration — 2026-07-21

## Status: BLOCKED (OpenAI account quota and required key rotation)

The Worker and frontend integration is implemented and all repository checks
pass. The remaining acceptance item — proving GPT-generated variation from two
successful live model calls — is blocked by the supplied account returning
`insufficient_quota` from OpenAI. The Worker retries once and serves the
existing deterministic curated fallback, so the user-facing route remains
functional rather than hanging or showing an error screen.

## What changed

- `worker/index.ts` now calls `https://api.openai.com/v1/chat/completions` with
  `model: "gpt-5.6-terra"`, Structured Outputs JSON schemas, an eight-second
  abort timeout, one retry, defensive JSON validation, and the existing mock
  response as fallback after both attempts fail.
- `OPENAI_API_KEY` is read only from the Worker `env` binding. `wrangler.toml`
  documents `wrangler secret put OPENAI_API_KEY`; no secret value is committed.
- Mission narrative (`title`, `briefing`, milestones, `completionStyle`) is
  model-generated when available. `historicalNote` is always taken from the
  existing fixed curated data in `shared/mockMission.ts`.
- Completion rank remains app-determined by the existing mock’s deterministic
  rule. The model receives that fixed rank only as narrative context and writes
  `epilogue` plus `nextMissionTeaser`.
- `src/App.tsx` now uses POST requests to `/api/mission` and `/api/complete`;
  its generating/completing states wait on real network requests rather than
  fixed mock delays. If the Worker itself is unreachable, the client returns to
  an operable state rather than remaining indefinitely in a loading state.

## Live API result

Before Worker testing, a minimal direct Chat Completions structured-output
probe to `gpt-5.6-terra` returned this exact response (the API key was not
logged or recorded):

```json
{
  "error": {
    "message": "You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.",
    "type": "insufficient_quota",
    "param": null,
    "code": "insufficient_quota"
  }
}
```

HTTP status: `429`.

## Local Worker endpoint evidence

Ran Wrangler `4.112.0` locally at `http://127.0.0.1:8787` after loading the
gitignored `.env.local`. Wrangler reported the binding as hidden. Each request
entered the real Worker endpoint, attempted the real OpenAI call twice, then
returned the fixed fallback because of the quota error above.

### POST `/api/mission`

Input:

```json
{"availableMinutes":5,"energy":"Low","displayName":"Aya"}
```

Response:

```json
{"title":"Rain at Tokaido Gate","briefing":"A message must reach the gate before the rain turns the road to silver.","milestones":{"25":"A cool drop lands on your sleeve. The road is yours.","50":"The gate flag is visible beyond the rooftops.","75":"Your message is nearly safe from the weather."},"historicalNote":"The Tokaido connected Edo and Kyoto and was the most traveled of the five routes.","completionStyle":"Calm under pressure"}
```

Input:

```json
{"availableMinutes":15,"energy":"Ready","displayName":"Ren"}
```

Response:

```json
{"title":"The Tea House Reply","briefing":"Deliver a gracious reply before the tea house closes its sliding doors.","milestones":{"25":"The scent of roasted tea points you onward.","50":"Your destination is now part of the evening bustle.","75":"The tea house bell is within reach."},"historicalNote":"Edo tea houses were lively social stops for travelers, messengers, and merchants.","completionStyle":"Warm and swift"}
```

The two endpoint responses visibly differ, but this is fallback selection —
not proof of live model variation — due to the documented 429.

### POST `/api/complete`

Input:

```json
{"distanceMeters":480,"durationSeconds":615,"completionPercent":100,"missionTitle":"The Dawn Ledger"}
```

Response:

```json
{"rank":"Edo Roadrunner","epilogue":"The Dawn Ledger is complete. Your 480 metre journey reached its destination as an Edo Roadrunner.","nextMissionTeaser":"Next time, a dawn message waits at the river crossing."}
```

This is also the fixed fallback, not a successful model epilogue. It does
correctly includes the supplied mission title and distance.

## Validation

All passed:

```text
npm run lint
npm run typecheck
npm run build
npm run test

Test Files  1 passed (1)
Tests  3 passed (3)
```

`git diff --check` passed. `.env.local` remains ignored and unstaged. A
secret-shaped-string scan of the diff found no API-key value.

## Next action

Provide an OpenAI API key with usable API quota/billing, then rerun the two
mission requests and one completion request above. No source changes should be
needed; a successful response will replace the fallback automatically after
schema validation.

## Security incident and containment

During local-test cleanup, the secret was inadvertently exposed through a
running process command line. The value is not reproduced here and was never
written to a committed file, diff, fixture, or report. The local Worker was
stopped immediately. Rotate the affected OpenAI key before any further use,
then continue only with the replacement key kept in `.env.local` / the
Cloudflare secret binding.
