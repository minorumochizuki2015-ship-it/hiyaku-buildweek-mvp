# PLAN — execution schedule

See [HACKATHON.md](HACKATHON.md) for product scope, non-goals, and deadlines.
CMD orchestrates via git worktrees + Codex lanes (same discipline as the main
hikyaku-app project): CMD plans/dispatches/verifies/merges/records, never
writes application code directly.

## Schedule (JST, 2026-07-21/22)

- [ ] 06:20-07:00 Preflight: repo live, deploy target confirmed, GPT-5.6 test
      call succeeds, one primary Codex thread established, baseline commit recorded.
- [ ] 07:00-09:30 Static happy path: 3 screens, static data, mobile-first,
      English default, full idle->completed transitions via buttons only.
- [ ] 09:30-12:00 GPT-5.6 integration: `/api/mission`, schema validation,
      timeout, one retry, fixed fallback, model name documented in README.
- [ ] 12:00-14:00 Movement tracking: foreground GPS, distance calc, outlier
      rejection, Demo Journey, 25/50/75% events, localStorage session recovery.
- [ ] 14:00-15:30 Arrival: `/api/complete`, epilogue, rank, result screen,
      restart, Web Share API (or plain share text fallback).
- [ ] 15:30-17:30 Polish: 1 character, readable Edo-styled background, loading
      states, API-failure UI, GPS-denied path, English copy pass, contrast/tap targets.
- [ ] 17:30-20:00 Deploy + accept: lint/typecheck/test/build green; manual
      pass on iPhone Safari + desktop Chrome, GPS allow/deny, API up/down,
      reload recovery, Demo Journey, re-run after completion. **20:00 feature freeze.**
- [ ] 20:00-21:30 README + evidence (see required sections below); Codex
      `/feedback` run on the primary thread, session ID saved.
- [ ] 21:30-23:30 Demo video, target 2:40, script in HACKATHON.md-adjacent notes.
- [ ] 23:30-02:00 Devpost submission. **02:00 internal deadline — submit
      regardless of polish; only fix submission-blockers after this point.**

## Definition of done (MVP)
- Opens without login at the deployed URL.
- GPT-5.6 responses vary with input (time/energy) — not static text.
- GPS or Demo Journey reaches 100%.
- Milestone messages render at 25/50/75%.
- Arrival epilogue + rank render.
- API failure never stalls the UI (fallback kicks in).
- No API key present in any client-shipped bundle.
- No raw GPS coordinates sent to the server.
- 3 consecutive full runs complete on iPhone Safari and Chrome.
- README, video, Codex session ID, and Devpost fields are all filled in.

## README required sections (write at 20:00-21:30)
1. What HIYAKU solves
2. Working demo URL
3. How to run locally
4. How to test without walking
5. How GPT-5.6 is integrated
6. How Codex accelerated the build
7. Key product and engineering decisions
8. Privacy and location-data handling
9. Build Week implementation timeline
10. Known limitations

## Baseline
Initial commit: `b7644ff` (empty repo, .gitignore only).
Repo: https://github.com/minorumochizuki2015-ship-it/hiyaku-buildweek-mvp
