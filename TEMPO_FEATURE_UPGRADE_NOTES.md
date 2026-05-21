# Tempo Current Changelog

This file reflects the current state of the Tempo build after the daily-rhythm rebrand Phase 2 update.

## Current foundation

- Supabase cloud persistence with localStorage fallback.
- Manual and external-cron-compatible push reminder flow.
- Custom event and task reminders with snooze/action support.
- Conflict-aware sync foundations including tombstones, last synced timestamp, pending local change status, and force sync.
- Calendar events, tasks, custom calendars, meal breaks, planning buffers, task scheduling, and Plan Today.
- Journal and Bloom Room remain available as current reflection/progress spaces.

## Phase 1 cleanup

- Removed the old timer-oriented productivity module from active app behavior.
- Removed old progress helper exports from `lib/tempo/core.js`.
- Fixed the Plan Today free-slot runtime bug by passing locked blocks correctly and guarding non-array slot inputs.

## Phase 2 navigation and terminology rebrand

- Repositioned visible navigation around Main, Planning and Personal sections.
- Added Main navigation entries for Today, Calendar, Tasks, Rituals, Habits and Journal.
- Added Planning navigation entries for Plan Today, Tomorrow Reset and Weekly Reset.
- Added Personal navigation entries for Bloom Room, Affirmations, Rhythm Stats and Settings.
- Added lightweight placeholder pages for Rituals, Habits, Weekly Reset and Affirmations so the new structure is ready before those features are built.
- Added a lightweight Today landing page that summarizes events, open tasks, free time, main things, Top 3 tasks and Journal check-in entry points.
- Renamed visible product language: Plan My Day → Plan Today, End of Day → Tomorrow Reset, Daily Stats → Rhythm Stats, Memory Book → Journal, Boss Battle → Main Thing, Deep Work → Important, Admin → Light Task, Health → Wellness.
- Kept existing category IDs intact for data compatibility; only labels/icons changed in this phase.

## Deployment

- Vercel install remains Node 24 compatible.
- Frequent reminders should use GitHub Actions or an external cron because Vercel Hobby cron cannot run every few minutes.
