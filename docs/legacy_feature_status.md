# Legacy Feature Status

This folder contains historical phase notes as well as current setup notes. Many older files describe features that are no longer part of Tempo. Those notes are kept for history only; the README describes the current app.

## Active

- Schedule mode: Today, Calendar, Tasks, Plan Today, Rhythm Stats, mood/energy check-in, daily affirmation card, Settings.
- Budget mode: Home, Account, Transactions, Budget, Settings.
- Overall mode: combined budget and schedule summary.
- Supabase sign-in, local storage and cross-device cloud sync.

## Removed (code deleted)

- **Google Calendar import** (removed 2026-11). OAuth, sync and webhook routes, token storage and the Settings section are gone. Events and calendars it previously imported stay in saved data but are never shown, planned around or counted (`isImportedGoogleEvent` / `isImportedGoogleCalendar` in `lib/tempo/client/calendarPresentation.js`).
- **Closed-app push reminders** (removed 2026-11). Push routes, the service worker, the 5-minute reminder workflow, `web-push` and the reminder pickers on events and tasks are gone. On load, Tempo unregisters any old `tempo-sw.js` service worker and its push subscription. Saved `reminder`, `notifs`, `pushEnabled` and `notificationPreferences` values are left in data untouched.
- **Tempo Assistant** (server AI version and local chat version). No assistant UI, parser or API route remains; `scripts/validate-release.mjs` and `tests/local-assistant-regression.test.mjs` keep it out.

## Retired (hidden, code and data kept)

- Habits, Journal, Tomorrow Reset and Weekly Reset — see `retired_lifestyle_features_2026_11.md`.
- Rituals and Bloom Room naming may still appear in internal names for data compatibility.

Do not remove legacy data fields from `user_data` without a backup and a dedicated migration.
