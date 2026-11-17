-- LOCAL Supabase-only fixture, designed for a fresh disposable database.
-- Never run on the production Tempo project.
\set ON_ERROR_STOP on
CREATE TABLE IF NOT EXISTS public.user_data (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  events jsonb not null default '[]'::jsonb,
  tasks jsonb not null default '[]'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
ALTER TABLE public.user_data ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tempo_local_user_data_owner ON public.user_data;
CREATE POLICY tempo_local_user_data_owner ON public.user_data
  FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
GRANT SELECT, INSERT, UPDATE ON public.user_data TO authenticated;
-- For local Supabase GoTrue-created test users, no data is preloaded or copied.
