# Phase 17 — Data Cleanup and Migration

Phase 17 cleans the remaining legacy productivity/focus data while preserving user-created records.

## What changed

- Added `DATA_MIGRATION_VERSION = 17`.
- Added `dataMigrationVersion` to synced user settings.
- Added a one-time client migration that runs after authenticated data loads.
- Migrated legacy task categories safely:
  - `Boss Battle` / `boss` / `boss-battle` → `Main Thing`
  - `Deep Work` / `deep-work` → `Important`
  - `Admin` → `Light Task`
  - `Health` → `Wellness`
- Stripped legacy Focus/Boss task fields from normalized task records.
- Removed legacy Focus/Boss localStorage keys for the active user.
- Extended deletion tombstones so newer lifestyle records are safer across sync:
  - rituals
  - ritual completions
  - habits
  - habit completions
  - daily check-ins
  - tomorrow resets
  - weekly resets
  - affirmations
- Sanitized merged cloud settings so old Focus/Boss settings do not continue to persist.

## Safety rules

- User tasks are not deleted.
- User events are not deleted.
- Journal and Bloom Room data are preserved.
- Rituals, habits, check-ins, resets, and affirmations remain intact.
- Old categories are renamed/normalized instead of removed.
- Tombstones are kept for sync safety.

## Validation

- `lib/tempo/core.js` syntax check passed.
- `styles/tempoStyles.js` syntax check passed.
- JSX transpile checks passed for:
  - `components/TempoApp.jsx`
  - `components/bloom/BloomRoom.jsx`
  - `components/tasks/Tasks.jsx`

Full `npm run build` could not run in this sandbox because the clean ZIP does not include `node_modules`.
