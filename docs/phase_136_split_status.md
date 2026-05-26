# Phase 136 — Today dashboard split

## Completed

Extracted the Today dashboard UI out of `components/TempoApp.jsx` into:

- `components/today/TodayDashboard.jsx`

Moved:

- `TodayLitePage`
- Today hero actions
- Top 3 task card
- Daily affirmation/check-in card stack
- Rhythm strip
- Calendar preview card
- Today habits card
- Journal prompt card

## Intentionally unchanged

- Task state and mutation handlers
- Habit state and mutation handlers
- Daily check-in state
- Journal state
- Calendar/event state
- Plan Today logic
- Tomorrow Reset routing
- Persistence/cloud sync
- Reminder/notification logic
- Saved data shape

## Manual checks

Today page:

- Today dashboard loads after login/onboarding
- Plan Today button opens the daily planning modal
- Tomorrow Reset button opens the reset page
- Top 3 tasks render and sort as before
- Task checkbox marks task complete
- Task edit button opens the task editor
- Rhythm strip buttons navigate to Calendar, Tasks, and Habits
- Daily affirmation card renders
- Check-in card opens Daily Check-in
- Calendar preview shows today’s events
- Today’s Habits card toggles/increments habits
- Journal prompt opens Journal

Cross-page checks:

- Completing a habit in Today updates the Habits page
- Completing a task in Today updates the Tasks page
- Adding a check-in updates the Today card after closing the modal
- Refreshing the app preserves all saved data
