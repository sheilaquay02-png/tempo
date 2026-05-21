# Phase 4 — Rituals Foundation

This phase adds Rituals as the soft routine layer replacing the removed Focus Mode system.

## Added

- Rituals page with active rituals and today's scheduled rituals.
- Create/edit/delete ritual flow.
- Ritual fields:
  - name
  - emoji
  - category
  - checklist steps
  - estimated duration
  - scheduled time
  - repeat days
  - reminder timing
  - color
  - archive/delete metadata
- Ritual completion tracking by date.
- Today dashboard integration showing today's rituals.
- Check off ritual steps directly from Today or Rituals.
- Skip today's ritual.
- Mark ritual complete.
- Sync-safe storage under `settings.rituals` and `settings.ritualCompletions`.
- Ritual delete tombstones under `settings.deletedRecords.rituals`.
- Reminder cron support for ritual reminders through `/api/push/reminders`.

## Default starter rituals

- Morning Reset
- Night Wind Down

These are lightweight defaults so the Rituals page is immediately useful. A full templates library remains Phase 5.

## Notes

Rituals are intentionally separate from calendar events. They do not automatically create calendar blocks unless a future phase explicitly adds that option.
