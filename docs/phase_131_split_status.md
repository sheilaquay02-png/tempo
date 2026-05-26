# Phase 131 Split Status — Check-ins and Resets

## Completed

Extracted check-in/reset UI from `components/TempoApp.jsx` into:

- `components/checkins/CheckInReset.jsx`

Moved components/helpers:

- `DailyCheckInModal`
- `TomorrowResetPage`
- `WeeklyResetPage`
- `CarryOverPrompt` legacy alias
- `taskFallsOnDateForReset`

Updated imports:

- `components/TempoApp.jsx` now imports check-in/reset display pieces from `components/checkins/CheckInReset.jsx`.

## Preserved

No changes were made to:

- daily check-in saved data shape
- tomorrow reset saved data shape
- weekly reset saved data shape
- local/cloud persistence flow
- reminder/notification logic
- Google Calendar sync
- habit mutation logic
- task mutation logic
- journal save/merge logic

## Validation run in this package

- `node scripts/validate-release.mjs` — passed
- `npm test` — passed, 37/37
- Babel parser syntax check for changed JSX files — passed

`npm run build` could not complete in this sandbox because Next attempted to download the Linux SWC native package and npm registry access is blocked here. Run the full local checks after installing dependencies:

```bash
npm install
npm run lint
npm run build
```

## Manual checks for Phase 131

Check Daily Check-in:

- Open daily check-in from Today.
- Select mood and energy.
- Save with and without a note.
- Reopen and confirm the saved mood/energy/note appears.
- Refresh and confirm the check-in persists.

Check Tomorrow Reset:

- Open Tomorrow Reset from Today.
- Confirm unfinished tasks appear.
- Use quick actions: all tomorrow, all this week, keep all.
- Change individual task actions.
- Fill reflection fields.
- Save reset and confirm related Journal reflection cards still show the reset data.
- Refresh and confirm the saved reset appears.

Check Weekly Reset:

- Open Weekly Reset.
- Confirm this week's task/event/check-in summary renders.
- Add up to 3 priorities.
- Choose unfinished task actions.
- Add key event notes.
- Select habit focus buttons.
- Fill reflection fields.
- Save and refresh.
- Confirm the saved weekly reset summary still appears.

Check unchanged areas:

- Today page still renders.
- Journal page still renders check-in/reset summaries.
- Habits page still works.
- Google Calendar sync controls still appear and behave as before.
- No assistant/OpenAI API route was recreated.

## Next recommended phase

Phase 132 — extract calendar/search modals.
