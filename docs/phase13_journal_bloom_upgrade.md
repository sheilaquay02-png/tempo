# Phase 13 — Journal / Bloom Room Upgrade

## Scope
Phase 13 upgrades Journal and Bloom Room into the emotional reflection hub for Tempo.

## Changes

### Tomorrow Reset is now a page
- Tomorrow Reset now lives under Planning as its own full page.
- It no longer opens as a modal/popup from Today or the sidebar.
- The page keeps the same reset actions:
  - Move to tomorrow
  - Move to this week
  - Keep unscheduled
  - Drop
- Reflection prompts are still saved into Journal and Bloom Room.

### Journal Reflection Hub
- Added a Reflection Hub card near the top of Journal.
- It combines:
  - Today’s mood
  - Today’s energy
  - Gratitude
  - Tomorrow’s main thing
  - Weekly intention / priority
- Added a direct “Write today’s journal” action.

### Bloom Room Reflection Hub
- Added a Reflection Hub card to Bloom Room.
- It summarizes:
  - Current mood and energy
  - Total journal days
  - Weekly Reset status
  - Gratitude / tomorrow intention

## Data model
No new persistence table was required.

Phase 13 reuses existing synced data:
- `journal`
- `dailyCheckIns`
- `tomorrowResets`
- `weeklyResets`

## Validation
- `npm run build` passed.
