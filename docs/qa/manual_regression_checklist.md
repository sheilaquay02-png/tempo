# Tempo Manual Regression Checklist

Run this before merging to `main` (Vercel deploys from it).

## Core navigation
- Open Today, Calendar, Tasks and Settings in Schedule mode.
- Switch to Budget and Overall mode and back.
- Confirm mobile bottom navigation and desktop side menu still work.
- Confirm theme/dark mode/font settings persist after refresh.
- Open old links such as `/?page=journal` and `/?page=habits`: they must land on Today.

## Mini Tempo
- Open `/mini`. Weather, today's tasks, next event and affirmation show; each card collapses.
- Quick-add a task, complete it, undo. Confirm the change appears in full Tempo.

## Calendar
- Create a Tempo event, edit it, move it, and delete it.
- Create a recurring event and edit a single occurrence.
- Add, rename, recolor and remove a calendar (at least one must remain).
- On an account that previously imported Google events: none of them appear in Day/Week/Month, Today, search or Plan Today, and placing an event at the same time as one does not show a conflict warning.
- The event editor has no Reminder field.

## Tasks
- Add day, week, and month tasks.
- Complete and uncomplete a task.
- Move a task between periods.
- Confirm recurring tasks appear only in the correct target period.
- The task editors have no Reminder field.

## Plan Today
- Run Plan Today with open tasks and confirm suggestions avoid events and meal breaks.

## Budget
- Add a transaction from Home and from Transactions.
- Edit an account card (long press on mobile).
- Confirm the mobile footer does not cover popups.

## Settings
- Settings shows no Google Calendar, push notification, in-app notification or reminder sections.

## Old reminder cleanup
- On a browser that previously enabled closed-app push: load Tempo, then check DevTools → Application → Service Workers. `tempo-sw.js` should be gone after the first load.

## Sync/offline
- Log in, edit data, refresh, and confirm data remains.
- Edit on one device and confirm it appears on another.
- Simulate offline, edit local data, reconnect, and confirm no obvious data loss.

## Release hygiene
- Run `npm run check` (release validation, tests, lint).
- Run `npm run build` on Node 24 / npm 11.
- Confirm the GitHub Actions CI workflow passes.
