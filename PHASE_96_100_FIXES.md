# Tempo Phase 96-100 — Google Calendar sync v2

This phase is intentionally limited to Google Calendar reliability. It does not change the local Tempo Assistant, journal, task, habit, reminder, or decoration mechanics.

## Completed

- Added per-calendar Google sync state support through `google_calendar_sync_state`.
- Added Google Calendar `nextSyncToken` storage for incremental read-only imports.
- Manual import now uses incremental sync when a valid saved sync token and matching sync window exist.
- If Google returns `410 Gone` for an expired sync token, Tempo clears the stale token and recovers with a full import.
- Full imports now save the next sync token when Google provides one.
- Incremental imports no longer mark unseen Google events as missing; only full imports perform stale/missing cleanup.
- Cancelled/deleted Google events are handled as tombstones and do not reappear as normal events.
- Recurring Google instances now use a stable Tempo ID based on `recurringEventId + originalStartTime` where available.
- Google auth/token refresh failures now surface as reconnect-needed errors instead of generic failures.
- Google webhook route can now trigger a server-side incremental sync when a known channel is mapped in the sync-state table and `GOOGLE_WEBHOOK_TOKEN` is configured.
- Google disconnect now clears server-side sync state when the optional sync-state table exists.
- Added `supabase/google_calendar_incremental_sync_setup.sql`.
- Extended `supabase/production_safety_hardening.sql` with incremental sync state table setup.
- Added tests for recurring-event stable IDs and incremental merge behavior.

## Manual Supabase step

Run this in Supabase SQL Editor once:

```sql
-- Use the file in the project zip:
-- supabase/google_calendar_incremental_sync_setup.sql
```

If you do not run it immediately, Tempo should still fall back to full imports, but true incremental sync will not be available until the table exists.

## Optional webhook note

The webhook route is now safer and can trigger sync only when:

1. `GOOGLE_WEBHOOK_TOKEN` is set.
2. Google sends the matching `x-goog-channel-token` header.
3. The incoming `x-goog-channel-id` is already mapped in `google_calendar_sync_state`.

This phase does not create Google watch channels automatically. That should be a separate future phase if you want live push-calendar updates.
