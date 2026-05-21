# Phase 9 — Mood and Energy Check-In

## Objective
Add emotional context to Tempo's daily planning loop so Today, Journal/Bloom Room, and future Plan Today logic can understand the user's mood and energy for the day.

## Data Model
Daily check-ins are stored as a synced array under `settings.dailyCheckIns`:

```js
{
  id: "checkin-YYYY-MM-DD",
  date: "YYYY-MM-DD",
  mood: "great | good | okay | tired | stressed | low",
  energy: "low | medium | high",
  note: "Optional note",
  createdAt: "ISO timestamp",
  updatedAt: "ISO timestamp",
  deletedAt: null
}
```

The array format fits the existing `mergeRecordsById` sync pattern and keeps one latest check-in per date.

## Included Changes
- Added mood and energy constants in `lib/tempo/core.js`.
- Added normalizers and date lookup helpers for daily check-ins.
- Added `dailyCheckIns` to local persistence, Supabase settings persistence, force sync, and merge logic.
- Added a `DailyCheckInModal` in `components/TempoApp.jsx`.
- Updated Today dashboard check-in card to use the new daily check-in model.
- Added daily check-in visibility to Journal.
- Added a Bloom Room rhythm card showing today's check-in and recent check-in trail.
- Added soft, premium Phase 9 styling in `styles/tempoStyles.js`.

## Acceptance Criteria Covered
- User can check in once per day.
- User can edit today's mood/energy.
- Mood and energy appear on Today.
- Mood and energy appear in Journal/Bloom Room.
- Data is included in local storage and cloud sync.
