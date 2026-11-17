-- Mini Tempo Phase 2: per-record Budget storage. NOT executed by merging this PR.
-- Apply separately in a controlled Supabase migration after a database backup.
-- No existing user_data, settings, or historical Budget transactions are deleted.
create table if not exists public.tempo_budget_transactions (
  user_id uuid not null references auth.users(id) on delete cascade,
  transaction_id text not null check (length(transaction_id) between 1 and 256),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  revision bigint not null default 1 check (revision > 0),
  deleted_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, transaction_id)
);
create table if not exists public.tempo_budget_operations (
  user_id uuid not null references auth.users(id) on delete cascade,
  operation_id uuid not null,
  transaction_id text not null,
  response jsonb not null,
  created_at timestamptz not null default now(),
  primary key (user_id, operation_id)
);
create index if not exists tempo_budget_tx_recent_idx
on public.tempo_budget_transactions (user_id, updated_at desc);
alter table public.tempo_budget_transactions enable row level security;
alter table public.tempo_budget_operations enable row level security;
drop policy if exists tempo_budget_tx_owner on public.tempo_budget_transactions;
create policy tempo_budget_tx_owner on public.tempo_budget_transactions
  for all to authenticated using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
drop policy if exists tempo_budget_op_owner on public.tempo_budget_operations;
create policy tempo_budget_op_owner on public.tempo_budget_operations
  for all to authenticated using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
revoke all on public.tempo_budget_transactions from public, anon;
revoke all on public.tempo_budget_operations from public, anon;
grant select, insert, update on public.tempo_budget_transactions to authenticated;
grant select, insert on public.tempo_budget_operations to authenticated;

-- Import historical snapshot entries once per unique transaction ID. Re-running is
-- safe, including after a transaction was tombstoned in the new table.
create or replace function public.tempo_budget_seed_legacy()
returns integer language plpgsql security invoker set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_snapshot jsonb;
  v_count integer;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  perform pg_advisory_xact_lock(hashtextextended(v_user::text, 12821));
  select settings->'budgetTransactions' into v_snapshot
    from public.user_data where user_id = v_user for update;
  if jsonb_typeof(v_snapshot) is distinct from 'array' then return 0; end if;
  with legacy as (
    select item from jsonb_array_elements(v_snapshot) as t(item)
    where jsonb_typeof(item) = 'object'
      and length(coalesce(item->>'id','')) between 1 and 256
  )
  insert into public.tempo_budget_transactions (user_id,transaction_id,payload,revision,deleted_at)
  select v_user, item->>'id', item, 1,
    case when nullif(item->>'deletedAt','') is not null then now() else null end
  from legacy
  on conflict (user_id,transaction_id) do nothing;
  get diagnostics v_count = row_count;
  return v_count;
end; $$;

-- Single-record compare-and-swap; every success/retry has a stable operation ID.
-- A stale update receives status=conflict and the current server record.
create or replace function public.tempo_budget_apply(
  p_transaction_id text,
  p_operation_id uuid,
  p_expected_revision bigint,
  p_payload jsonb,
  p_delete boolean default false
) returns jsonb language plpgsql security invoker set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_record public.tempo_budget_transactions%rowtype;
  v_previous jsonb;
  v_response jsonb;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if p_operation_id is null then raise exception 'Operation ID required'; end if;
  if p_transaction_id is null or length(p_transaction_id) not between 1 and 256 then
    raise exception 'Invalid transaction ID';
  end if;
  if p_expected_revision is null or p_expected_revision < 0 then
    raise exception 'Expected revision required (0 for create)';
  end if;
  if not p_delete and (
    jsonb_typeof(p_payload) is distinct from 'object' or
    p_payload->>'id' is distinct from p_transaction_id or
    length(p_payload::text) > 32768
  ) then raise exception 'Invalid transaction payload'; end if;

  -- Serialises records + dedupe operations for this user in a SQL transaction.
  perform pg_advisory_xact_lock(hashtextextended(v_user::text, 12821));
  select response into v_previous from public.tempo_budget_operations
    where user_id=v_user and operation_id=p_operation_id;
  if v_previous is not null then return v_previous; end if;

  select * into v_record from public.tempo_budget_transactions
    where user_id=v_user and transaction_id=p_transaction_id for update;

  if found then
    if p_expected_revision <> v_record.revision then
      return jsonb_build_object('status','conflict','id',p_transaction_id,
        'revision',v_record.revision,'payload',v_record.payload,'deleted',v_record.deleted_at is not null);
    end if;
    update public.tempo_budget_transactions set
      payload=case when p_delete then payload else p_payload end,
      revision=revision+1,
      deleted_at=case when p_delete then now() else null end,
      updated_at=now()
    where user_id=v_user and transaction_id=p_transaction_id
    returning * into v_record;
  elsif p_expected_revision = 0 and not p_delete then
    insert into public.tempo_budget_transactions (user_id,transaction_id,payload,revision)
    values (v_user,p_transaction_id,p_payload,1)
    returning * into v_record;
  else
    return jsonb_build_object('status','conflict','id',p_transaction_id,
      'revision',0,'payload',null,'deleted',true);
  end if;

  v_response=jsonb_build_object('status','applied','id',p_transaction_id,
    'revision',v_record.revision,'payload',v_record.payload,'deleted',v_record.deleted_at is not null);
  insert into public.tempo_budget_operations(user_id,operation_id,transaction_id,response)
  values(v_user,p_operation_id,p_transaction_id,v_response);
  return v_response;
end; $$;
revoke all on function public.tempo_budget_seed_legacy() from public;
revoke all on function public.tempo_budget_apply(text,uuid,bigint,jsonb,boolean) from public;
grant execute on function public.tempo_budget_seed_legacy() to authenticated;
grant execute on function public.tempo_budget_apply(text,uuid,bigint,jsonb,boolean) to authenticated;

-- Enable immediate remote updates when the project's publication is available.
-- RLS still limits row visibility to its owning authenticated user.
do $
begin
  if exists (select 1 from pg_publication where pubname='supabase_realtime') and
     not exists (select 1 from pg_publication_tables
       where pubname='supabase_realtime' and schemaname='public' and tablename='tempo_budget_transactions')
  then
    execute 'alter publication supabase_realtime add table public.tempo_budget_transactions';
  end if;
end; $;

comment on table public.tempo_budget_transactions is
  'Phase 2 authoritative financial records; legacy settings snapshot retained for backup.';
