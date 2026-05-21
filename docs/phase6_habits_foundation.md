# Phase 6 — Habits Foundation

This build adds the first complete Habits system to Tempo.

## Added

- Full Habits page.
- Starter habits:
  - Journal
  - Plan tomorrow
  - Tidy space
- Create habit flow.
- Edit habit flow.
- Archive / restore habit flow.
- Delete habit flow with sync tombstones.
- Daily habit check-off.
- Multi-count habit targets, such as 3 glasses or 2 check-ins.
- Weekly habit grid.
- Gentle streak count.
- Habit repeat days.
- Habit reminder presets:
  - No reminder
  - Morning
  - Afternoon
  - Evening
  - Custom time
- Today dashboard habit card.
- Push reminder route support for habit reminders.

## Data storage

Habits are stored inside Supabase `user_data.settings` for now:

```txt
settings.habits
settings.habitCompletions
settings.deletedRecords.habits
```

This keeps Phase 6 aligned with the existing Tempo sync model. A future sync-hardening phase can move rituals/habits into dedicated tables if needed.

## Sync behavior

- Habits use stable IDs and `updatedAt` timestamps.
- Deleted habits use tombstones in `settings.deletedRecords.habits`.
- Habit completions are merged by stable completion ID.
- Desktop and mobile should converge after realtime sync, app focus sync, or Force Sync.

## Reminder behavior

The reminder cron endpoint now checks habits in addition to events, tasks, rituals, and snoozed reminders.

Habit reminder notifications open the Habits page.
