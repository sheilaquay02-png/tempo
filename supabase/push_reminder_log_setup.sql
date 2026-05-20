create table if not exists public.push_reminder_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  reminder_key text not null unique,
  reminder_type text not null,
  scheduled_for timestamptz not null,
  meta jsonb default '{}',
  sent_at timestamptz default now()
);

alter table public.push_reminder_log enable row level security;

drop policy if exists "Users can view their own push reminder log" on public.push_reminder_log;
create policy "Users can view their own push reminder log"
on public.push_reminder_log
for select
using (auth.uid() = user_id);
