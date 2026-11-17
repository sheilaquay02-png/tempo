// Record-level Budget sync. The legacy settings snapshot is retained as a non-authoritative
// compatibility/backup copy. Never use snapshot timestamps to overwrite the ledger.
const PREFIX = "tempo_budget_record_v2_";
export const budgetRecordStorageKey = userId => PREFIX + String(userId || "");
export const isBudgetRecordSyncReady = userId => {
  if (typeof localStorage === "undefined" || !userId) return false;
  try { return localStorage.getItem(budgetRecordStorageKey(userId) + "_ready") === "yes"; } catch { return false; }
};
export const markBudgetRecordSyncReady = userId => {
  if (!userId || typeof localStorage === "undefined") return;
  localStorage.setItem(budgetRecordStorageKey(userId) + "_ready","yes");
};
export function readBudgetJournal(storage, userId) {
  const raw = storage.getItem(budgetRecordStorageKey(userId));
  if (!raw) return { operations: [], revisions: {} };
  const value = JSON.parse(raw);
  if (!value || !Array.isArray(value.operations) || typeof value.revisions !== "object" || !value.revisions) {
    throw new Error("Budget offline queue is unreadable. Do not overwrite it.");
  }
  if (value.operations.some(op => !op?.operationId || !op?.transactionId ||
    !Number.isInteger(op.expectedRevision) || op.expectedRevision < 0)) {
    throw new Error("Budget offline queue contains invalid records; manual recovery required.");
  }
  return value;
}
export function writeBudgetJournal(storage,userId,journal) {
  // Synchronous and checked: if storage quota fails, caller must NOT commit the UI mutation.
  if (!userId) throw new Error("Sign in before recording transactions.");
  storage.setItem(budgetRecordStorageKey(userId),JSON.stringify(journal));
}
export function budgetRecordsToTransactions(rows) {
  return rows.filter(row => !row.deleted_at).map(row => row.payload);
}
export function overlayPendingBudgetOperations(rows,operations=[]) {
  const map=new Map(rows.filter(row=>!row.deleted_at).map(row=>[row.transaction_id,row.payload]));
  for(const op of operations){
    if(op.deleted)map.delete(op.transactionId);
    else map.set(op.transactionId,op.payload);
  }
  return [...map.values()];
}
export function budgetRevisionMap(rows) {
  return Object.fromEntries(rows.map(row=>[row.transaction_id,Number(row.revision)]));
}
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value==="object") return Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonical(value[k])]));
  return value;
}
export function diffBudgetTransactions(before,after) {
  const past=new Map(before.map(tx=>[tx.id,tx]));
  const next=new Map(after.map(tx=>[tx.id,tx]));
  if(next.size!==after.length || past.size!==before.length) throw new Error("Duplicate transaction IDs detected.");
  const changes=[];
  for(const [id,tx] of next){
    if(!id)throw new Error("Budget transaction ID cannot be empty.");
    const old=past.get(id);
    if(!old || JSON.stringify(canonical(old))!==JSON.stringify(canonical(tx))){
      changes.push({ transactionId:id, payload:tx, deleted:false });
    }
  }
  for(const [id,tx] of past) if(!next.has(id)) changes.push({transactionId:id,payload:tx,deleted:true});
  return changes;
}
export function rebaseBudgetChanges(original,desired,latest) {
  const changes=diffBudgetTransactions(original,desired);
  const base=new Map(original.map(tx=>[tx.id,tx]));
  const now=new Map(latest.map(tx=>[tx.id,tx]));
  for(const change of changes) {
    const originalTx=base.get(change.transactionId);
    const current=now.get(change.transactionId);
    if(originalTx && JSON.stringify(canonical(originalTx))!==JSON.stringify(canonical(current))) {
      throw new BudgetSyncConflict(change.transactionId,current||null);
    }
    if(!originalTx && current) throw new BudgetSyncConflict(change.transactionId,current);
    if(change.deleted)now.delete(change.transactionId);
    else now.set(change.transactionId,change.payload);
  }
  return {changes,transactions:[...now.values()]};
}

export async function hydrateBudgetJournal(userId,rows,localTransactions,storage=localStorage) {
  return withBudgetJournalLock(userId,async()=>{
    const journal=readBudgetJournal(storage,userId);
    const withRevisions={...journal,revisions:{...journal.revisions,...budgetRevisionMap(rows)}};
    const seeded=seedMissingLocalBudgetRecords(rows,localTransactions,withRevisions);
    writeBudgetJournal(storage,userId,seeded);
    return overlayPendingBudgetOperations(rows,seeded.operations);
  });
}

export function appendBudgetOperations(journal,changes,idFactory=()=>crypto.randomUUID()) {
  const operations=[...journal.operations];
  for(const change of changes){
    const prior=[...operations].reverse().find(op=>op.transactionId===change.transactionId);
    const expectedRevision=prior ? prior.expectedRevision+1 : (journal.revisions[change.transactionId]??0);
    operations.push({...change,expectedRevision,operationId:idFactory()});
  }
  return {...journal,operations};
}
export function seedMissingLocalBudgetRecords(rows, localTransactions, journal, idFactory=()=>crypto.randomUUID()) {
  const seen=new Set(rows.map(x=>x.transaction_id));
  journal.operations.forEach(op=>seen.add(op.transactionId));
  const changes=localTransactions.filter(tx=>tx?.id && !seen.has(tx.id))
    .map(tx=>({ transactionId:tx.id, payload:tx, deleted:false }));
  return appendBudgetOperations(journal,changes,idFactory);
}
export class BudgetSyncConflict extends Error {
  constructor(transactionId,current) {
    super("A newer version of this expense exists on another device. Your local change was kept for review.");
    this.name="BudgetSyncConflict";this.transactionId=transactionId;this.server=current;
  }
}
export async function loadBudgetRows(sb,userId) {
  if(!userId)throw new Error("Authenticated user ID required for Budget sync.");
  const {error:seedError}=await sb.rpc("tempo_budget_seed_legacy");
  if(seedError)throw seedError;
  const rows=[];
  for(let offset=0;;offset+=500){
    const {data,error}=await sb.from("tempo_budget_transactions")
      .select("transaction_id,payload,revision,deleted_at,updated_at")
      .eq("user_id",userId)
      .order("transaction_id",{ascending:true}).range(offset,offset+499);
    if(error)throw error;
    rows.push(...(data||[]));
    if(!data || data.length<500)break;
  }
  return rows;
}
export async function flushBudgetOperations(sb,storage,userId,onProgress=()=>{}) {
  if(!userId) throw new Error("Sign in before syncing Budget.");
  let journal=readBudgetJournal(storage,userId);
  while(journal.operations.length) {
    const operation=journal.operations[0];
    const {data,error}=await sb.rpc("tempo_budget_apply",{
      p_transaction_id:operation.transactionId,
      p_operation_id:operation.operationId,
      p_expected_revision:operation.expectedRevision,
      p_payload:operation.payload,
      p_delete:operation.deleted,
    });
    if(error)throw error;
    if(data?.status==="conflict")throw new BudgetSyncConflict(operation.transactionId,data);
    if(data?.status!=="applied" || data.id!==operation.transactionId || !Number.isInteger(data.revision)){
      throw new Error("Unrecognised Budget sync acknowledgment; local queue has been preserved.");
    }
    // Clear only the acknowledged operation and retain any newly enqueued records.
    const latest=readBudgetJournal(storage,userId);
    if(latest.operations[0]?.operationId !== operation.operationId) {
      throw new Error("Budget queue changed during sync. Retry after refreshing.");
    }
    journal={
      ...latest,
      operations:latest.operations.slice(1),
      revisions:{...latest.revisions,[operation.transactionId]:data.revision}
    };
    writeBudgetJournal(storage,userId,journal);
    onProgress(journal);
  }
  return journal;
}
export async function withBudgetJournalLock(userId,action) {
  if (typeof navigator==="undefined" || !navigator.locks?.request) {
    // Never allow concurrent same-device writes when the browser lacks LockManager.
    throw new Error("Secure financial editing requires a browser with Web Locks support.");
  }
  return navigator.locks.request("tempo-budget-journal-"+userId,{mode:"exclusive"},action);
}
