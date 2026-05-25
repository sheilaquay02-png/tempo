# Phase 71–90 Refactor Boundaries

This phase intentionally avoids a risky full rewrite of `components/TempoApp.jsx` because the app has active user-facing mechanics that should not be changed accidentally.

Instead, it adds safe module seams and tests around the logic most likely to regress:

- `lib/tempo/client/recurrence.js` for recurrence and task-period behavior.
- `lib/tempo/client/syncData.js` for sync/merge behavior.
- `lib/tempo/client/journalMemory.js` for memory encryption and journal storage behavior.
- `lib/tempo/habits.js` for target-count habit completion semantics.
- `lib/tempo/validation.js` for API request and persisted-data validation.
- `lib/tempo/migrations.js` for explicit migration/version handling.

Future component extraction should move UI sections one at a time, with tests passing between each move. Do not remove or simplify the local Tempo Assistant during refactors; it is a core local feature, not an OpenAI/API feature.
