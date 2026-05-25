-- Tempo Phase 96-100 Google Calendar incremental sync state.
-- Safe to run more than once in Supabase SQL Editor.
-- This table is server-only. Sync tokens are not exposed to browser clients.

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

create index if not exists google_calendar_sync_state_calendar_idx
on public.google_calendar_sync_state (google_calendar_id);

create index if not exists google_calendar_sync_state_channel_idx
on public.google_calendar_sync_state (channel_id)
where channel_id is not null;

create index if not exists google_calendar_sync_state_resource_idx
on public.google_calendar_sync_state (channel_resource_id)
where channel_resource_id is not null;

alter table public.google_calendar_sync_state enable row level security;

-- No browser-facing policies by design. Next.js API routes use the service role
-- after validating the logged-in Supabase user or Google webhook channel token.
drop policy if exists "Users can view their own google calendar sync state" on public.google_calendar_sync_state;
drop policy if exists "Users can manage their own google calendar sync state" on public.google_calendar_sync_state;

comment on table public.google_calendar_sync_state is
  'Server-only per-calendar Google sync state. Stores Google nextSyncToken and optional webhook channel metadata.';
comment on column public.google_calendar_sync_state.sync_token is
  'Google Calendar nextSyncToken used by server routes for incremental read-only imports.';
