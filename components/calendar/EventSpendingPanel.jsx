"use client";
import { useState } from "react";
import { expensesLinkedToEvent, eventRecordedSpending, normalizeSpendingPlan, eventSpendingKey } from "../../utils/miniTempoFinance";

export function SpendingPlanEditor({ value, onChange, ledgers = [], buckets = [] }) {
  const [open,setOpen] = useState(Boolean(value?.estimate != null));
  const plan = value || { estimate: "", ledgerId: "", bucketId: "" };
  const selectedLedger = plan.ledgerId || "";
  const expenseCards = buckets.filter(b => b.cashFlowType === "expense" && (!selectedLedger || b.ledgerId === selectedLedger));
  const update = changes => onChange?.({ ...plan, ...changes });
  return <section className="tempo-event-spending-plan" aria-label="Spending plan">
    <button type="button" className="tempo-event-spending-toggle" onClick={() => setOpen(v=>!v)} aria-expanded={open}>💳 Spending plan (optional) {open?"⌃":"⌄"}</button>
    {open && <div className="tempo-event-spending-editor">
      <label>One estimated total
        <input type="number" min="0" step="0.01" placeholder="No estimate" value={plan.estimate ?? ""} onChange={e => update({estimate:e.target.value})}/>
      </label>
      <label>Default ledger (optional)
        <select value={selectedLedger} onChange={e => update({ledgerId:e.target.value,bucketId:""})}>
          <option value="">No default</option>{ledgers.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}
        </select>
      </label>
      <label>Default Budget card (optional)
        <select value={plan.bucketId || ""} onChange={e=>{const b=buckets.find(x=>x.id===e.target.value);update({bucketId:e.target.value,ledgerId:b?.ledgerId||selectedLedger})}}>
          <option value="">No default</option>{expenseCards.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}
        </select>
      </label>
      <small>This estimate is for planning only. It never becomes a transaction.</small>
    </div>}
  </section>;
}

export function EventSpendingDetails({
  event, transactions=[], ledgers=[], buckets=[], onRecordExpense, onLink, onUnlink,
}) {
  const [showLinks,setShowLinks] = useState(false);
  const [selected,setSelected] = useState("");
  const plan=normalizeSpendingPlan(event?.spendingPlan);
  const linked=expensesLinkedToEvent(transactions,event);
  const actual=eventRecordedSpending(transactions,event);
  const available=transactions.filter(x=>x.type==="expense" && x.id && x.linkedEventId!==eventSpendingKey(event));
  const link=()=>{
    if(!selected)return;
    const target=transactions.find(t=>t.id===selected);
    if(target?.linkedEventId && !window.confirm("This transaction is linked to another event. Move it here?"))return;
    onLink?.(selected,event);
    setSelected("");
  };
  return <section className="tempo-event-spending-details" aria-label="Private event spending">
    <strong>💳 Spending</strong>
    <div className="tempo-event-spending-numbers">
      <div><small>Estimated</small><strong>{plan ? `S$${plan.estimate.toFixed(2)}` : "Not set"}</strong></div>
      <div><small>Recorded</small><strong>{`S$${actual.toFixed(2)}`}</strong></div>
    </div>
    {!!plan && <small>Default: {ledgers.find(l=>l.id===plan.ledgerId)?.name||"Any ledger"} · {buckets.find(b=>b.id===plan.bucketId)?.name||"Any card"}</small>}
    {linked.map(t=><div className="tempo-event-linked-row" key={t.id}>
      <div><strong>{t.description||"Expense"}</strong><small>{t.date} · {buckets.find(b=>b.id===t.bucketId)?.name||"No card"}</small></div>
      <strong>{`−S$${Math.abs(Number(t.amount)||0).toFixed(2)}`}</strong>
      <button type="button" onClick={()=>onUnlink?.(t.id,event)} aria-label={`Unlink ${t.description||"expense"}`}>Unlink</button>
    </div>)}
    <div className="tempo-event-spending-actions">
      <button type="button" onClick={()=>onRecordExpense?.(event)}>＋ Record expense</button>
      <button type="button" onClick={()=>setShowLinks(v=>!v)}>↗ Link existing</button>
    </div>
    {showLinks && <div className="tempo-event-spending-link">
      <select aria-label="Choose an existing expense" value={selected} onChange={e=>setSelected(e.target.value)}>
        <option value="">Select transaction</option>{available.map(t=><option value={t.id} key={t.id}>{t.date} · {t.description} · S$${Number(t.amount).toFixed(2)}{t.linkedEventId?" (linked)":""}</option>)}
      </select>
      <button type="button" disabled={!selected} onClick={link}>Link</button>
    </div>}
    <small>Private to Tempo. Linking does not create a new expense; deleting this event never deletes transactions.</small>
  </section>;
}
