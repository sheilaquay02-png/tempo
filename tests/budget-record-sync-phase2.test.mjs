import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  readBudgetJournal,writeBudgetJournal,diffBudgetTransactions,appendBudgetOperations,
  overlayPendingBudgetOperations,budgetRevisionMap,seedMissingLocalBudgetRecords,
  rebaseBudgetChanges,flushBudgetOperations,loadBudgetRows,BudgetSyncConflict,
  listBudgetConflicts,resolveBudgetConflict
} from "../lib/tempo/client/budgetRecordSync.js";

function memoryStorage() {
  const values=new Map();
  return {getItem:k=>values.get(k)??null,setItem:(k,v)=>{values.set(k,String(v));},_values:values};
}
function mockServer(initial=[]) {
  const records=new Map(initial.map(x=>[x.transaction_id,{...x}]));
  const responses=new Map();
  return {
    records,
    async rpc(name,p={}){
      if(name==="tempo_budget_seed_legacy")return {data:0,error:null};
      if(name!=="tempo_budget_apply")throw new Error(name);
      if(responses.has(p.p_operation_id))return {data:responses.get(p.p_operation_id),error:null};
      const old=records.get(p.p_transaction_id);
      const version=old?.revision??0;
      if(version!==p.p_expected_revision)return {data:{status:"conflict",id:p.p_transaction_id,revision:version,payload:old?.payload??null,deleted:Boolean(old?.deleted_at)},error:null};
      const next={transaction_id:p.p_transaction_id,payload:p.p_delete?old?.payload:p.p_payload,revision:version+1,deleted_at:p.p_delete?"2026-11-17T00:00:00Z":null};
      records.set(p.p_transaction_id,next);
      const data={status:"applied",id:p.p_transaction_id,revision:next.revision,payload:next.payload,deleted:Boolean(next.deleted_at)};
      responses.set(p.p_operation_id,data);
      return {data,error:null};
    },
    from(table){
      assert.equal(table,"tempo_budget_transactions");
      return {select(){return this;},eq(field,id){assert.equal(field,"user_id");assert.equal(id,"u");return this;},order(){return this;},async range(start,end){const data=[...records.values()].sort((a,b)=>a.transaction_id.localeCompare(b.transaction_id)).slice(start,end+1);return {data,error:null};}};
    }
  };
}
const tx=(id,amount)=>({id,type:"expense",amount,description:"Lunch",date:"2026-11-17"});
let op=0;const newId=()=>`00000000-0000-4000-8000-${String(++op).padStart(12,"0")}`;

test("two devices create different expenses without overwriting either",async()=>{
  const server=mockServer(),a=memoryStorage(),b=memoryStorage();
  for(const [storage,record] of [[a,tx("a",8)],[b,tx("b",12)]]){
    const journal=appendBudgetOperations(readBudgetJournal(storage,"u"),diffBudgetTransactions([],[record]),newId);
    writeBudgetJournal(storage,"u",journal);
  }
  await flushBudgetOperations(server,a,"u");
  await flushBudgetOperations(server,b,"u");
  assert.deepEqual(new Set([...server.records.keys()]),new Set(["a","b"]));
  assert.equal((await loadBudgetRows(server,"u")).length,2);
});

test("retry of acknowledged operation is idempotent after acknowledgement loss",async()=>{
  const server=mockServer(),storage=memoryStorage();
  const queue=appendBudgetOperations(readBudgetJournal(storage,"u"),diffBudgetTransactions([],[tx("a",8)]),newId);
  writeBudgetJournal(storage,"u",queue);
  const operation=queue.operations[0];
  await server.rpc("tempo_budget_apply",{
    p_operation_id:operation.operationId,p_transaction_id:"a",p_payload:operation.payload,p_expected_revision:0,p_delete:false
  });
  await flushBudgetOperations(server,storage,"u");
  assert.equal(server.records.get("a").revision,1);
  assert.equal(readBudgetJournal(storage,"u").operations.length,0);
});

test("editing the same revision causes visible conflict, preserving pending local operation",async()=>{
  const server=mockServer([{transaction_id:"a",payload:tx("a",10),revision:1,deleted_at:null}]);
  const one=memoryStorage(),two=memoryStorage();
  for(const [storage,value] of [[one,11],[two,12]]) {
    writeBudgetJournal(storage,"u",{revisions:{a:1},operations:[]});
    writeBudgetJournal(storage,"u",appendBudgetOperations(readBudgetJournal(storage,"u"),diffBudgetTransactions([tx("a",10)],[tx("a",value)]),newId));
  }
  await flushBudgetOperations(server,one,"u");
  await flushBudgetOperations(server,two,"u");
  const savedJournal=readBudgetJournal(two,"u");
  assert.equal(savedJournal.operations.length,1);
  assert.equal(listBudgetConflicts(savedJournal).length,1);
  assert.equal(listBudgetConflicts(savedJournal)[0].server.payload.amount,11);
  assert.equal(server.records.get("a").payload.amount,11);
});

test("tombstones prevent an old local cache from recreating deleted records",()=>{
  const rows=[{transaction_id:"a",payload:tx("a",10),revision:2,deleted_at:"2026-11-17T00:00:00Z"}];
  assert.deepEqual(seedMissingLocalBudgetRecords(rows,[tx("a",10)],{operations:[],revisions:{a:2}}).operations,[]);
  assert.deepEqual(overlayPendingBudgetOperations(rows),[]);
});

test("offline edits can be queued and replayed later without losing new writes",async()=>{
  const store=memoryStorage(),server=mockServer();
  let queue=appendBudgetOperations(readBudgetJournal(store,"u"),diffBudgetTransactions([],[tx("a",8)]),newId);
  queue=appendBudgetOperations(queue,diffBudgetTransactions([tx("a",8)],[tx("a",9)]),newId);
  writeBudgetJournal(store,"u",queue);
  assert.deepEqual(overlayPendingBudgetOperations([],queue.operations).map(x=>x.amount),[9]);
  await flushBudgetOperations(server,store,"u");
  assert.equal(server.records.get("a").payload.amount,9);
  assert.equal(server.records.get("a").revision,2);
});

test("rebase does not silently delete another window's unseen transaction",()=>{
  const original=[tx("a",5)];
  const desired=[tx("a",6)];
  const latest=[tx("a",5),tx("b",10)];
  const result=rebaseBudgetChanges(original,desired,latest);
  assert.deepEqual(result.transactions.map(x=>x.id),["a","b"]);
  assert.equal(result.transactions[0].amount,6);
  assert.throws(()=>rebaseBudgetChanges(original,desired,[tx("a",12)]),BudgetSyncConflict);
});

test("local storage quota errors fail before allowing the UI to claim save",()=>{
  const storage={getItem:()=>null,setItem(){throw Error("quota")}};
  assert.throws(()=>writeBudgetJournal(storage,"u",{operations:[],revisions:{}}),/quota/);
});

test("migration includes authenticated, RLS-protected seed and CAS operations",()=>{
  const sql=readFileSync("supabase/tempo_budget_records_phase2.sql","utf8");
  assert.match(sql,/enable row level security/);
  assert.match(sql,/auth\.uid\(\)/);
  assert.match(sql,/on conflict \(user_id,transaction_id\) do nothing/);
  assert.match(sql,/p_expected_revision/);
  assert.match(sql,/p_operation_id/);
  assert.match(sql,/tempo_budget_operations/);
  assert.match(sql,/pg_advisory_xact_lock/);
});

test("conflicted expense does not block unrelated expenses from another device",async()=>{
  const server=mockServer([{transaction_id:"shared",payload:tx("shared",70),revision:2,deleted_at:null}]);
  const store=memoryStorage();
  writeBudgetJournal(store,"u",{operations:[],revisions:{shared:1},conflicts:{}});
  const journal=appendBudgetOperations(readBudgetJournal(store,"u"),[
    {transactionId:"shared",payload:tx("shared",75),deleted:false},
    {transactionId:"unrelated",payload:tx("unrelated",3),deleted:false},
  ],newId);
  writeBudgetJournal(store,"u",journal);
  const result=await flushBudgetOperations(server,store,"u");
  assert.equal(result.operations.length,1);
  assert.equal(listBudgetConflicts(result).length,1);
  assert.equal(server.records.get("unrelated").payload.amount,3);
  assert.equal(server.records.get("shared").payload.amount,70);
});

test("review conflict: use cloud version without deleting unrelated pending edits",async()=>{
  const server=mockServer([{transaction_id:"shared",payload:tx("shared",12),revision:4,deleted_at:null}]);
  const storage=memoryStorage();
  const other=tx("other",5);
  writeBudgetJournal(storage,"u",appendBudgetOperations({operations:[],revisions:{shared:3},conflicts:{}},[
    {transactionId:"shared",payload:tx("shared",15),deleted:false},
    {transactionId:"other",payload:other,deleted:false},
  ],newId));
  await flushBudgetOperations(server,storage,"u");
  const conflict=readBudgetJournal(storage,"u");
  const {journal:resolved}=resolveBudgetConflict(conflict,"shared","server",newId);
  writeBudgetJournal(storage,"u",resolved);
  assert.equal(resolved.operations.some(op=>op.transactionId==="shared"),false);
  assert.equal(resolved.revisions.shared,4);
  assert.equal(listBudgetConflicts(readBudgetJournal(storage,"u")).length,0);
  assert.equal(server.records.get("shared").payload.amount,12);
  assert.equal(server.records.get("other").payload.amount,5);
});

test("review conflict: keep my version uses new revision and new operation ID",async()=>{
  const server=mockServer([{transaction_id:"shared",payload:tx("shared",12),revision:4,deleted_at:null}]);
  const storage=memoryStorage();
  const journal=appendBudgetOperations({operations:[],revisions:{shared:3},conflicts:{}},[
    {transactionId:"shared",payload:tx("shared",15),deleted:false},
  ],newId);
  writeBudgetJournal(storage,"u",journal);
  await flushBudgetOperations(server,storage,"u");
  const pending=readBudgetJournal(storage,"u");
  const previousOpId=pending.operations[0].operationId;
  const {journal:resolved}=resolveBudgetConflict(pending,"shared","local",newId);
  assert.equal(resolved.operations.length,1);
  assert.equal(resolved.operations[0].expectedRevision,4);
  assert.notEqual(resolved.operations[0].operationId,previousOpId);
  writeBudgetJournal(storage,"u",resolved);
  await flushBudgetOperations(server,storage,"u");
  assert.equal(server.records.get("shared").revision,5);
  assert.equal(server.records.get("shared").payload.amount,15);
});

test("review conflict: save my version as a new transaction leaves cloud version intact",async()=>{
  const server=mockServer([{transaction_id:"shared",payload:tx("shared",12),revision:4,deleted_at:null}]);
  const store=memoryStorage();
  writeBudgetJournal(store,"u",appendBudgetOperations({operations:[],revisions:{shared:3},conflicts:{}},[
    {transactionId:"shared",payload:tx("shared",15),deleted:false}
  ],newId));
  await flushBudgetOperations(server,store,"u");
  const {journal:resolved,copiedId}=resolveBudgetConflict(readBudgetJournal(store,"u"),"shared","copy",newId);
  assert.notEqual(copiedId,"shared");
  assert.equal(resolved.operations.length,1);
  assert.equal(resolved.operations[0].payload.id,copiedId);
  assert.equal(resolved.operations[0].expectedRevision,0);
  writeBudgetJournal(store,"u",resolved);
  await flushBudgetOperations(server,store,"u");
  assert.equal(server.records.get("shared").payload.amount,12);
  assert.equal(server.records.get(copiedId).payload.amount,15);
  assert.equal(server.records.size,2);
});

test("review conflict: refuse to copy a deleted local transaction or erase missing conflict",()=>{
  const journal={operations:[{transactionId:"x",operationId:newId(),expectedRevision:1,deleted:true,payload:tx("x",3)}],
    revisions:{x:1},conflicts:{x:{revision:2,payload:tx("x",4),deleted:false}}};
  assert.throws(()=>resolveBudgetConflict(journal,"x","copy",newId),/cannot be copied/);
  assert.throws(()=>resolveBudgetConflict(journal,"other","server",newId),/no longer pending/);
});

test("persisted conflicts are detected again after app restart",async()=>{
  const server=mockServer([{transaction_id:"x",payload:tx("x",7),revision:4,deleted_at:null}]);
  const storage=memoryStorage();
  writeBudgetJournal(storage,"u",appendBudgetOperations({operations:[],revisions:{x:3},conflicts:{}},[
    {transactionId:"x",payload:tx("x",9),deleted:false}
  ],newId));
  await flushBudgetOperations(server,storage,"u");
  // Simulate another tab reading the saved journal.
  assert.equal(listBudgetConflicts(readBudgetJournal(storage,"u")).length,1);
  const before=server.records.get("x").revision;
  await flushBudgetOperations(server,storage,"u");
  assert.equal(server.records.get("x").revision,before);
});

test("RPC schema disables direct authenticated DML and uses a safe SQL code block",()=>{
  const sql=readFileSync("supabase/tempo_budget_records_phase2.sql","utf8");
  assert.match(sql,/revoke all on public\.tempo_budget_transactions from authenticated/);
  assert.match(sql,/grant select on public\.tempo_budget_transactions to authenticated/);
  assert.match(sql,/security definer set search_path = ''/);
  assert.match(sql,/do \$tempo_sync\$\s*begin/);
  assert.match(sql,/end; \$tempo_sync\$;/);
});
