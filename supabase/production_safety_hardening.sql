-- Tempo Phase 91-95 production safety hardening.
-- Safe to run more than once in Supabase SQL Editor.
-- This file does not change app behavior; it strengthens database guardrails.

-- 1) RLS confirmation / enforcement for user-owned data.
alter table if exists public.user_data enable row level security;
alter table if exists public.google_calendar_tokens enable row level security;
alter table if exists public.push_subscriptions enable row level security;
alter table if exists public.push_reminder_log enable row level security;

-- User data is browser-readable/writable only for the logged-in user's own row.
drop policy if exists "Users can only access their own data" on public.user_data;
create policy "Users can only access their own data"
on public.user_data
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Google OAuth tokens are server-only. No browser-facing token policies by design.
drop policy if exists "Users can view their own google calendar tokens" on public.google_calendar_tokens;
drop policy if exists "Users can manage their own google calendar tokens" on public.google_calendar_tokens;

-- Push subscriptions may be managed by the authenticated user or by server routes.
-- Keeping this policy preserves existing behavior while RLS prevents cross-user access.
drop policy if exists "Users can manage their own push subscriptions" on public.push_subscriptions;
create policy "Users can manage their own push subscriptions"
on public.push_subscriptions
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Reminder logs are server-only because they contain notification/action metadata.
drop policy if exists "Users can view their own push reminder log" on public.push_reminder_log;
drop policy if exists "Users can manage their own push reminder log" on public.push_reminder_log;

-- 2) DB-level reminder dedupe / token lookup hardening.
-- reminder_key already includes the user id in current app code; this index protects
-- future code too and makes the dedupe intent explicit at database level.
create unique index if not exists push_reminder_log_user_reminder_key_uidx
on public.push_reminder_log (user_id, reminder_key);

create index if not exists push_reminder_log_user_scheduled_idx
on public.push_reminder_log (user_id, scheduled_for desc);

create index if not exists push_reminder_log_type_scheduled_idx
on public.push_reminder_log (reminder_type, scheduled_for desc);

-- Action tokens are stored only as hashes inside meta. This unique index prevents
-- accidental duplicate active action tokens and speeds up /api/push/action.
create unique index if not exists push_reminder_log_action_token_hash_uidx
on public.push_reminder_log ((meta->>'actionTokenHash'))
where meta ? 'actionTokenHash' and nullif(meta->>'actionTokenHash', '') is not null;

comment on table public.google_calendar_tokens is
  'Server-only encrypted Google OAuth token table. RLS enabled; no browser policies by design.';

comment on table public.push_reminder_log is
  'Server-only reminder/action log. RLS enabled; dedupe indexes prevent repeated sends/actions.';

-- 3) Google Calendar incremental sync state (Phase 96-100).
create table if not exists public.google_calendar_sync_state (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  google_calendar_id text not null,
  sync_token text,
  sync_window jsonb default '{}'::jsonb,
  last_mode text,
  last_item_count integer default 0,
  last_full_sync_at timestamptz,
  last_incremental_sync_at timestamptz,
  last_webhook_at timestamptz,
  last_webhook_state text,
  last_error text,
  channel_id text,
  channel_resource_id text,
  channel_resource_uri text,
  channel_expiration timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, google_calendar_id)
);

create index if not exists google_calendar_sync_state_user_idx
on public.google_calendar_sync_state (user_id);

create index if not exists google_calendar_sync_state_channel_idx
on public.google_calendar_sync_state (channel_id)
where channel_id is not null;

alter table if exists public.google_calendar_sync_state enable row level security;
drop policy if exists "Users can view their own google calendar sync state" on public.google_calendar_sync_state;
drop policy if exists "Users can manage their own google calendar sync state" on public.google_calendar_sync_state;
