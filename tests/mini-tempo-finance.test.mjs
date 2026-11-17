import test from "node:test";
import assert from "node:assert/strict";
import { normalizeSpendingPlan, expensesLinkedToEvent, eventRecordedSpending, todayRecordedSpending, appendTransactionOnce, linkTransactionToEvent, unlinkTransactionFromEvent, activeBudgetDefaults } from "../utils/miniTempoFinance.js";

test("single event estimates never become recorded spending", () => {
  assert.deepEqual(normalizeSpendingPlan({ estimate: "50", ledgerId: "daily-ledger", bucketId: "food" }), { estimate: 50, ledgerId: "daily-ledger", bucketId: "food" });
  assert.equal(normalizeSpendingPlan({ estimate: "" }), null);
  assert.equal(normalizeSpendingPlan({ estimate: -2 }), null);
  assert.equal(eventRecordedSpending([], { id: "e1", spendingPlan: { estimate: 50 } }), 0);
});

test("linked spending counts only expenses for the specific event", () => {
  const tx = [
    { id: "1", type: "expense", amount: 47, linkedEventId: "e1", date: "2026-11-17" },
    { id: "2", type: "expense", amount: 8, linkedEventId: "e1", date: "2026-11-17" },
    { id: "3", type: "income", amount: 100, linkedEventId: "e1", date: "2026-11-17" },
    { id: "4", type: "expense", amount: 9, linkedEventId: "e2", date: "2026-11-17" },
  ];
  assert.equal(expensesLinkedToEvent(tx, { id: "e1" }).length, 2);
  assert.equal(eventRecordedSpending(tx, { id: "e1" }), 55);
  assert.equal(todayRecordedSpending(tx, "2026-11-17"), 64);
  assert.equal(todayRecordedSpending(tx, "2026-11-18"), 0);
});

test("transaction writes are idempotent; linking never creates or deletes financial entries", () => {
  const tx = { id: "txn-1", type: "expense", amount: 30 };
  const first = appendTransactionOnce([], tx);
  assert.equal(appendTransactionOnce(first, tx), first);
  const linked = linkTransactionToEvent(first, tx.id, { id: "event-1" });
  assert.equal(linked.length, 1);
  assert.equal(linked[0].linkedEventId, "event-1");
  const unlinked = unlinkTransactionFromEvent(linked, tx.id, { id: "event-1" });
  assert.equal(unlinked.length, 1);
  assert.equal(unlinked[0].amount, 30);
  assert.equal(unlinked[0].linkedEventId, "");
});

test("defaults select an existing matching ledger/card/account", () => {
  const options = {
    ledgers: [{ id: "daily-ledger" }],
    accounts: [{ id: "main-bank" }],
    buckets: [{ id: "food", ledgerId: "daily-ledger", accountId: "main-bank", cashFlowType: "expense" }],
    transactions: [{ type: "expense", ledgerId: "deleted-ledger", bucketId: "deleted", accountId: "deleted", updatedAt: "2026-11-17" }],
  };
  assert.deepEqual(activeBudgetDefaults(options), { ledgerId: "daily-ledger", bucketId: "food", accountId: "main-bank" });
});
