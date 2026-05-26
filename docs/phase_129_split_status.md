# Phase 129 — Habits split

## Completed in Phase 129

Extracted habit UI and habit-specific pure helpers out of `components/TempoApp.jsx`.

New files:

- `components/habits/Habits.jsx`
- `utils/habitUtils.js`

Moved habit UI:

- `HabitReminderEditor`
- `HabitModal`
- `HabitCard`
- `HabitWeeklyGrid`
- `HabitTemplateLibrary`
- `HabitsPage`

Moved shared habit helpers:

- `habitRepeatDaysFromFrequency`
- `normalizeHabitReminder`
- `habitReminderPresetId`
- `normalizeHabit`
- `normalizeHabits`
- `habitNameWithCopySuffix`
- `habitFromTemplate`
- `normalizeHabitCompletion`
- `normalizeHabitCompletions`
- `habitRunsOnDate`
- `habitCompletionFor`
- `habitProgress`
- `habitStreak`

`TempoApp.jsx` now imports the habit page/card and shared habit helpers instead of owning the full habit section inline.

## Behaviour notes

- Habit state, save/edit/delete/archive handlers, completion logic, reminder scheduling logic, storage, cloud sync, and Google Calendar logic remain in `TempoApp.jsx`.
- The habits split is intentionally UI/helper-only.
- The habit modal category field no longer references the calendar-only `isReferenceEvent` variable. That reference was unsafe in the original inline modal and could break the habit editor at runtime.

## Validation run

- `node scripts/validate-release.mjs` — passed
- `npm test` — passed, 37/37 tests
- `node --check utils/habitUtils.js` — passed
- Direct import smoke check for `utils/habitUtils.js` — passed

`npm run lint` and `npm run build` could not run in this sandbox because this packaged zip excludes `node_modules`, so `eslint` and `next` are not installed here. Run them locally or in CI after `npm install`/`npm ci`.

## Manual QA for Phase 129

Check the Habits tab:

- Create a new habit.
- Edit an existing habit.
- Archive and restore a habit.
- Delete a habit.
- Toggle a single-count habit.
- Increment and decrement a multi-count habit.
- Confirm the weekly grid updates after habit completion.
- Expand the template library.
- Filter templates by category.
- Use a template directly.
- Customize a template, then save it.
- Refresh the app and confirm habit data persists.

Also check Today:

- Today’s Habits still render.
- Habit completion from Today updates the Habits tab.
- Opening Habits from Today still navigates correctly.
