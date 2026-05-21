# Tempo Current Changelog

This file reflects the current state of the Tempo build after the Focus Mode removal and cleanup hotfix. Older implementation notes that referenced removed Focus Mode behavior have been consolidated here to avoid confusion.

## Current core features

- Calendar events with custom reminders.
- Tasks with custom reminders and task-to-calendar scheduling.
- Plan My Day with task ranking, free-slot detection, meal breaks, planning buffers, max planned task time, and lock/regenerate support.
- Task rollover and end-of-day planning.
- Daily startup summary.
- Calendar visibility controls, custom calendars, calendar rename/color/remove support, and calendar tombstones for sync safety.
- Cross-device Supabase sync with manual force sync, Realtime pull support, delete tombstones, field-level settings timestamps, pending local changes, and last synced status.
- Web push reminder route and reminder actions, including snooze, mark task done, and open task.
- PWA icons and manifest support.

## Focus Mode removal

Focus Mode has been removed from active app behavior. The build no longer includes a Focus Mode page, Focus Log UI, Pomodoro/focus session controls, task start-focus buttons, focus keyboard shortcut, Focus Mode progress bars, Focus Mode calendar block creation, or task auto-completion from focus sessions.

## Cleanup hotfix

- Fixed a `Plan My Day` runtime bug where `buildDailyPlan()` passed `false` into `freeSlotsForDate()`, causing the planner to spread a non-array value.
- Hardened `freeSlotsForDate()` so it only spreads array-based extra events.
- Removed dead Focus Mode helper exports from `lib/tempo/core.js`.
- Removed Focus Mode helper destructuring from split components.
- Updated README reminder-cron instructions for Vercel Hobby compatibility.
- Added the `npm run lint` script.

## Reminder cron deployment note

Vercel Hobby does not support frequent cron schedules. Keep `vercel.json` free of high-frequency cron rules and use GitHub Actions or an external cron provider to call `/api/push/reminders` with the configured `CRON_SECRET`.
