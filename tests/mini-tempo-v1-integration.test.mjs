import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { normalizeBudgetTransaction } from "../utils/budgetPlanUtils.js";

const file = name => readFileSync(name, "utf8");
const budget = file("components/budget/BudgetApp.jsx");
const app = file("components/TempoApp.jsx");
const eventModal = file("components/calendar/CalendarModals.jsx");
const eventSpending = file("components/calendar/EventSpendingPanel.jsx");
const mini = file("components/mini/MiniTempoPanel.jsx");
const desktop = file("desktop/main.cjs");
const preload = file("desktop/preload.cjs");

test("reuses the existing 4-column Budget keypad verbatim rather than creating a replacement", () => {
  assert.match(budget, /const keys = \["7", "8", "9", "backspace", "4", "5", "6", "clear", "1", "2", "3", "\.", currency, "0", "00", "save"\]/);
  assert.match(budget, /export function BudgetTransactionPopup/);
  assert.match(budget, /export function createEmptyTransactionForm/);
  assert.match(app, /<BudgetTransactionPopup form=\{expenseForm\}/);
  assert.match(budget, /onSaveAndAddAnother && <button className="mini-expense-save-next"/);
  assert.match(app, /expenseSaveLock\.current/);
});

test("event links survive transaction normalization without affecting old fields", () => {
  const txn = normalizeBudgetTransaction({ id:"tx-1",type:"expense",amount:22.5,ledgerId:"daily-ledger",bucketId:"food",linkedEventId:"event-1" });
  assert.equal(txn.id, "tx-1");
  assert.equal(txn.amount, 22.5);
  assert.equal(txn.linkedEventId, "event-1");
  assert.equal(normalizeBudgetTransaction({id:"tx-2",amount:3}).linkedEventId, "");
});

test("planned money is private to event detail modals, not Calendar cells", () => {
  assert.match(eventModal, /<SpendingPlanEditor/);
  assert.match(eventModal, /<EventSpendingDetails/);
  assert.match(eventSpending, /This estimate is for planning only/);
  assert.match(app, /onLinkTransaction=/);
  assert.doesNotMatch(file("components/calendar/CalendarViews.jsx"), /spendingPlan|linkedEventId|eventRecordedSpending/);
});

test("Mini and Recorder are distinct authenticated Tempo routes sharing the root app", () => {
  assert.match(file("app/mini/page.js"), /windowMode="mini"/);
  assert.match(file("app/recorder/page.js"), /windowMode="recorder"/);
  assert.match(app, /windowMode === "mini"/);
  assert.match(app, /windowMode === "recorder"/);
  assert.match(mini, /Today's tasks|Today&apos;s tasks/);
  assert.match(mini, /Spent today/);
  assert.match(mini, /Next event/);
});

test("desktop entrypoints parse, sandbox all windows and restrict navigation", () => {
  execFileSync(process.execPath,["--check","desktop/main.cjs"]);
  execFileSync(process.execPath,["--check","desktop/preload.cjs"]);
  for (const guard of ["nodeIntegration:false","contextIsolation:true","sandbox:true","webSecurity:true","setWindowOpenHandler","will-navigate","requestSingleInstanceLock"]) {
    assert.ok(desktop.includes(guard),guard);
  }
  assert.ok(!preload.includes("require(\"fs\")"));
  assert.match(preload,/contextBridge\.exposeInMainWorld\("tempoDesktop"/);
});
