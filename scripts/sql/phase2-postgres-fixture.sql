-- Disposable PostgreSQL stand-in for Supabase's auth roles and auth.uid().
-- This runs ONLY inside the fresh GitHub Actions PostgreSQL service container.
create role authenticated nologin;
create role anon nologin;
create schema auth;
create function auth.uid() returns uuid language sql stable as $func$
  select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid;
$func$;
create table auth.users (id uuid primary key);
insert into auth.users (id) values
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
create table public.user_data (
 user_id uuid primary key references auth.users(id),
 settings jsonb not null default '{}'::jsonb
);
insert into public.user_data(user_id,settings) values
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  '{"budgetTransactions":[{"id":"legacy-1","type":"expense","amount":7,"date":"2026-11-17"}]}'::jsonb),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  '{"budgetTransactions":[]}'::jsonb);
grant usage on schema public,auth to authenticated,anon;
grant execute on function auth.uid() to authenticated,anon;
