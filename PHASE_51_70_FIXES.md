# Phase 51–70 Conservative Audit Fixes

Applied as UX/reliability hardening only. No core app mechanics were removed or redesigned. The restored local Tempo Assistant remains intact and no OpenAI/API assistant route was added.

## Included fixes

- Clarified that Google Calendar is a read-only import/reference integration.
- Added clearer Google sync status states: syncing, connected, stale, failed, offline, and not connected.
- Added Retry import behavior after Google sync failures and empty calendar imports.
- Added reconnect warning when Google access appears expired/revoked/unauthorized.
- Added empty/error states for connected Google accounts with no calendars loaded.
- Strengthened Google disconnect confirmation and explicitly warns imported Google reference events will be removed from Tempo only.
- Made notification permission flow more explicit.
- Added unsupported-browser messaging for in-app and closed-app push notifications.
- Fixed service worker action feedback so snooze only shows success if the server action succeeds.
- Changed service worker activation behavior to avoid force-claiming existing pages during edits.
- Added a service worker version marker and notification URL sanitization so legacy/removed notification links open safe Tempo pages.
- Added mobile safe-area spacing around modals and bottom navigation.
- Added a current-product note for legacy Ritual/Bloom documentation so old phase docs are not mistaken for active product surfaces.
- Added conservative destructive-action confirmations in Settings.
- Improved Google event import for untitled events, location-only events, missing start dates, and long descriptions.
- Google sync now skips malformed Google events instead of failing the entire import.

## Explicitly preserved

- Local Tempo Assistant / chatbot code and design.
- Add Event and Add Task assistant conversational flows.
- Journal, tasks, calendar, habits, routines, reminders, and sync mechanics.
- Legacy data compatibility fields needed for existing users.
