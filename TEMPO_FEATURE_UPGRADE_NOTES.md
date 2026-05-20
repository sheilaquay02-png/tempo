# Tempo Feature Upgrade Notes

This build adds the requested next feature set on top of the existing Vercel + Supabase + GitHub architecture.

## Added

### 1. Custom reminders
- Calendar events now support: no reminder, at time of event, 5 minutes, 10 minutes, 30 minutes, 1 hour, 1 day, and custom minutes before.
- Tasks now support: no reminder, morning, afternoon, evening, and custom time.
- Reminder data is stored inside the existing event/task JSON, so no Supabase migration is required.
- `/api/push/reminders` now reads each event/task reminder setting when cron checks for due push notifications.

### 2. Smart daily planning
- Added a `Plan My Day` action in the sidebar and calendar top bar.
- The planner checks today’s open day tasks, available calendar slots, task duration, and priority.
- It suggests a timed plan and can apply the plan directly into the calendar.

### 3. Task-to-calendar auto scheduling
- Added a calendar/schedule button to each open task.
- Users can schedule a task for today, this week, or before deadline.
- Users can restrict scheduling to focus hours only.
- Scheduled tasks are linked back to the generated calendar event.

### 4. Better recurring rules
- Added stronger task recurrence presets: every weekday, Mon/Wed/Fri, every 2 weeks, monthly, and monthly on the 15th.
- Event recurrence now supports monthly day-of-month selection.
- Recurrence stepping now supports intervals and monthly day rules more consistently.

### 5. Focus mode upgrade
- Focus sessions now contribute to task progress.
- High-priority or long-duration tasks show a Boss Battle style progress/HP bar.
- Completed focus duration can auto-complete the linked task once the required task duration is reached.
- Completed Pomodoro work sessions create a linked focus block in the calendar.
- Manual stop allows session notes to be appended to the task.

## Deployment notes

- No new environment variables are required.
- No database migration is required.
- Keep the same cron endpoint: `/api/push/reminders`.
- Continue calling the cron route with your existing `CRON_SECRET` bearer token or `x-tempo-push-secret` header.
