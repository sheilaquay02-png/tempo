# Phase 139 split status

Phase 139 moved the remaining low-risk helper logic out of `components/TempoApp.jsx` without changing persistence, reminder behavior, Google sync, task mutation logic, or journal data shape.

## Extracted files

- `utils/ritualUtils.js`
  - legacy ritual reminder normalization
  - legacy ritual normalization
  - legacy ritual completion normalization
  - legacy ritual run/progress helpers
- `utils/deletedRecordsUtils.js`
  - settings timestamp normalization
  - deleted-record tombstone normalization
  - deleted-record tombstone creation

## Why these helpers stayed available

Visible ritual UI has already been removed from the product surface, but the app still keeps legacy ritual normalizers for sync compatibility and older saved data. Phase 139 keeps that compatibility while reducing the main app file.

## Validation

Run after applying the zip:

```bash
npm install
node scripts/validate-release.mjs
npm test
npm run lint -- --quiet
npm run build
```

## Manual checks

- Sign in and confirm saved data loads.
- Delete/archive a task, calendar, habit, or affirmation and confirm it stays deleted after refresh.
- Sync across two tabs and confirm deleted records do not return.
- Confirm existing legacy data does not reset.
