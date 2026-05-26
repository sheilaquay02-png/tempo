# Phase 128 — TempoApp display component split

## Completed in Phase 128

Extracted low-risk presentational components from `components/TempoApp.jsx` into:

- `components/shared/DisplayComponents.jsx`

Moved components:

- `TempoLogoMark`
- `DailyStartupModal`
- `DailyAffirmationCard`
- `SyncStatusPill`
- `ComingSoonPage`

No reminder logic, sync logic, storage logic, task mutation logic, journal mutation logic, or Google Calendar logic was changed.

## Validation run

- `npm run validate:release` — passed
- `npm test` — passed, 37/37 tests
- `npm run lint` — passed with existing warnings only, 0 errors
- `npm run build` — passed

## Remaining split phases

### Phase 129 — Extract habit components — completed

Completed files:

- `components/habits/Habits.jsx`
- `utils/habitUtils.js`

Check details are in `docs/phase_129_split_status.md`.

### Phase 130 — Extract affirmation components

Suggested files:

- `components/affirmations/AffirmationEditorModal.jsx`
- Keep `DailyAffirmationCard` either in shared or move here later

Check:

- Daily affirmation appears on Today
- Create custom affirmation
- Edit custom affirmation
- Delete custom affirmation
- Favorite toggle persists

### Phase 131 — Extract check-in/reset modals

Suggested files:

- `components/checkins/DailyCheckInModal.jsx`
- `components/resets/TomorrowResetModal.jsx`
- `components/resets/WeeklyResetModal.jsx`

Check:

- Daily mood/energy/note saves
- Tomorrow reset saves and appears on Today/Journal
- Weekly reset saves and appears correctly
- Existing check-ins/resets still load after refresh

### Phase 132 — Extract event/search modals

Suggested files:

- `components/calendar/AddEventModal.jsx`
- `components/calendar/CalendarEditModal.jsx`
- `components/search/SearchModal.jsx`

Check:

- Add Tempo event
- Edit Tempo calendar
- Delete custom calendar
- Google calendars remain read-only where expected
- Search finds events/tasks and navigates correctly

### Phase 133 — Extract planning modals

Suggested files:

- `components/planning/DailyPlanModal.jsx`
- `components/planning/TaskScheduleModal.jsx`

Check:

- Plan Today still generates slots
- Apply plan still moves selected tasks
- Move remaining to tomorrow/week still works
- Meal breaks and planning mode rules still apply

### Phase 134 — Extract settings panel sections

Suggested files:

- `components/settings/SettingsPanel.jsx`
- Optional section components for account, appearance, reminders, Google sync, categories, meal breaks, planning rules

Check:

- Theme/font/dark mode persist
- Work hours persist
- Categories add/edit/delete still work
- Meal breaks persist
- Notification preferences persist
- Google connect/disconnect/sync controls still work

### Phase 135 — Extract journal page and memory editor

Suggested files:

- `components/journal/JournalPage.jsx`
- `components/journal/DayEntryModal.jsx`
- `components/journal/JournalDecorationCanvas.jsx`

Check:

- Open/edit/save journal entries
- Upload/delete memory photos
- Scrapbook decorations still drag/resize/rotate on desktop
- Mobile can view decorations without desktop editing controls
- Encrypted/local journal data still loads

### Phase 136 — Extract Today dashboard

Suggested files:

- `components/today/TodayLitePage.jsx`
- Small subcards if needed

Check:

- Today summary counts events/tasks/habits correctly
- Top tasks toggle/edit correctly
- Today events open calendar correctly
- Check-in and affirmation shortcuts still work

### Phase 137 — Extract app shell/navigation

Suggested files:

- `components/shell/TempoShell.jsx`
- `components/shell/DesktopSidebar.jsx`
- `components/shell/MobileNav.jsx`
- `components/shell/LoadingScreens.jsx`

Check:

- Desktop navigation works
- Mobile navigation works
- Sync pill appears in both layouts
- Loading/auth screens still render
- Active tab state persists correctly

### Phase 138 — Extract cloud sync/data orchestration hooks

Suggested files:

- `hooks/useTempoPersistence.js`
- `hooks/useTempoCloudSync.js`
- `hooks/useGoogleCalendarSync.js`

Check:

- Existing local data loads
- Cloud data loads after login
- Offline edits queue correctly
- Manual force sync works
- Conflict log remains stable
- Google import does not overwrite Tempo events incorrectly

### Phase 139 — Extract settings/data normalization helpers

Suggested files:

- `utils/settingsUtils.js`
- `utils/deletedRecordsUtils.js`
- `utils/planningUtils.js`
- `utils/habitUtils.js`

Check:

- Saved settings migrate correctly
- Deleted records remain filtered
- Existing habit/planning data survives refresh
- Tests remain green

### Phase 140 — Final TempoApp thin-shell pass

Goal:

- `TempoApp.jsx` should become mostly state composition, routing between tabs, and prop wiring.
- Heavy JSX, modal bodies, and pure helpers should live outside the file.

Check:

- Full production build
- Full lint/test suite
- Manual smoke test of every main tab
- Confirm no legacy or unwanted routes/files returned
