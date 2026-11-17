// Pure helpers shared by Today, event spending details, Mini and the full Budget UI.
// Estimates do not alter account balances or recorded spending.
export function normalizeSpendingPlan(plan) {
  if (!plan || typeof plan !== "object") return null;
  const raw = Number(plan.estimate);
  const estimate = Number.isFinite(raw) && raw >= 0 && plan.estimate !== "" && plan.estimate != null
    ? Math.round(raw * 100) / 100 : null;
  if (estimate === null) return null;
  return {
    estimate,
    ledgerId: typeof plan.ledgerId === "string" ? plan.ledgerId : "",
    bucketId: typeof plan.bucketId === "string" ? plan.bucketId : "",
  };
}

export function eventSpendingKey(event) {
  if (!event?.id) return "";
  // Occurrence identifiers are created by Tempo's recurrence expansion.
  return String(event.id);
}

export function expensesLinkedToEvent(transactions = [], event) {
  const key = eventSpendingKey(event);
  if (!key) return [];
  return transactions.filter(tx =>
    tx?.type === "expense" && tx.linkedEventId === key && !tx.deletedAt
  );
}

export function eventRecordedSpending(transactions = [], event) {
  return Math.round(expensesLinkedToEvent(transactions, event).reduce((sum, tx) => sum + Math.abs(Number(tx.amount) || 0), 0) * 100) / 100;
}

export function todayRecordedSpending(transactions = [], dayKey, { ledgerId = null } = {}) {
  return Math.round(transactions.reduce((sum, tx) => {
    if (tx?.type !== "expense" || tx.date !== dayKey || tx.deletedAt) return sum;
    if (ledgerId && tx.ledgerId !== ledgerId) return sum;
    return sum + Math.abs(Number(tx.amount) || 0);
  }, 0) * 100) / 100;
}

export function appendTransactionOnce(transactions = [], transaction) {
  if (!transaction?.id) throw new Error("A stable transaction ID is required.");
  if (transactions.some(tx => tx?.id === transaction.id)) return transactions;
  return [...transactions, transaction];
}

export function linkTransactionToEvent(transactions = [], transactionId, event) {
  const key = eventSpendingKey(event);
  if (!key) return transactions;
  return transactions.map(tx => tx.id === transactionId ? {
    ...tx,
    linkedEventId: key,
    updatedAt: new Date().toISOString(),
  } : tx);
}

export function unlinkTransactionFromEvent(transactions = [], transactionId, event) {
  const key = eventSpendingKey(event);
  return transactions.map(tx => tx.id === transactionId && tx.linkedEventId === key ? {
    ...tx,
    linkedEventId: "",
    updatedAt: new Date().toISOString(),
  } : tx);
}

export function activeBudgetDefaults({ accounts = [], ledgers = [], buckets = [], transactions = [] } = {}) {
  const lastExpense = [...transactions].filter(tx => tx?.type === "expense")
    .sort((a,b) => String(b.updatedAt || b.createdAt || "").localeCompare(String(a.updatedAt || a.createdAt || "")))[0];
  const ledgerId = ledgers.some(x => x.id === lastExpense?.ledgerId) ? lastExpense.ledgerId : (ledgers[0]?.id || "daily-ledger");
  const validBucket = buckets.find(x => x.id === lastExpense?.bucketId && x.ledgerId === ledgerId && x.cashFlowType === "expense")
    || buckets.find(x => x.ledgerId === ledgerId && x.cashFlowType === "expense");
  const accountId = accounts.some(x => x.id === lastExpense?.accountId)
    ? lastExpense.accountId : (validBucket?.accountId || accounts[0]?.id || "main-bank");
  return { ledgerId, bucketId: validBucket?.id || "", accountId };
}
