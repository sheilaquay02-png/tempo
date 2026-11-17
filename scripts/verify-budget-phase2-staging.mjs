// Explicit opt-in staging integration checks. Never run against a production project.
// Requires a disposable Supabase project with the Phase 2 SQL already applied.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const required=[
  "TEMPO_STAGING_URL","TEMPO_STAGING_ANON_KEY",
  "TEMPO_STAGING_USER_A_EMAIL","TEMPO_STAGING_USER_A_PASSWORD",
  "TEMPO_STAGING_USER_B_EMAIL","TEMPO_STAGING_USER_B_PASSWORD",
];
if(process.env.TEMPO_STAGING_CONFIRM!=="I_AM_USING_A_DISPOSABLE_PROJECT") {
  throw new Error("Refusing to run. Set TEMPO_STAGING_CONFIRM=I_AM_USING_A_DISPOSABLE_PROJECT only for a separate disposable test database.");
}
for(const key of required)if(!process.env[key])throw new Error(`Missing staging-only environment variable ${key}`);
const url=new URL(process.env.TEMPO_STAGING_URL);
assert.equal(url.protocol,"https:","Only HTTPS staging projects allowed");
assert.ok(url.hostname.endsWith(".supabase.co"),"Expected a dedicated Supabase staging project");
if(process.env.NEXT_PUBLIC_SUPABASE_URL) {
  assert.notEqual(url.origin,new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin,
    "Staging project must not be the same as the app's currently configured Supabase project");
}
const client=()=>createClient(url.origin,process.env.TEMPO_STAGING_ANON_KEY,{
  auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}
});
const a=client(),a2=client(),b=client();
async function signIn(sb,email,password){
  const {data,error}=await sb.auth.signInWithPassword({email,password});
  if(error||!data?.user?.id)throw new Error("Test sign-in failed: "+(error?.message||"Unknown failure"));
  return data.user.id;
}
function sample(id,amount) {
  return {id,type:"expense",direction:"expense",amount,date:"2026-11-17",
    description:"Tempo Phase 2 staging test transaction",accountId:"main-bank",
    ledgerId:"daily-ledger",bucketId:"food",notes:"Temporary staging-only test"};
}
async function call(sb,id,expected,payload,deleted=false,operationId=randomUUID()){
  const {data,error}=await sb.rpc("tempo_budget_apply",{
    p_transaction_id:id,p_operation_id:operationId,
    p_expected_revision:expected,p_payload:payload,p_delete:deleted
  });
  if(error)throw error;
  return data;
}
async function ownRows(sb,id){
  const {data,error}=await sb.from("tempo_budget_transactions")
    .select("transaction_id,payload,revision,deleted_at").eq("transaction_id",id);
  if(error)throw error;
  return data||[];
}
const prefix="phase2-staging-"+randomUUID();
const ids=[prefix+"-a",prefix+"-b",prefix+"-shared"];
let tests=0;
const ok=(condition,message)=>{assert.ok(condition,message);tests++;process.stdout.write("PASS: "+message+"\n");};
async function cleanup(){
  for(const id of ids){
    try {
      const rows=await ownRows(a,id);
      const current=rows[0];
      if(current && !current.deleted_at)await call(a,id,current.revision,current.payload,true);
    }catch{ process.stderr.write("Warning: could not tombstone staging record "+id+"\n"); }
  }
}
try{
  const userA=await signIn(a,process.env.TEMPO_STAGING_USER_A_EMAIL,process.env.TEMPO_STAGING_USER_A_PASSWORD);
  const a2Id=await signIn(a2,process.env.TEMPO_STAGING_USER_A_EMAIL,process.env.TEMPO_STAGING_USER_A_PASSWORD);
  const userB=await signIn(b,process.env.TEMPO_STAGING_USER_B_EMAIL,process.env.TEMPO_STAGING_USER_B_PASSWORD);
  assert.equal(userA,a2Id,"Both windows must use the same test user");
  assert.notEqual(userA,userB,"RLS test requires two distinct users");
  for(const sb of [a,b]) {
    const {error}=await sb.rpc("tempo_budget_seed_legacy");
    if(error)throw error;
  }
  const operationId=randomUUID(),first=sample(ids[0],8);
  const created=await call(a,ids[0],0,first,false,operationId);
  assert.equal(created.status,"applied"); assert.equal(created.revision,1);
  const replay=await call(a,ids[0],0,first,false,operationId);
  ok(replay.status==="applied"&&replay.revision===1,"Retry with identical operation ID cannot duplicate a transaction");

  const [different,shared]=await Promise.all([
    call(a,ids[1],0,sample(ids[1],11)),
    call(a2,ids[2],0,sample(ids[2],20))
  ]);
  ok(different.status==="applied"&&shared.status==="applied","Concurrent creates for distinct IDs both persist");
  ok((await ownRows(a,ids[0])).length===1&&(await ownRows(a,ids[1])).length===1,
    "All created records are present after independent writes");

  const [edit1,edit2]=await Promise.all([
    call(a,ids[2],1,sample(ids[2],21)),
    call(a2,ids[2],1,sample(ids[2],22)),
  ]);
  ok([edit1.status,edit2.status].sort().join(",")==="applied,conflict",
    "Simultaneous edits of one record produce one success and one conflict");

  const stale=await call(a,ids[2],1,sample(ids[2],23));
  ok(stale.status==="conflict"&&stale.revision===2,
    "Stale revision cannot overwrite newer cloud changes");

  const outsiders=await ownRows(b,ids[0]);
  ok(outsiders.length===0,"User B cannot read User A's financial records");
  const attempt=await call(b,ids[0],1,sample(ids[0],999));
  ok(attempt.status==="conflict"&&attempt.revision===0,
    "User B cannot modify User A's transaction by supplying its ID");
  const untouched=(await ownRows(a,ids[0]))[0];
  ok(untouched.payload.amount===8,"Cross-account mutation attempt left User A's data unchanged");

  const direct=await a.from("tempo_budget_transactions")
    .update({payload:sample(ids[0],5000)}).eq("transaction_id",ids[0]);
  ok(Boolean(direct.error),"Direct table writes cannot bypass the revision-checked RPC");

  const deleted=await call(a,ids[1],1,sample(ids[1],11),true);
  ok(deleted.status==="applied"&&deleted.deleted&&deleted.revision===2,
    "Delete creates a revisioned tombstone");
  const resurrect=await call(a2,ids[1],0,sample(ids[1],11));
  ok(resurrect.status==="conflict","Old device cannot silently recreate a deleted transaction");

  process.stdout.write(`\n${tests} staging checks passed. Test data will be tombstoned.\n`);
}catch(error) {
  process.stderr.write("STAGING TEST FAILED: "+(error?.message||String(error))+"\n");
  process.exitCode=1;
}finally{
  await cleanup();
  for(const sb of [a,a2,b])await sb.auth.signOut().catch(()=>{});
}
