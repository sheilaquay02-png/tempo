-- Tempo: automatic version history for user_data (Phase 1, update 1).
--
-- When a user's saved row changes, the PREVIOUS version is copied into
-- public.user_data_history (at most one copy per 10 minutes, because Tempo
-- saves after every edit). Kept: the newest 20 copies plus the newest copy of
-- each of the last 14 days. Nothing in user_data itself is changed.
--
-- Safe to run more than once. Undo: supabase/user_data_history_undo.sql
--
-- Size: one copy is the size of the saved row (about 1 MB today, about
-- 0.5 MB after the hidden Google events are archived), so at most ~34 copies
-- take roughly 17-34 MB of the free plan's 500 MB.

create table if not exists public.user_data_history (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  events jsonb,
  tasks jsonb,
  settings jsonb,
  row_updated_at timestamptz,
  archived_at timestamptz not null default now(),
  reason text not null default 'update'
);

create index if not exists user_data_history_user_archived_idx
  on public.user_data_history (user_id, archived_at desc);

-- Users may READ their own history (for "Download my data" and restores).
-- There are deliberately no insert/update/delete policies: only the trigger
-- below (running as the table owner) writes here, so the app cannot alter or
-- erase history.
alter table public.user_data_history enable row level security;
drop policy if exists "Users can read their own data history" on public.user_data_history;
create policy "Users can read their own data history"
  on public.user_data_history for select
  using (auth.uid() = user_id);

create or replace function public.archive_user_data_version()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' then
    -- Skip saves that changed nothing.
    if old.events is not distinct from new.events
       and old.tasks is not distinct from new.tasks
       and old.settings is not distinct from new.settings then
      return new;
    end if;
    -- Tempo saves after every edit, so keep at most one copy per 10 minutes.
    if exists (
      select 1 from public.user_data_history
      where user_id = old.user_id and reason = 'update'
        and archived_at > now() - interval '10 minutes'
    ) then
      return new;
    end if;
  end if;

  insert into public.user_data_history (user_id, events, tasks, settings, row_updated_at, reason)
  values (old.user_id, old.events, old.tasks, old.settings, old.updated_at, lower(tg_op));

  -- Keep the newest 20 copies, plus the newest copy of each of the last 14 days.
  delete from public.user_data_history h
  where h.user_id = old.user_id
    and h.id not in (
      select id from (
        select id from public.user_data_history
        where user_id = old.user_id
        order by archived_at desc, id desc
        limit 20
      ) newest
      union
      select id from (
        select distinct on (archived_at::date) id
        from public.user_data_history
        where user_id = old.user_id and archived_at > now() - interval '14 days'
        order by archived_at::date, archived_at desc, id desc
      ) daily
    );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

revoke all on function public.archive_user_data_version() from public, anon, authenticated;

drop trigger if exists user_data_keep_history on public.user_data;
create trigger user_data_keep_history
  before update or delete on public.user_data
  for each row execute function public.archive_user_data_version();

comment on table public.user_data_history is
  'Previous versions of each user_data row (newest 20 + one per day for 14 days), written only by trigger user_data_keep_history.';

-- To restore a version (run by hand, after choosing an id from the history):
--   update public.user_data u
--   set events = h.events, tasks = h.tasks, settings = h.settings, updated_at = now()
--   from public.user_data_history h
--   where h.id = <ID> and u.user_id = h.user_id;
-- (The restore itself is archived too, so it can be undone the same way.)
