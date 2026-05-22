# Phase 12 — Weekly Reset

Implemented the Weekly Reset flow on top of Phase 11.

## Added

- `weeklyResets` synced dataset.
- Weekly Reset page replacing the placeholder.
- Review last week summary.
- Mood and energy trend summary from daily check-ins.
- Weekly priorities and weekly intention.
- Unfinished task processing: move to next week, keep unscheduled, or drop.
- Key event notes for next week.
- Habit focus selector for the next week.
- Reflection prompts saved into Journal.
- Weekly Reset cards in Journal and Bloom Room.

## Sync

Weekly resets are stored in local storage and Supabase settings under `weeklyResets`, merged conflict-safely by record id.
