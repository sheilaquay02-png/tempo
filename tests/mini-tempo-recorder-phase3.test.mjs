import test from "node:test";
import assert from "node:assert/strict";
import {isExpenseDraftDirty,nextExpenseDraft} from "../utils/miniTempoRecorder.js";

const original={
  id:"tx-old",type:"expense",amount:"",description:"",notes:"",tags:"",
  date:"2026-11-17",accountId:"bank",ledgerId:"daily",bucketId:"food",
  linkedEventId:"recurrence-occurrence-9",excludedFromBudget:false
};

test("untouched recorders close without a discard prompt",()=>{
  assert.equal(isExpenseDraftDirty({...original},original),false);
  assert.equal(isExpenseDraftDirty(null,original),false);
});

test("editing amount, note, tags, card or date triggers discard protection",()=>{
  for(const update of [
    {amount:"2.50"},{notes:"birthday dinner"},{tags:"friends"},
    {description:"taxi"},{date:"2026-11-18"},{bucketId:"other"},
    {type:"income"},{excludedFromBudget:true}
  ]) assert.equal(isExpenseDraftDirty({...original,...update},original),true,JSON.stringify(update));
});

test("missing draft baseline fails closed instead of silently discarding",()=>{
  assert.equal(isExpenseDraftDirty(original,null),true);
});

test("Save & Add Another retains budget context and linked event but resets content",()=>{
  const saved={...original,amount:"47.30",notes:"taxi",tags:"Grab",description:"Travel",excludedFromBudget:true};
  const next=nextExpenseDraft(saved,"tx-new");
  assert.equal(next.id,"tx-new");
  assert.deepEqual(
    ["amount","description","notes","tags"].map(x=>next[x]),
    ["","","",""]
  );
  assert.equal(next.excludedFromBudget,false);
  for(const key of ["date","type","accountId","ledgerId","bucketId","linkedEventId"])
    assert.equal(next[key],saved[key],key);
  assert.notEqual(saved.amount,next.amount);
  assert.equal(isExpenseDraftDirty({...next},next),false);
});
