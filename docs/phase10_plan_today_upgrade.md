# Phase 10 — Plan Today Upgrade

Implemented in this build.

## What changed

- Plan Today now uses the Phase 9 daily check-in to infer a starting planning mode:
  - Low energy → Light Day
  - Medium or unset energy → Normal Day
  - High energy → Productive Day
- Added planning modes inside the Plan Today modal:
  - Light Day
  - Normal Day
  - Productive Day
- Each mode adjusts daily capacity, deep-work limits, and buffer space without changing the user’s saved settings.
- Plan Today now protects scheduled rituals and habit reminders as soft lifestyle blocks.
- Plan Today still respects:
  - existing calendar events
  - existing scheduled tasks
  - work hours
  - meal breaks
  - after-meal buffers
  - planning buffers
  - task priority
  - task deadlines
  - max daily capacity
- Added controls to:
  - regenerate plan while preserving locked tasks
  - lock suggested task blocks
  - skip low-priority tasks for today
  - move remaining tasks to tomorrow
  - move remaining tasks to this week

## Product direction

This keeps the planner aligned with Tempo’s soft rhythm positioning: the app should help the user shape a realistic day based on their energy, not overload the calendar mechanically.
