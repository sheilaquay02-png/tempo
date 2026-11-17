// Mini Tempo's standalone recorder owns its own draft state.
// These helpers are intentionally independent of the existing Budget keypad.
const DRAFT_FIELDS = Object.freeze([
  "type","amount","date","description","notes","tags","accountId",
  "toAccountId","ledgerId","bucketId","excludedFromBudget","linkedEventId"
]);

export function isExpenseDraftDirty(draft, baseline) {
  if (!draft) return false;
  if (!baseline) return true; // Never discard a draft without knowing its initial state.
  return DRAFT_FIELDS.some(field =>
    String(draft[field] ?? "") !== String(baseline[field] ?? "")
  );
}

export function nextExpenseDraft(saved, newId) {
  if (!saved || typeof newId !== "string" || !newId) {
    throw new Error("A previous transaction and a new transaction ID are required.");
  }
  return {
    ...saved,
    id: newId,
    amount: "",
    description: "",
    notes: "",
    tags: "",
    excludedFromBudget: false
    // Preserve date, type, selected account, ledger, card and event occurrence.
  };
}
