// Integration tests against a disposable *local* Supabase CLI stack only.
// Refuses ANY hosted Supabase URL and cannot connect to the user's production project.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import {
  readBudgetJournal, writeBudgetJournal, appendBudgetOperations,
  diffBudgetTransactions, flushBudgetOperations, listBudgetConflicts,
} from "../lib/tempo/client/budgetRecordSync.js";

const rawUrl = process.env.TEMPO_LOCAL_SUPABASE_URL || "";
const apiKey = process.env.TEMPO_LOCAL_ANON_KEY || "";
if (process.env.TEMPO_LOCAL_TEST_CONFIRM !== "DISPOSABLE_LOCAL_ONLY") {
  throw new Error("Refusing test: set TEMPO_LOCAL_TEST_CONFIRM=DISPOSABLE_LOCAL_ONLY");
}
const url = new URL(rawUrl);
if (url.protocol !== "http:" || !["127.0.0.1", "localhost"].includes(url.hostname) ||
    url.port !== "54321" || url.pathname !== "/" || url.search || url.hash || !apiKey) {
  throw new Error("Refusing test: only http://127.0.0.1:54321 with a local API key is permitted.");
}
const endpoint = url.origin;
const options = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };
const client = () => createClient(endpoint, apiKey, options);
const a = client(), a2 = client(), b = client(), anonymous = client();
const runId = randomUUID();
const userEmail = suffix => `tempo-${runId}-${suffix}@example.com`;
const fakePassword = `T!empo-${randomUUID()}-2026`;
const tx = (id, amount) => ({
  id, type: "expense", direction: "expense", date: "2026-11-17", amount,
  description: "Synthetic Tempo local integration expense",
  accountId: "main-bank", ledgerId: "daily-ledger", bucketId: "food",
  notes: "No real financial or personal data",
});
const ids = {
  legacy: `legacy-${runId}`,
  first: `first-${runId}`,
  second: `second-${runId}`,
  shared: `shared-${runId}`,
  offline: `offline-${runId}`,
  realtime: `realtime-${runId}`,
};
let count = 0;
function pass(message) { count++; process.stdout.write(`PASS ${String(count).padStart(2,"0")} — ${message}\n`); }
function requireOk(result, label) {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data;
}
async function signup(sb, email) {
  const data = requireOk(await sb.auth.signUp({ email, password: fakePassword }), "Local Auth signup");
  if (!data.user?.id) throw new Error("Local test user was not created.");
  if (!data.session) {
    throw new Error("Local Auth did not return a session. Check local config: email confirmations must be disabled.");
  }
  return data.user.id;
}
async function login(sb, email) {
  const data = requireOk(await sb.auth.signInWithPassword({email, password:fakePassword}), "Local Auth login");
  if (!data.session?.access_token) throw new Error("No session after local sign-in.");
  return data.user.id;
}
async function call(sb, id, revision, amount, operationId=randomUUID(), deleted=false) {
  return requireOk(await sb.rpc("tempo_budget_apply", {
    p_transaction_id:id,
    p_operation_id:operationId,
    p_expected_revision:revision,
    p_payload:tx(id,amount),
    p_delete:deleted
  }), "Budget revision RPC");
}
async function rows(sb,id) {
  return requireOk(await sb.from("tempo_budget_transactions")
    .select("transaction_id,payload,revision,deleted_at")
    .eq("transaction_id",id), "Read Budget record");
}
function storage() {
  const values=new Map();
  return {
    getItem:k=>values.get(k)??null,
    setItem:(k,v)=>values.set(k,String(v)),
  };
}
async function testRealtime(userId) {
  const channel = a.channel(`tempo-local-test-${runId}`);
  let onEvent;
  const received = new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(new Error("Local Supabase Realtime did not deliver the transaction insert.")),18000);
    onEvent=payload=>{
      if (payload?.new?.transaction_id===ids.realtime) {
        clearTimeout(timer);
        resolve(payload);
      }
    };
  });
  channel.on("postgres_changes",{
    event:"INSERT",schema:"public",table:"tempo_budget_transactions",filter:`user_id=eq.${userId}`
  },payload=>onEvent?.(payload));
  try {
    await new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>reject(new Error("Local Supabase Realtime subscription timed out.")),18000);
      channel.subscribe(status=>{
        if(status==="SUBSCRIBED"){clearTimeout(timer);resolve();}
        else if(status==="CHANNEL_ERROR"||status==="TIMED_OUT"){clearTimeout(timer);reject(new Error(`Realtime subscription: ${status}`));}
      });
    });
    const saved=await call(a2,ids.realtime,0,6);
    assert.equal(saved.status,"applied");
    await received;
    pass("Local Supabase Realtime delivered a per-record update");
  }finally {await a.removeChannel(channel);}
}
try {
  const emailA = userEmail("a"), emailB = userEmail("b");
  const userA = await signup(a,emailA);
  assert.equal(await login(a2,emailA),userA,"Second window must authenticate as the same user");
  const userB = await signup(b,emailB);
  assert.notEqual(userA,userB,"Must create two distinct test users");
  pass("Local Auth created two isolated test accounts and signed in a second window");

  const settings = {budgetTransactions:[tx(ids.legacy,7)]};
  requireOk(await a.from("user_data").insert({user_id:userA,settings}),"Insert fake legacy Budget snapshot");
  const initial = requireOk(await a.rpc("tempo_budget_seed_legacy"),"Legacy snapshot migration");
  assert.equal(initial,1);
  const second = requireOk(await a.rpc("tempo_budget_seed_legacy"),"Repeat legacy migration");
  assert.equal(second,0);
  assert.equal((await rows(a,ids.legacy)).length,1);
  pass("Migrated fake historical transactions exactly once without deleting the legacy snapshot");

  const createId=randomUUID();
  const first=await call(a,ids.first,0,8,createId);
  assert.equal(first.status,"applied");assert.equal(first.revision,1);
  const replay=await call(a2,ids.first,0,8,createId);
  assert.equal(replay.status,"applied");assert.equal(replay.revision,1);
  assert.equal((await rows(a,ids.first)).length,1);
  pass("Idempotent replay across two authenticated windows inserted one record");

  const [one,two]=await Promise.all([
    call(a,ids.second,0,11),
    call(a2,ids.shared,0,20)
  ]);
  assert.equal(one.status,"applied");assert.equal(two.status,"applied");
  assert.equal((await rows(a,ids.second))[0].payload.amount,11);
  assert.equal((await rows(a,ids.shared))[0].payload.amount,20);
  pass("Concurrent writes of different expenses both persisted");

  const [editA,editB]=await Promise.all([
    call(a,ids.shared,1,21),
    call(a2,ids.shared,1,22),
  ]);
  assert.deepEqual([editA.status,editB.status].sort(),["applied","conflict"]);
  assert.equal((await rows(a,ids.shared))[0].revision,2);
  pass("Simultaneous edits to one expense produced a revision conflict");

  assert.equal((await rows(b,ids.first)).length,0);
  const cross=await call(b,ids.first,1,999);
  assert.equal(cross.status,"conflict");assert.equal(cross.revision,0);
  assert.equal((await rows(a,ids.first))[0].payload.amount,8);
  pass("Authenticated user B cannot read or change user A's expense");

  const unauthorized = await anonymous.rpc("tempo_budget_seed_legacy");
  assert.ok(unauthorized.error,"Public/anonymous callers must not invoke migration RPC");
  const attempted = await a.from("tempo_budget_transactions")
    .update({payload:tx(ids.first,9999)}).eq("transaction_id",ids.first);
  assert.ok(attempted.error,"Client cannot bypass revision-checked Budget RPC with direct UPDATE");
  pass("Anonymous RPC and authenticated direct writes are denied");

  const tombstone=await call(a,ids.second,1,11,randomUUID(),true);
  assert.equal(tombstone.status,"applied");assert.equal(tombstone.deleted,true);
  const stale=await call(a2,ids.second,0,11);
  assert.equal(stale.status,"conflict");
  pass("Deleted expenses retain tombstones and stale writes cannot resurrect them");

  const offline=storage();
  const journal=appendBudgetOperations(readBudgetJournal(offline,userA),
    diffBudgetTransactions([],[tx(ids.offline,4)]));
  writeBudgetJournal(offline,userA,journal);
  assert.equal(readBudgetJournal(offline,userA).operations.length,1);
  const remaining=await flushBudgetOperations(a2,offline,userA);
  assert.equal(remaining.operations.length,0);
  assert.equal((await rows(a,ids.offline))[0].payload.amount,4);
  assert.equal(listBudgetConflicts(remaining).length,0);
  pass("Offline operation journal replayed to real local Supabase REST/RPC");

  await testRealtime(userA);
  await a.auth.signOut();
  const afterLogout=await rows(a,ids.first);
  assert.equal(afterLogout.length,0);
  pass("Signing out removes access to the previous account's records");

  process.stdout.write(`\nSUCCESS: ${count} end-to-end local Supabase checks passed.\n`);
} finally {
  await Promise.allSettled([a.auth.signOut(),a2.auth.signOut(),b.auth.signOut(),anonymous.auth.signOut()]);
}
