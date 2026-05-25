# Phase 96-100 Google Calendar Sync V2 checklist

## Deploy checklist

1. Deploy the Phase 96-100 zip.
2. Run `supabase/google_calendar_incremental_sync_setup.sql` in Supabase SQL Editor.
3. Confirm `GOOGLE_TOKEN_ENCRYPTION_KEY` remains set in Vercel.
4. Reconnect Google Calendar if Tempo says Google needs reconnecting.
5. Click Import Google Events once to seed the first full sync token.
6. Click Import Google Events again later; Tempo should use incremental sync when the saved token is still valid for the same sync window.

## What to expect

- First import after this phase: usually full import.
- Later import on the same sync window: incremental import.
- If Google invalidates the sync token: Tempo recovers with a full import.
- Deleted Google events should disappear/mark as removed after import.
- Google events remain read-only inside Tempo.

## Do not change

- Do not add `/api/assistant`.
- Do not add OpenAI env vars.
- Do not remove the local Tempo Assistant.
- Do not convert Google import into write-back/two-way sync.
