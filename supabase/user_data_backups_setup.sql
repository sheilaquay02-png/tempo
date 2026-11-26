-- Tempo: pinned, labelled backups of user_data (Phase 1, update 3).
--
-- Unlike user_data_history (automatic, rolling), rows here are kept until you
-- delete them by hand. Used to take a "before-google-cleanup" copy before the
-- hidden imported Google events are removed from saved data.
--
-- Safe to run more than once: the table and policy are created if missing, and
-- the snapshot is only taken if a backup with that label does not exist yet.

create table if not exists public.user_data_backups (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  label text not null,
  events jsonb,
  tasks jsonb,
  settings jsonb,
  row_updated_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.user_data_backups enable row level security;
drop policy if exists "Users can read their own backups" on public.user_data_backups;
create policy "Users can read their own backups"
  on public.user_data_backups for select
  using (auth.uid() = user_id);

insert into public.user_data_backups (user_id, label, events, tasks, settings, row_updated_at)
select u.user_id, 'before-google-cleanup', u.events, u.tasks, u.settings, u.updated_at
from public.user_data u
where not exists (
  select 1 from public.user_data_backups b
  where b.user_id = u.user_id and b.label = 'before-google-cleanup'
);

-- To restore this backup (run by hand):
--   update public.user_data u
--   set events = b.events, tasks = b.tasks, settings = b.settings, updated_at = now()
--   from public.user_data_backups b
--   where b.label = 'before-google-cleanup' and u.user_id = b.user_id;
