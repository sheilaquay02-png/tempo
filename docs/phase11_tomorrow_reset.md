# Phase 11 — Tomorrow Reset

## Objective
Replace the old carry-over prompt with a softer nightly Tomorrow Reset flow.

## Added
- Guided Tomorrow Reset modal from Today/sidebar.
- Per-task decision controls for unfinished day tasks:
  - Move to tomorrow
  - Move to this week
  - Keep unscheduled
  - Drop it
- Reflection prompts:
  - What went well today?
  - What felt difficult?
  - What should move to tomorrow?
  - Tomorrow’s main thing
  - One gratitude
- Synced `tomorrowResets` model stored with user settings.
- Reset summary appears in Journal.
- Reset rhythm card appears in Bloom Room.
- Reflection text is also appended into the day’s Journal entry for continuity.

## Data model
```js
{
  id,
  date,
  completedAt,
  taskActions,
  summary,
  reflection,
  createdAt,
  updatedAt,
  deletedAt
}
```

## Acceptance criteria covered
- User can process unfinished tasks.
- User can write a short reflection.
- User can set tomorrow’s main thing.
- Reset data appears in Journal / Bloom Room.
- Reset data syncs through existing settings sync.
