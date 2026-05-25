# Phase 71–90 Fixes

Scope: maintainability, validation, tests, and release safety. This phase deliberately preserved existing app mechanics and the restored local Tempo Assistant.

## Completed

- Added safe module seams for future splitting:
  - `lib/tempo/client/recurrence.js`
  - `lib/tempo/client/syncData.js`
  - `lib/tempo/client/journalMemory.js`
- Added habit helper module for tested target-count completion behavior:
  - `lib/tempo/habits.js`
- Added explicit migration boundary:
  - `lib/tempo/migrations.js`
- Added TypeScript declaration reference:
  - `types/tempo.d.ts`
- Added API and persistence validation helpers:
  - `lib/tempo/validation.js`
- Wired validation into Google calendar preference/sync routes and push send/subscribe/action routes.
- Sanitized server-side `saveUserData()` before persisting Google-route updates.
- Added built-in Node test suite:
  - recurrence behavior
  - Google event mapping/import behavior
  - task-period behavior
  - habit target-count behavior
  - journal encryption round-trip
  - API auth/sanitizer behavior
- Added package scripts:
  - `npm test`
  - `npm run check`
- Removed unused default Next/Vercel SVG assets from `public/`.
- Added manual regression checklist:
  - `docs/qa/manual_regression_checklist.md`
- Added a refactor boundary note to avoid accidental feature removal.

## Intentionally not done in one step

A full physical split of `components/TempoApp.jsx` was not done in this phase because that would be high-risk and could silently alter core app behavior. This phase adds seams/tests first so future splits can happen safely.
