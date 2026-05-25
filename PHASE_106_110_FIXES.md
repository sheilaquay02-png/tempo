# Phase 106–110 Fixes — Timezone and Date Audit

Scope: date/time correctness only. This phase avoided redesigns and preserved the local Tempo Assistant/chatbot.

## What changed

- Added shared `lib/tempo/dateTime.js` helpers for:
  - timezone normalization with `Asia/Singapore` fallback
  - stable `YYYY-MM-DD` date keys
  - month keys
  - Monday week-start keys
  - local clock due-window checks
  - Google all-day date-only conversion using the selected timezone
- Google all-day event mapping now uses the shared all-day range helper and stores:
  - `googleAllDayStartKey`
  - `googleAllDayEndExclusive`
  - `googleTimeZone`
- Google default sync windows now start from the Tempo local-day boundary instead of raw UTC midnight.
- Push reminder date/time helpers now use shared timezone utilities instead of duplicated route-local versions.
- Push actions now normalize reminder dates before stamping completed tasks/habits.
- Task API sanitization now normalizes task date fields such as `taskDate`, `dayKey`, `weekKey`, `monthKey`, `deadline`, and `completedDate` when possible.
- Settings API sanitization now normalizes invalid timezone values back to `Asia/Singapore`.
- Task completion target keys now follow the task period:
  - day tasks use day key
  - week tasks use week key
  - month tasks use month key
- Added tests for timezone boundary behavior, Google all-day conversion, local clock checks, task date-key normalization, and period completion keys.

## Preserved

- Local Tempo Assistant/chatbot
- No `/api/assistant`
- No OpenAI/API route
- Journal, tasks, habits, calendar, reminders, sync, and decoration mechanics

## Validation

- `npm test` passed: 23/23 tests
- `node --check` passed for all API routes and touched modules
- No new Supabase SQL required
