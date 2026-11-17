"use client";

// Only opens after the user asks to review a detected financial conflict.
// It never automatically overwrites either copy of a transaction.
function TransactionSummary({ record, deleted, currency }) {
  if (deleted || !record) return <p className="tempo-conflict-deleted">Deleted on this device</p>;
  const amount=Number(record.amount);
  const formatted=Number.isFinite(amount)
    ? new Intl.NumberFormat("en-SG",{style:"currency",currency}).format(Math.abs(amount))
    : "Amount unavailable";
  return <div className="tempo-conflict-tx">
    <strong>{record.description || record.type || "Transaction"}</strong>
    <span>{formatted} · {record.date || "Date not set"}</span>
    <small>{record.type || "expense"} · Account: {record.accountId || "Not set"}</small>
  </div>;
}

export function BudgetConflictReview({ conflicts=[], currency="SGD", resolving=false, onResolve, onClose }) {
  return <div className="modal-overlay tempo-conflict-overlay" role="presentation">
    <section className="tempo-conflict-dialog" role="dialog" aria-modal="true" aria-labelledby="tempo-conflict-title">
      <div className="tempo-conflict-header">
        <div>
          <h2 id="tempo-conflict-title">Review Budget changes</h2>
          <p>Another device changed {conflicts.length===1?"a transaction":"some transactions"} while Tempo was syncing. Nothing has been discarded.</p>
        </div>
        <button type="button" aria-label="Close conflict review" disabled={resolving} onClick={onClose}>✕</button>
      </div>
      {conflicts.length===0 ? <p>There are no unresolved Budget conflicts.</p> : conflicts.map(({transactionId,local,server}) => <article className="tempo-conflict-card" key={transactionId}>
        <strong>Transaction conflict</strong>
        <div className="tempo-conflict-versions">
          <div><small>Saved on this device</small><TransactionSummary record={local?.payload} deleted={local?.deleted} currency={currency}/></div>
          <div><small>Latest cloud version</small><TransactionSummary record={server?.payload} deleted={server?.deleted} currency={currency}/></div>
        </div>
        <p>Choose carefully. Keeping your local version will replace the cloud version. Saving a separate copy may increase your recorded spending.</p>
        <div className="tempo-conflict-actions">
          <button type="button" disabled={resolving} onClick={()=>onResolve?.(transactionId,"server")}>Use cloud version</button>
          <button type="button" disabled={resolving} onClick={()=>onResolve?.(transactionId,"local")}>Keep my version</button>
          {!local?.deleted && <button type="button" disabled={resolving} onClick={()=>onResolve?.(transactionId,"copy")}>Save as a separate transaction</button>}
        </div>
      </article>)}
      <div className="tempo-conflict-footer">
        <span>{conflicts.length} unresolved</span>
        <button type="button" onClick={onClose} disabled={resolving}>Review later</button>
      </div>
    </section>
  </div>;
}
