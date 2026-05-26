# Phase 132 — Calendar/Search Modals Split

## Scope

Extracted calendar and search modal UI from `components/TempoApp.jsx` into `components/calendar/CalendarModals.jsx`.

Moved components:

- `EventModal`
- `AddEventModal`
- `SearchModal`
- `CalendarEditModal`
- `RecurrenceEditor`
- `EventReminderEditor`
- `highlightMatch`

## What did not change

- Google Calendar sync/request logic
- Tempo event persistence logic
- Google read-only/reference event protections
- Calendar visibility/source filtering
- Task mutation logic
- Reminder persistence/data shape
- Storage keys or cloud data schema

## Validation performed

Passed:

```bash
node scripts/validate-release.mjs
npm test
npm run lint -- --quiet
```

Test result:

```text
37 passed / 0 failed
```

`npm run build` started the Next production build successfully but exceeded the sandbox command limit before completion. Run it locally/Vercel after installing dependencies.

## Manual smoke checks

Calendar:

- Open an existing Tempo event
- Edit title/date/time/category/calendar/color/notes
- Save and refresh
- Delete a Tempo event
- Duplicate/copy an event if used
- Confirm Google events remain reference/read-only
- Confirm recurring event editor still appears for Tempo events
- Confirm event reminders still save

Add event:

- Click an empty calendar slot
- Add timed event
- Add all-day event
- Use event template buttons
- Add recurrence
- Add reminder
- Confirm it appears in day/week/month views

Calendars:

- Create a new Tempo calendar
- Rename a Tempo calendar
- Change calendar color
- Remove a Tempo calendar when more than one exists
- Confirm Google calendar names remain disabled/read-only

Search:

- Open search
- Type 1 character and confirm hint remains
- Type 2+ characters and confirm event/task results appear
- Click event result and confirm it navigates to day view and opens event
- Click task result and confirm task editor opens
- Press Escape and confirm search closes
