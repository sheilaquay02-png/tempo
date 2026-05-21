-- Tempo Google Calendar live OAuth sync setup.
-- Run this before implementing Google Calendar OAuth routes.
-- Important: these tables intentionally have RLS enabled with no browser-facing policies.
-- Access must go through Next.js API routes using SUPABASE_SERVICE_ROLE_KEY.

create table if not exists public.google_calendar_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null unique,

  -- Google account / calendar metadata safe to show through a server API status route.
  google_sub text,
  google_email text,
  calendar_id text not null default 'primary',
  calendar_summary text,
  scope text,

  -- OAuth token payloads must be encrypted by the Next.js server before storage.
  -- Do not expose these columns directly to the browser.
  access_token_encrypted text,
  refresh_token_encrypted text,
  token_type text default 'Bearer',
  token_expiry timestamptz,
  token_encryption_version integer not null default 1,

  -- Incremental sync and push channel state.
  sync_token text,
  sync_enabled boolean not null default true,
  sync_direction text not null default 'two_way'
    check (sync_direction in ('import_only', 'export_only', 'two_way')),
  last_full_sync_at timestamptz,
  last_incremental_sync_at timestamptz,
  last_error text,

  -- Google push notification channel details.
  channel_id text,
  channel_resource_id text,
  channel_resource_uri text,
  channel_token_hash text,
  channel_expiration timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_google_calendar_connections_user_id
  on public.google_calendar_connections(user_id);

create index if not exists idx_google_calendar_connections_channel_id
  on public.google_calendar_connections(channel_id);

alter table public.google_calendar_connections enable row level security;

comment on table public.google_calendar_connections is
  'Server-only Google Calendar OAuth token and sync state table. No browser RLS policies by design.';
comment on column public.google_calendar_connections.access_token_encrypted is
  'Encrypted by Next.js server using GOOGLE_TOKEN_ENCRYPTION_KEY before insert/update.';
comment on column public.google_calendar_connections.refresh_token_encrypted is
  'Encrypted by Next.js server using GOOGLE_TOKEN_ENCRYPTION_KEY before insert/update.';

create table if not exists public.google_calendar_event_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  tempo_event_id text not null,
  google_calendar_id text not null default 'primary',
  google_event_id text not null,
  google_etag text,
  google_updated_at timestamptz,
  google_recurring_event_id text,
  google_original_start text,
  last_synced_at timestamptz,
  last_sync_direction text check (last_sync_direction in ('tempo_to_google', 'google_to_tempo')),
  conflict_status text not null default 'none'
    check (conflict_status in ('none', 'needs_review', 'tempo_wins', 'google_wins')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, tempo_event_id),
  unique(user_id, google_calendar_id, google_event_id)
);

create index if not exists idx_google_calendar_event_links_user_id
  on public.google_calendar_event_links(user_id);

alter table public.google_calendar_event_links enable row level security;

comment on table public.google_calendar_event_links is
  'Server-only mapping between Tempo event IDs and Google Calendar event IDs.';

create table if not exists public.google_calendar_sync_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  run_type text not null check (run_type in ('connect', 'manual', 'webhook', 'foreground', 'renew_watch', 'disconnect')),
  status text not null check (status in ('started', 'success', 'partial', 'failed')),
  message text,
  stats jsonb default '{}'::jsonb,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create index if not exists idx_google_calendar_sync_log_user_id_started_at
  on public.google_calendar_sync_log(user_id, started_at desc);

alter table public.google_calendar_sync_log enable row level security;

comment on table public.google_calendar_sync_log is
  'Server-only audit trail for Google Calendar sync runs.';
