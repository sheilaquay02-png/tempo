-- Tempo Google Calendar OAuth token storage.
-- Run this in Supabase SQL Editor. Tokens are encrypted by the Next.js server
-- before insert/update and never exposed to browser clients.

create table if not exists public.google_calendar_tokens (
  user_id uuid primary key references auth.users(id) on delete cascade,
  access_token text not null,
  refresh_token text,
  expires_at timestamptz,
  scope text,
  token_type text default 'Bearer',
  google_email text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.google_calendar_tokens enable row level security;

-- Intentionally no user-facing policies. Server routes use SUPABASE_SERVICE_ROLE_KEY.
drop policy if exists "Users can view their own google calendar tokens" on public.google_calendar_tokens;
drop policy if exists "Users can manage their own google calendar tokens" on public.google_calendar_tokens;

create index if not exists google_calendar_tokens_updated_at_idx
  on public.google_calendar_tokens(updated_at);
