-- Exercise the actual Phase 2 migration against a disposable PostgreSQL 16 database.
-- Two authenticated users, a real SQL migration, revision-checked RPC and RLS.
\set ON_ERROR_STOP on
set role authenticated;
set request.jwt.claim.sub = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

do $test$
declare
  seeded integer;
  r jsonb;
begin
  seeded := public.tempo_budget_seed_legacy();
  if seeded <> 1 then raise exception 'Expected one historical transaction, got %',seeded; end if;
  seeded := public.tempo_budget_seed_legacy();
  if seeded <> 0 then raise exception 'Historical seeding is not idempotent'; end if;
  if (select count(*) from public.tempo_budget_transactions
       where user_id=auth.uid() and transaction_id='legacy-1')<>1
  then raise exception 'Legacy expense missing after migration'; end if;

  r:=public.tempo_budget_apply(
   't-1','10000000-0000-4000-8000-000000000001',0,
   '{"id":"t-1","type":"expense","amount":8}'::jsonb,false);
  if r->>'status'<>'applied' or (r->>'revision')::integer<>1
  then raise exception 'Initial write failed: %',r; end if;

  -- Retrying a completed operation ID returns the original ACK with no duplication.
  r:=public.tempo_budget_apply(
   't-1','10000000-0000-4000-8000-000000000001',0,
   '{"id":"t-1","type":"expense","amount":8}'::jsonb,false);
  if r->>'status'<>'applied' or (r->>'revision')::integer<>1
  then raise exception 'Idempotent retry failed: %',r; end if;

  r:=public.tempo_budget_apply(
   't-2','10000000-0000-4000-8000-000000000002',0,
   '{"id":"t-2","type":"expense","amount":12}'::jsonb,false);
  if r->>'status'<>'applied' then raise exception 'Independent create failed'; end if;

  r:=public.tempo_budget_apply(
   't-1','10000000-0000-4000-8000-000000000003',1,
   '{"id":"t-1","type":"expense","amount":9}'::jsonb,false);
  if r->>'status'<>'applied' or (r->>'revision')::integer<>2
  then raise exception 'Valid revision update failed: %',r; end if;

  r:=public.tempo_budget_apply(
   't-1','10000000-0000-4000-8000-000000000004',1,
   '{"id":"t-1","type":"expense","amount":99}'::jsonb,false);
  if r->>'status'<>'conflict' or (r->>'revision')::integer<>2
  then raise exception 'Stale revision was not rejected: %',r; end if;

  r:=public.tempo_budget_apply(
   't-2','10000000-0000-4000-8000-000000000005',1,
   '{"id":"t-2","type":"expense","amount":12}'::jsonb,true);
  if r->>'status'<>'applied' or r->>'deleted'<>'true'
  then raise exception 'Tombstone failed: %',r; end if;

  r:=public.tempo_budget_apply(
   't-2','10000000-0000-4000-8000-000000000006',0,
   '{"id":"t-2","type":"expense","amount":12}'::jsonb,false);
  if r->>'status'<>'conflict' then raise exception 'Old client resurrected deleted transaction'; end if;
end $test$;

-- Authenticated clients can read but cannot bypass the revision-checked RPC.
do $test$
begin
  begin
    update public.tempo_budget_transactions
       set payload='{"id":"t-1","amount":999}'::jsonb
       where transaction_id='t-1';
    raise exception 'Direct DML bypassed transaction revision guard';
  exception when insufficient_privilege then null;
  end;
end $test$;

-- Switch to another test user and verify RLS and SEC DEFINER isolation.
set request.jwt.claim.sub = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
do $test$
declare
 r jsonb;
begin
 if (select count(*) from public.tempo_budget_transactions)<>0
 then raise exception 'User B can read User A financial records'; end if;
 r:=public.tempo_budget_apply(
  't-1','20000000-0000-4000-8000-000000000001',2,
  '{"id":"t-1","type":"expense","amount":999}'::jsonb,false);
 if r->>'status'<>'conflict' or (r->>'revision')::integer<>0
 then raise exception 'User B accessed or edited User A expense: %',r; end if;
 r:=public.tempo_budget_apply(
  't-b','20000000-0000-4000-8000-000000000002',0,
  '{"id":"t-b","type":"expense","amount":5}'::jsonb,false);
 if r->>'status'<>'applied'
 then raise exception 'User B could not write their own expense'; end if;
end $test$;

-- Verify that the operation table is not directly readable by authenticated clients.
do $test$
begin
  begin
    perform 1 from public.tempo_budget_operations limit 1;
    raise exception 'Operation journal is directly readable';
  exception when insufficient_privilege then null;
  end;
end $test$;

reset role;
do $test$
begin
 if (select count(*) from public.tempo_budget_transactions)<>4 then
   raise exception 'Expected four real SQL rows across two users; got %',
    (select count(*) from public.tempo_budget_transactions);
 end if;
 if (select count(*) from public.tempo_budget_operations)<>5 then
   raise exception 'Idempotent operation log count mismatch: %',
    (select count(*) from public.tempo_budget_operations);
 end if;
end $test$;
select 'Phase 2 PostgreSQL migration, RLS, CAS, retry and tombstone checks PASSED' as result;
