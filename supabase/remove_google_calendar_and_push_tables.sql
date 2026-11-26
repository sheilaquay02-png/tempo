-- Tempo: remove server tables left over from the retired Google Calendar
-- integration and closed-app push reminders.
--
-- The app no longer reads or writes any of these tables. Run this ONCE, by hand,
-- in the Supabase SQL Editor when you are ready. It permanently deletes:
--   * stored Google OAuth tokens (google_calendar_tokens)
--   * Google incremental-sync state (google_calendar_sync_state)
--   * browser push subscriptions (push_subscriptions)
--   * the sent-reminder log (push_reminder_log)
--
-- It does NOT touch public.user_data, so events, tasks, budget data and
-- settings (including any previously imported Google events) are kept.
--
-- Before running, also revoke Tempo's access in your Google Account
-- (Security -> Third-party apps with account access) so the stored refresh
-- tokens are invalidated on Google's side too.

drop table if exists public.google_calendar_sync_state;
drop table if exists public.google_calendar_tokens;
drop table if exists public.push_reminder_log;
drop table if exists public.push_subscriptions;
