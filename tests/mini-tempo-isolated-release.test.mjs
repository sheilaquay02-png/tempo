import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(p,"utf8");

test("Isolated Mini route keeps tasks/calendar and no finance action",()=>{
  const mini=read("components/mini/MiniTempoPanel.jsx");
  const app=read("components/TempoApp.jsx");
  const route=read("app/mini/page.js");
  assert.match(route,/windowMode="mini"/);
  assert.match(app,/windowMode === "mini"/);
  assert.match(app,/function addQuickTodayTask/);
  assert.match(app,/onToggleTask=\{toggleTask\}/);
  assert.match(mini,/Today&apos;s tasks/);
  assert.match(mini,/Next event/);
  assert.doesNotMatch(mini,/Record expense|Spent today|onExpense|offlineReady|Budget conflict/);
  assert.doesNotMatch(app,/budgetRecordSync|BudgetConflictReview|openExpenseRecorder/);
});

test("Legacy Full Tempo budget app is still referenced without database migration",()=>{
  const app=read("components/TempoApp.jsx");
  assert.match(app,/import \{ BudgetApp, OverallPage \}/);
  assert.match(app,/<BudgetApp activePage=\{budgetPage\}/);
  assert.doesNotMatch(app,/hydrateBudgetJournal|flushBudgetJournalNow/);
});

test("Mini CSS and desktop bridge do not provide a budgeting entrypoint",()=>{
  const css=read("styles/miniTempoReleaseStyles.js");
  const preload=read("desktop/preload.cjs");
  const electron=read("desktop/main.cjs");
  assert.match(css,/\.mini-tempo/);
  assert.doesNotMatch(css,/tempo-today-money|tempo-conflict-|mini-expense-/);
  assert.doesNotMatch(preload,/openExpense|expenseSaved|closeExpense/);
  assert.doesNotMatch(electron,/tempo:open-expense|Record Expense/);
});
