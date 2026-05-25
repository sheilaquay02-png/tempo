# Phase 106–110 Timezone and Date Audit Notes

Tempo now has a small shared timezone/date utility module so server-side code does not accidentally use the Vercel/UTC date when a user expects their local Tempo day.

## Default timezone behavior

- User/settings timezone is used when available.
- Invalid timezone values fall back to `Asia/Singapore`.
- Server cron/reminder logic uses local date parts derived with `Intl.DateTimeFormat`, not server-local `getDate()`.

## Google all-day events

Google all-day events are date-only and their `end.date` is exclusive. Tempo now keeps that exclusive end metadata and converts the displayed event range through the selected timezone boundary.

## Reminders

Reminder due checks now rely on shared local-clock helpers. This reduces issues around midnight where a reminder could be created for the UTC day instead of the Tempo day.

## Task period keys

Task date keys are normalized to padded `YYYY-MM-DD` where possible. Weekly keys use Monday week starts. Monthly keys use `YYYY-MM`.
