# Phase 101–105 — Journal Media Safety

Scope: journal/memory photo reliability only. This phase intentionally does not change Tempo core mechanics, the local Tempo Assistant, calendar/task/habit behavior, or journal decoration behavior.

## Completed

- Added safer upload rollback for Journal photos.
  - If the full-size upload succeeds but the thumbnail upload fails, Tempo now attempts to delete every uploaded object from that failed upload attempt, not just the first file.

- Added detailed storage deletion results.
  - `deleteMemoryStoragePathsDetailed()` returns deleted/failed path details so the app can retry cleanup instead of silently losing track of failed deletions.

- Added a local Journal photo cleanup queue.
  - Removed photos are still deleted only after the memory entry is saved.
  - If deletion fails, paths are queued locally and retried later.
  - Retry attempts are deduped, capped, and spaced out to avoid rapid repeated deletion attempts.

- Added safer rollback for newly uploaded files when saving the memory fails.
  - If rollback deletion fails, the uploaded paths are also queued for later cleanup.

- Made Journal image preview compression more consistent.
  - Preview images now use a smaller bounded size and JPEG output to reduce local memory/cache pressure.
  - Upload/thumbnail compression quality constants are now centralized.

- Added pure Journal media helper functions:
  - collect storage paths from a journal
  - detect removed photo paths
  - build/dedupe cleanup queues
  - mark cleanup retry attempts

- Added tests for Journal media safety helpers.

## Not changed

- Local Tempo Assistant/chatbot preserved.
- No OpenAI/API assistant route added.
- Journal entry flow preserved.
- Journal decoration mechanics preserved.
- Existing Supabase Storage bucket name and policies preserved.

## Manual notes

No new Supabase SQL is required for this phase.

The existing private `memory-images` Supabase Storage bucket and policies are still required.
