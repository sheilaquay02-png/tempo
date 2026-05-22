# Phase 15 — Notification Revamp

Phase 15 softens Tempo reminders and extends closed-app push support beyond tasks/events.

## Added

- Reminder category preferences in Settings:
  - Events
  - Tasks
  - Rituals
  - Habits
- Scheduled lifestyle reminders in Settings:
  - Journal reminder
  - Tomorrow Reset reminder
  - Weekly Reset reminder
  - Daily affirmation reminder
- New `notificationPreferences` settings model with local persistence and cloud sync.
- Softer reminder copy aligned with the Tempo rhythm direction.
- Push reminder candidates for:
  - Calendar events
  - Tasks
  - Rituals
  - Habits
  - Journal check-ins
  - Tomorrow Reset
  - Weekly Reset
  - Daily affirmations
  - Snoozed reminders
- Notification actions:
  - Snooze 5 minutes
  - Snooze 10 minutes
  - Snooze 30 minutes
  - Mark task done
  - Complete habit
  - Start ritual
  - Skip ritual
  - Open journal
  - Start reset
  - Open Tempo
- Service worker support for habit and ritual notification actions.
- Server-side push action route support for habit completion and ritual skip/completion.

## Today layout fix

Daily Affirmation now appears above the Check-in card on the Today dashboard.

## Data model

`settings.notificationPreferences`:

```js
{
  events: true,
  tasks: true,
  rituals: true,
  habits: true,
  journal: { enabled: false, time: "21:30" },
  tomorrowReset: { enabled: false, time: "21:45" },
  weeklyReset: { enabled: false, day: 0, time: "18:00" },
  affirmations: { enabled: false, time: "08:30" },
}
```

## Notes

- Individual task/event/ritual/habit reminder times still live on the item itself.
- The Settings page controls whether those reminder categories are allowed to send.
- Daily affirmation reminder settings stay synced with the Affirmations page reminder toggle.
- The GitHub/Vercel reminder cron still uses `/api/push/reminders`.
- Closed-app push still requires VAPID keys, push subscription setup, and `CRON_SECRET`.
