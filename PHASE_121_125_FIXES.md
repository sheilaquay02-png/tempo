# Phase 121–125 Fixes — Test and CI Hardening

Applied conservatively from Phase 111–120. No core Tempo mechanics were intentionally changed.

## Included

- Added `scripts/validate-release.mjs`.
- Added `npm run validate:release`.
- Added `npm run test:ci`.
- Updated `npm run check` to run release validation before tests/lint.
- Added GitHub Actions CI workflow at `.github/workflows/tempo-ci.yml`.
- Added local Tempo Assistant regression tests.
- Added journal decorator regression tests.
- Added API route safety regression tests.
- Expanded the manual regression checklist with CI/release validation steps.
- Added documentation at `docs/phase_121_125_test_ci_hardening.md`.

## Protected mechanics

- Local Tempo Assistant/chatbot remains restored and local-only.
- No `/api/assistant` route was added.
- No OpenAI/API assistant integration was added.
- Journal decoration editing remains desktop-only; decorations still display on mobile.
- Existing calendar, tasks, habits, reminders, sync, journal, and settings mechanics were not intentionally changed.

## Validation performed

- `npm run validate:release` passed.
- `npm test` passed with 37/37 tests.
- JS syntax checks passed for app routes, lib files, client helpers, scripts, tests, and styles.
