# Phase 134 — Settings split

## Summary

Phase 134 extracts the settings UI out of `components/TempoApp.jsx` into a dedicated settings module while preserving the existing settings data shape, persistence calls, reminder controls, and Google Calendar sync controls.

## New files

- `components/settings/SettingsPanel.jsx`

## Updated files

- `components/TempoApp.jsx`
- `tests/local-assistant-regression.test.mjs`

## Moved UI

- Settings panel shell
- Account/sync debug section
- Onboarding restart section
- Appearance/theme section
- Text size section
- Work hours section
- Meal breaks section
- Timezone section
- Rhythm memory/settings section
- Google Calendar sync settings section
- Categories section
- In-app notifications section
- Closed-app push notifications section
- Reminder category schedule section

## Behaviour intentionally unchanged

- Settings persistence keys
- Local/cloud sync behaviour
- Google Calendar OAuth/import/disconnect behaviour
- Reminder and push notification toggles
- Planning rules and meal-break normalization
- Category creation/removal behaviour
- Existing local assistant/rhythm memory data shape

## Validation run

- `node scripts/validate-release.mjs`
- `npm test`
- `npm run lint -- --quiet`
- `npm run build`

## Manual check list

1. Open Settings and close it from backdrop and close button.
2. Restart onboarding button opens the onboarding flow.
3. Change theme, dark mode, and text size; refresh and confirm they persist.
4. Change work hours and meal breaks; open Plan Today and confirm protected windows remain correct.
5. Change timezone and confirm calendar display updates correctly.
6. Add, edit, recolor, and remove a category.
7. Toggle in-app notifications and closed-app push notifications.
8. Change journal/tomorrow reset/weekly reset/affirmation reminder schedules and refresh.
9. Connect, import, retry, and disconnect Google Calendar.
10. Confirm Google calendars remain read-only/reference-only.
