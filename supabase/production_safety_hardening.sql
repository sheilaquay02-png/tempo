-- Tempo production safety hardening.
-- Safe to run more than once in Supabase SQL Editor.
-- This file does not change app behavior; it strengthens database guardrails.

-- RLS confirmation / enforcement for user-owned data.
alter table if exists public.user_data enable row level security;

-- User data is browser-readable/writable only for the logged-in user's own row.
drop policy if exists "Users can only access their own data" on public.user_data;
create policy "Users can only access their own data"
on public.user_data
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
