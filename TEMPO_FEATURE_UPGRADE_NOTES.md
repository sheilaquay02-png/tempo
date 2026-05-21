# Tempo Feature Upgrade Notes

This build adds the requested next feature set on top of the existing Vercel + Supabase + GitHub architecture.

## Added

### 1. Custom reminders
- Calendar events now support: no reminder, at time of event, 5 minutes, 10 minutes, 30 minutes, 1 hour, 1 day, and custom minutes before.
- Tasks now support: no reminder, morning, afternoon, evening, and custom time.
- Reminder data is stored inside the existing event/task JSON, so no Supabase migration is required.
- `/api/push/reminders` now reads each event/task reminder setting when cron checks for due push notifications.

### 2. Smart daily planning
- Added a `Plan My Day` action in the sidebar and calendar top bar.
- The planner checks today’s open day tasks, available calendar slots, task duration, and priority.
- It suggests a timed plan and can apply the plan directly into the calendar.

### 3. Task-to-calendar auto scheduling
- Added a calendar/schedule button to each open task.
- Users can schedule a task for today, this week, or before deadline.
- Users can restrict scheduling to focus hours only.
- Scheduled tasks are linked back to the generated calendar event.

### 4. Better recurring rules
- Added stronger task recurrence presets: every weekday, Mon/Wed/Fri, every 2 weeks, monthly, and monthly on the 15th.
- Event recurrence now supports monthly day-of-month selection.
- Recurrence stepping now supports intervals and monthly day rules more consistently.

### 5. Focus mode upgrade
- Focus sessions now contribute to task progress.
- High-priority or long-duration tasks show a Boss Battle style progress/HP bar.
- Completed focus duration can auto-complete the linked task once the required task duration is reached.
- Completed Pomodoro work sessions create a linked focus block in the calendar.
- Manual stop allows session notes to be appended to the task.

## Deployment notes

- No new environment variables are required.
- No database migration is required.
- Keep the same cron endpoint: `/api/push/reminders`.
- Continue calling the cron route with your existing `CRON_SECRET` bearer token or `x-tempo-push-secret` header.

## Hotfix: planning and task scheduling slots

Patched after UI testing:

- Fixed `Plan My Day` showing `0 free hours` even when the day calendar had open space.
  - Root cause: `getFreeBlocks()` returns minute offsets, but the planner was treating them like `Date` objects.
  - Fix: converted free-block minute offsets into real `Date` objects before calculating remaining minutes.
- Fixed `Schedule this task` failing to find suitable slots for the same reason.
- Updated `Focus hours only` to follow Settings → Work Hours instead of being hard-coded to 9am–5pm.
- Updated the schedule-task modal helper text to show the actual work-hour window, e.g. `10am–6pm from your Work Hours setting`.
- All-day events are no longer treated as blocking the whole day for task scheduling/planning.

## Desktop task panel resize hotfix

- Added a desktop-only resize handle to the left edge of the task panel in calendar view.
- Users can press/hold the divider and drag left/right to resize the task panel.
- The task panel width is saved in `localStorage` under `tempo_task_panel_width`, so the chosen width persists on the same browser.
- Resize is disabled on mobile, standalone Tasks page, and when the task panel is collapsed.

## Sync + Meal Break Scheduling Hotfix

Added after cross-device/PWA feedback:

- Added a manual **↻ Sync** button in the calendar topbar.
- Added **Sync Now** in the sidebar.
- Added **Force sync now** inside Settings → Account.
- Force sync now waits for any queued save, pulls the latest Supabase cloud row, merges local + cloud events/tasks, reapplies the merged data locally, then pushes the merged snapshot back to Supabase.
- Added `updatedAt` stamping for newly added/edited/scheduled tasks and events so cross-device merge can choose the newer version more reliably.
- Added configurable meal breaks in Settings:
  - Breakfast
  - Lunch
  - Dinner
- Plan My Day and Schedule Task now treat enabled meal breaks as blocked time and will not schedule tasks during those windows.
- Meal break times are saved in local storage and Supabase settings under `mealBreaks`.
- Focus-hours scheduling still follows Settings → Work Hours, while meal breaks carve out protected time inside that work window.
- The sync status pill now retries using the full force-sync flow instead of only retrying a save.
- When cloud data is newer than this device, Force Sync treats Supabase as the source of truth to reduce stale desktop/PWA overwrites.

## Mobile menu sync button hotfix

- Added a mobile-only **↻ Sync now** button directly below the sync status text in the side menu.
- The existing sidebar nav sync item is hidden on mobile to avoid duplicate sync actions.
- Desktop layout remains unchanged.

## Next Update — Reliability, Sync, Planning and PWA Hardening

### Build / deployment hardening
- Added `vercel.json` cron configuration for `/api/push/reminders` every 5 minutes.
- Generated missing `public/icon-192.png` and `public/icon-512.png` from the existing app icon.
- Updated manifest files to reference the generated PWA icons.
- Updated the service worker notification icon fallback to use the app icon path.
- Moved `themeColor` out of `metadata` and into the Next.js `viewport` export to clear the metadata warning.
- Pinned core package versions instead of using `latest`.
- Added ESLint package dependencies to `package.json` and `package-lock.json`.

### Sync reliability upgrades
- Added delete tombstone tracking through `settings.deletedRecords` so deleted events/tasks are less likely to reappear after a cross-device merge.
- Added field-level settings timestamps through `settings.settingsUpdatedAt` so changes like work hours, focus hours, meal breaks, planning rules, theme, timezone and notification settings merge more safely.
- Updated the merge engine to respect tombstones when combining desktop/PWA/browser data.
- Added Supabase Realtime subscription for the signed-in user's `user_data` row.
- Added automatic sync pulls when the app regains focus, becomes visible again, or reconnects online.
- Force sync now always runs through the conflict-safe merge logic.
- When a linked calendar event is deleted, the linked task schedule fields are cleared.
- When a scheduled task is deleted, its linked task event is also removed and tombstoned.

### Planning upgrades
- Added separate Focus Hours in Settings.
- Focus-hours scheduling now uses the Focus Hours setting, while normal scheduling still uses Work Hours.
- Added a one-click “Match Work Hours” button for Focus Hours.
- Added Planning Rules in Settings:
  - buffer between planned blocks
  - after-meal buffer
  - maximum task-planning capacity per day
  - maximum deep-work blocks per day
- Plan My Day now considers more than day-scope tasks:
  - overdue tasks
  - due-today tasks
  - high-priority day tasks
  - high-priority/current-week tasks
  - due-soon tasks
  - selected month tasks when relevant
- Plan My Day now respects max daily planning capacity and max deep-work blocks.
- Plan My Day and Schedule Task now add buffers around existing calendar events and meal breaks.

### Recurrence fix
- Fixed weekly selected-day recurrence counting so “Mon/Wed/Fri + end after X times” counts emitted occurrences instead of scanned days.

### Validation
- `npm run build` passes on Next.js 16.2.6.
- ESLint dependencies were installed, but the current app still has pre-existing lint issues/warnings that should be handled in a future cleanup sprint.


## Hobby Cron Compatibility Update

- Removed the 5-minute Vercel Cron from `vercel.json` so Hobby deployments do not fail.
- Added `.github/workflows/tempo-reminders.yml` as an external 5-minute reminder trigger option.
- Added `docs/external_cron_setup.md` with setup instructions for GitHub Actions or another external cron service.
- Added notification action support for snooze and task completion via `/api/push/action`.
- Updated the PWA service worker to show reminder actions where supported.
- Changed the mobile viewport so users can zoom for accessibility.

## Product polish update — reminder actions, planner, rollover, focus log

Added in this build:

- Confirmed notification actions are wired through the service worker and `/api/push/action`:
  - Snooze 5 minutes
  - Snooze 10 minutes
  - Snooze 30 minutes
  - Mark task done
  - Open task
- Kept the Vercel Hobby-safe cron setup: `vercel.json` stays empty, and frequent reminder checks should run through GitHub Actions or another external scheduler.
- Confirmed recurrence selected-weekday count logic counts emitted occurrences, not scanned dates.
- Added stronger recurring task controls through the recurring task action prompt.
- Added a Daily Startup screen:
  - Today’s event count
  - Open task count
  - Free hours
  - Boss task count
  - First focus block
- Added Focus Log:
  - Today’s focus sessions
  - Weekly focus total
  - Session count
  - Weekly breakdown for deep work, admin, and meetings
- Upgraded Plan My Day:
  - Regenerate plan button
  - Lock task-in-slot before regenerating
  - Move remaining unscheduled tasks to tomorrow
- Upgraded task rollover:
  - Move selected tasks to today
  - Move selected tasks to tomorrow
  - Move selected tasks to this week
  - Drop selected tasks
- Added calendar duration resizing:
  - Drag the bottom edge of a timed event to extend/shrink its duration on desktop.
- Updated keyboard shortcuts:
  - C creates an event
  - T creates a task
  - A opens chat
- Added Focus Log to the sidebar and calendar topbar.

Not included yet:

- Google Calendar live OAuth sync is intentionally left as a separate integration sprint because it requires Google Cloud OAuth setup, redirect URI configuration, token storage/refresh handling, and a careful conflict model against existing Tempo events.

## Google Calendar OAuth readiness audit

Added preparation files for the Google Calendar live OAuth sprint:

- `.env.example`
- `supabase/user_data_setup.sql`
- `supabase/google_calendar_sync_setup.sql`
- `docs/google_calendar_setup_checklist.md`
- `docs/google_calendar_live_oauth_sync_plan.md`

Readiness decision:

- Build is passing.
- Existing Tempo sync has the necessary foundations: tombstones, field-level settings merge, Realtime pull, force sync, pending-change UI, and reminder/push infrastructure.
- Google OAuth tokens should not be stored in `user_data.settings`; use the new server-only `google_calendar_connections` table instead.


## Vercel npm install hotfix

Fixed deployment instability where Vercel failed during `npm install` with `Exit handler never called`.

Changes:
- Added `packageManager: npm@10.9.2` to pin npm.
- Added `engines` to use Node 20.x and npm 10.x on Vercel.
- Added `.npmrc` with stable npm install settings.
- Added `installCommand: npm ci --no-audit --no-fund` in `vercel.json` so Vercel uses the lockfile instead of a floating `npm install`.
- Kept Vercel Hobby cron-safe setup. No frequent cron is configured in `vercel.json`.

## Desktop/menu/task panel polish hotfix

- Removed the sidebar **Sync Now** menu item on desktop. The topbar Sync button and mobile menu sync button remain available.
- Fixed the task panel **✕** button so it collapses/closes the desktop calendar task panel instead of only closing the mobile sheet.
- Updated Today’s Plan boss task count to count only tasks in the **Boss Battle** category.
- Aligned Focus Mode boss HP/label behavior with the Boss Battle category.

