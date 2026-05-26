# Phase 140 — Final Thin-Shell Cleanup

## Scope

Phase 140 completes the gradual `TempoApp.jsx` split by removing the remaining legacy local assistant surface and cleaning up product source references that no longer belong in the app.

## Changed files

- `components/TempoApp.jsx`
- `components/settings/SettingsPanel.jsx`
- `styles/tempoStyles.js`
- `scripts/validate-release.mjs`
- `tests/local-assistant-regression.test.mjs`
- `docs/phase_140_split_status.md`

## What changed

- Removed the legacy local assistant context engine and chat panel from `TempoApp.jsx`.
- Removed the assistant floating action button and `A` keyboard shortcut.
- Removed assistant memory/action-history state from the main app shell.
- Removed assistant memory settings from `SettingsPanel`.
- Removed obsolete assistant-specific CSS from `styles/tempoStyles.js`.
- Updated release validation and regression tests so the removed assistant surface stays removed.
- Preserved the read-only Google Calendar sync guard and no `app/api/assistant` route policy.

## Preserved behaviour

- Tasks, events, habits, journal, affirmations, check-ins, resets, settings, reminders, Google Calendar sync, cloud sync, and push notification flows were not intentionally changed.
- Existing saved data with old assistant fields should continue to load because unknown settings fields are ignored by the product UI.

## Manual checks

1. App loads while signed out and signed in.
2. No floating chat/helper button appears.
3. Keyboard shortcut `A` no longer opens anything.
4. Settings no longer shows assistant rhythm memory or assistant action history.
5. Today, Calendar, Tasks, Habits, Journal, Rhythm Stats, Tomorrow Reset, Weekly Reset, and Settings still open.
6. Cloud sync still reaches Saved after editing a task/event/journal entry.
7. Google Calendar import remains read-only and does not recreate any assistant route.
