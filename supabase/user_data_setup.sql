-- Tempo base user_data table setup.
-- Run this once in Supabase SQL Editor if the table does not already exist.

create table if not exists public.user_data (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null unique,
  events jsonb default '[]'::jsonb,
  tasks jsonb default '[]'::jsonb,
  settings jsonb default '{}'::jsonb,
  updated_at timestamptz default now()
);

alter table public.user_data enable row level security;

drop policy if exists "Users can only access their own data" on public.user_data;
create policy "Users can only access their own data"
on public.user_data
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Required for Supabase Realtime sync across PWA/desktop.
-- In Supabase Dashboard, also enable Realtime for public.user_data.
comment on table public.user_data is 'Main Tempo JSON snapshot table. Enable Realtime for this table in Supabase when using cross-device live sync.';
