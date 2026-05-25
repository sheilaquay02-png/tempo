create table if not exists public.push_reminder_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  reminder_key text not null unique,
  reminder_type text not null,
  scheduled_for timestamptz not null,
  meta jsonb default '{}',
  sent_at timestamptz default now()
);

create unique index if not exists push_reminder_log_user_reminder_key_uidx
on public.push_reminder_log (user_id, reminder_key);

create index if not exists push_reminder_log_user_scheduled_idx
on public.push_reminder_log (user_id, scheduled_for desc);

create index if not exists push_reminder_log_type_scheduled_idx
on public.push_reminder_log (reminder_type, scheduled_for desc);

create index if not exists push_reminder_log_action_token_hash_idx
on public.push_reminder_log ((meta->>'actionTokenHash'))
where meta ? 'actionTokenHash';

create unique index if not exists push_reminder_log_action_token_hash_uidx
on public.push_reminder_log ((meta->>'actionTokenHash'))
where meta ? 'actionTokenHash' and nullif(meta->>'actionTokenHash', '') is not null;

alter table public.push_reminder_log enable row level security;

-- This table is server-only. It contains reminder action metadata and should not be
-- readable or writable directly from the browser. Next.js API routes use the
-- Supabase service role key, which bypasses RLS after validating request auth/tokens.
drop policy if exists "Users can view their own push reminder log" on public.push_reminder_log;
drop policy if exists "Users can manage their own push reminder log" on public.push_reminder_log;

comment on table public.push_reminder_log is
  'Server-only reminder/action log. RLS enabled; dedupe indexes prevent repeated sends/actions.';
