# Phase 138 — Persistence and cloud sync hooks

## Completed

Extracted low-level persistence/sync wiring from `components/TempoApp.jsx` into hooks:

- `hooks/useTempoPersistence.js`
  - `useTempoUserKey`
  - Owns the authenticated-vs-anonymous user key selection and persistent anonymous local key.

- `hooks/useTempoCloudSync.js`
  - `useTempoCloudSync`
  - Owns sync status, pending local change count, last synced timestamp, cloud queue ref, cloud hydration guard ref, and queued cloud saves.
  - `useTempoRealtimeSync`
  - Owns Supabase realtime subscription plus focus/online/visibility cloud pull listeners.

## Intentionally unchanged

- Cloud/local merge rules.
- Force-sync merge flow.
- Local save keys and saved data shape.
- Journal encryption/decryption and photo storage migration logic.
- Google Calendar import/sync behavior.
- Task, habit, reset, and journal mutation behavior.

## Manual checks

1. Sign in and confirm Tempo loads only the signed-in user's data.
2. Sign out and confirm the logged-out screen does not show previous user data.
3. Edit a task/event and confirm sync status changes to saving/saved.
4. Disconnect internet, edit a task/event, and confirm offline/pending status appears.
5. Reconnect internet or refocus the app and confirm sync retries.
6. Open the app in two tabs, edit one tab, and confirm the other pulls the newer cloud state.
7. Save a Journal memory and confirm the strict cloud save/pending path still works.
