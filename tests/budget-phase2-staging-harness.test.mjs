import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const script=readFileSync("scripts/verify-budget-phase2-staging.mjs","utf8");
const sql=readFileSync("supabase/tempo_budget_records_phase2.sql","utf8");

test("staging harness parses but is never part of default CI",()=>{
  execFileSync(process.execPath,["--check","scripts/verify-budget-phase2-staging.mjs"]);
  const pkg=JSON.parse(readFileSync("package.json","utf8"));
  assert.match(pkg.scripts["test:budget:staging"],/verify-budget-phase2-staging\.mjs/);
  assert.doesNotMatch(pkg.scripts.test,/staging/);
  assert.match(script,/TEMPO_STAGING_CONFIRM/);
  assert.match(script,/I_AM_USING_A_DISPOSABLE_PROJECT/);
  assert.match(script,/NEXT_PUBLIC_SUPABASE_URL/);
  assert.match(script,/TEMPO_STAGING_USER_B_EMAIL/);
  assert.match(script,/cleanup\(\)/);
  assert.match(script,/Direct table writes cannot bypass/);
});

test("staging migration is reversible without deleting legacy JSON history",()=>{
  assert.match(sql,/create table if not exists public\.tempo_budget_transactions/);
  assert.match(sql,/create table if not exists public\.tempo_budget_operations/);
  assert.match(sql,/on conflict \(user_id,transaction_id\) do nothing/);
  assert.match(sql,/revoke all on public\.tempo_budget_transactions from authenticated/);
  assert.doesNotMatch(sql,/drop table if exists public\.user_data|delete from public\.user_data|truncate public\.user_data/);
});
