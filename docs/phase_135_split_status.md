# Phase 135 Split Status — Journal and Memory UI

## Scope

Phase 135 extracted the Journal and Memory UI from `components/TempoApp.jsx` into a dedicated journal component module.

## New files

- `components/journal/Journal.jsx`
- `docs/phase_135_split_status.md`

## Updated files

- `components/TempoApp.jsx`
- `scripts/validate-release.mjs`
- `tests/journal-decorator-regression.test.mjs`

## Moved from TempoApp.jsx

- `JournalDecorationCanvas`
- `JournalDecorationControls`
- `DayEntryModal`
- `JournalPage`

## Kept unchanged

- Journal data shape
- Journal encryption/storage helpers
- Photo upload and cleanup behavior
- Decoration model behavior
- Desktop-only decoration editing gate
- Mobile read-only decoration viewing
- Memory tag/activity mutation callbacks
- Check-in/reset/journal reflection integration
- Google Calendar sync
- Reminder/push logic

## Validation run

- `npm run validate:release`
- `npm test`
- `npm run lint -- --quiet`
- `npm run build`

## Manual checks recommended

1. Open Journal.
2. Create/edit today's memory entry.
3. Add/remove a photo and confirm cover selection works.
4. Add/edit memory tags and activities.
5. Save, refresh, and confirm the entry persists.
6. Open a saved entry in read mode.
7. On desktop, click Decorate and verify sticker/tape drag, resize, rotate, undo, redo, save, and cancel.
8. On mobile, confirm decorations display but editing controls are not exposed.
9. Confirm Tomorrow Reset and Weekly Reset reflection cards still appear in the Journal.
10. Confirm deleted/removed photo cleanup still queues failed cleanup safely.
