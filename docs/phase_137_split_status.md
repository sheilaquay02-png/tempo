# Phase 137 Split Status — App Shell / Navigation

## Completed

Phase 137 extracted the app shell and navigation UI out of `components/TempoApp.jsx` into `components/layout/AppShell.jsx`.

Moved:

- `TempoLoadingScreen`
- `AppSidebar`
- `CalendarTopbar`
- `MobileBottomNav`

The extracted components are presentational. They receive state and callbacks from `TempoApp.jsx`; they do not own persistence, Google Calendar sync, reminders, task mutation, journal mutation, habit mutation, or cloud save logic.

## Files changed

- `components/TempoApp.jsx`
- `components/layout/AppShell.jsx`
- `tests/app-shell-split-regression.test.mjs`
- `docs/phase_137_split_status.md`

## Manual checks

After deploying, check:

1. Initial loading screen still appears during auth/session load.
2. Login screen still appears when signed out.
3. Desktop sidebar opens/closes.
4. Desktop sidebar navigation works for Today, Calendar, Tasks, Habits, Journal, Rhythm Stats, Tomorrow Reset, Weekly Reset, and Settings.
5. Mobile menu opens/closes and the scrim closes it.
6. Mobile bottom navigation works for Menu, Today, Calendar, Tasks, Journal, and Habits.
7. Calendar topbar previous/today/next buttons still move Day, Week, and Month correctly.
8. Calendar Day/Week/Month tabs still switch correctly.
9. Sidebar calendar source filters still hide/show Tempo, Google, and Habit sources.
10. Individual calendar visibility toggle, edit, add, and remove actions still work.
11. Sync status pill and Sync now buttons still appear and work in the sidebar, topbar, and mobile sync strip.

## Not changed

- Persistence hooks and cloud sync internals
- Google Calendar sync/import/disconnect logic
- Reminder notification logic
- Task/habit/journal/check-in mutation logic
- Saved data shape
