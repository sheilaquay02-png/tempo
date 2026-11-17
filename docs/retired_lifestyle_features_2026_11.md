# Retiring unused Tempo modules (2026-11-17)

## Product decision

After six months of use, the Habits, Journal, Tomorrow Reset and Weekly Reset experiences are retired from Tempo's active application.

## Removed from the active experience

- Desktop sidebar and phone bottom navigation
- Today dashboard: habit cards, journal prompt and Tomorrow Reset shortcut
- Active page rendering, URL deep links and Journal keyboard shortcut
- Onboarding habit templates and retired lifestyle reminders
- Settings controls for habit, journal, and reset reminders
- Calendar overlays generated from old habit reminders
- Server-generated habit, journal and reset notifications, including snoozed notifications of those types
- Old service-worker navigation targets and complete-habit notification action
- Habit/Journal/Reset statistics in the visible Rhythm Stats and Overall screens

## Preserved

- Today, Calendar, Tasks, Budget, Mood check-in, Affirmations, Plan Today, Rhythm Stats
- User authentication, data schema, cloud sync, Google Calendar integration, task and event reminders
- Historical habit, journal and reset records in both local state and cloud payloads
- Archived modules and serialization/normalization helpers for possible future migration or export

**Important:** This is a non-destructive feature retirement, not a permanent purge of saved content or a database migration. The source modules remain in the repository but are not mounted in the active application. Do not delete existing Supabase JSON fields until archived records have been backed up and a dedicated migration is approved.

## Manual QA before merging

1. Sign in on web and phone and confirm Today, Tasks, Calendar and Budget still load.
2. Check that neither desktop nor mobile navigation reveals the four retired features.
3. Open old links such as `/?page=journal`, `/?page=habits`, `/?page=tomorrow-reset` and `/?page=weekly-reset`: they must go to Today.
4. Confirm Journal shortcut J does not open the retired page.
5. Confirm an existing scheduled habit no longer creates a calendar reminder event.
6. Confirm reminder settings show only retained categories.
7. Trigger a dry-run push reminder check and confirm only retained event, task and affirmation candidates are generated.
8. Edit a task on one device and confirm Supabase sync on another.
9. Verify old Journal/Habit/Reset records still exist in the user's cloud settings (do not clear records).
10. Test budget entry popups and mobile footer navigation for regressions.

Do not merge until build, tests, lint and manual smoke tests are satisfactory.
