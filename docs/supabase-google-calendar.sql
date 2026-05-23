-- Tempo Phase 22 — Google Calendar OAuth token storage
-- Run this in Supabase SQL Editor.
-- Tokens stay server-side only. Do not expose this table to client-side code.

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

-- Intentionally no user-facing RLS policies.
-- The app reads/writes this table only through Next.js API routes using SUPABASE_SERVICE_ROLE_KEY.
-- Supabase service role bypasses RLS; anon/authenticated clients cannot read these tokens.

create index if not exists google_calendar_tokens_updated_at_idx
  on public.google_calendar_tokens(updated_at);
