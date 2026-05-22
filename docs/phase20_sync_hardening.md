# Phase 20 — Sync Hardening

Phase 20 strengthens Tempo's cross-device sync now that the app has more lifestyle data beyond events and tasks.

## What changed

- Added sync coverage for the Phase 9–15 lifestyle datasets inside the cloud settings payload:
  - rituals
  - ritual completions
  - habits
  - habit completions
  - daily mood and energy check-ins
  - Tomorrow Reset entries
  - Weekly Reset entries
  - affirmations
  - notification preferences
  - Journal / Bloom Room data
- Added 90-day tombstone pruning for deleted records so removed items stay deleted across devices without keeping deletion markers forever.
- Added conflict logging for same-record edits made on multiple devices. Tempo keeps the newest version and records a short sync conflict note.
- Added a Settings → Account sync debug panel showing:
  - pending local edits
  - retained delete records
  - recent sync conflicts
  - last successful sync time
  - counts for synced datasets
- Successful cloud saves now update the last-synced timestamp, not only manual force syncs.
- Kept the existing realtime pull, focus/online/visibility refresh, pending offline changes, force sync, and merge-safe data flow.

## Product behavior

Tempo remains soft and non-technical in normal use. The sync debug panel is intentionally tucked into Settings so regular users are not distracted, while debugging device mismatch issues is easier during development and testing.

## Acceptance coverage

- Deletions sync using tombstones.
- Tombstones are pruned after 90 days.
- Offline or failed edits remain marked as pending.
- Manual Force Sync still merges cloud + local safely.
- Mobile and desktop can reconcile newer edits by record instead of replacing whole collections.
- Sync debug visibility is available in Settings.
