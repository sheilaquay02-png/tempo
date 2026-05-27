import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  calculateBudgetAccountBalances,
  calculateBudgetBucketSpending,
  calculateBudgetSummary,
  normalizeBudgetTransaction,
  normalizeBudgetTransactions,
} from "../utils/budgetPlanUtils.js";
import { BUDGET_TRANSACTION_TYPES, DEFAULT_BUDGET_ACCOUNTS, DEFAULT_BUDGET_BUCKETS, DEFAULT_BUDGET_PROFILE } from "../constants/budgetConstants.js";

const budgetApp = readFileSync(new URL("../components/budget/BudgetApp.jsx", import.meta.url), "utf8");
const tempoApp = readFileSync(new URL("../components/TempoApp.jsx", import.meta.url), "utf8");

test("Phase 143 supports expense, income, and transfer transaction normalization", () => {
  assert.deepEqual(BUDGET_TRANSACTION_TYPES, ["expense", "income", "transfer"]);
  const transactions = normalizeBudgetTransactions([
    { type: "expense", amount: "25.50", accountId: "main-bank", bucketId: "food", tags: "lunch, work" },
    { type: "income", amount: 100, accountId: "main-bank", description: "Returned money" },
    { type: "transfer", amount: 50, accountId: "main-bank", toAccountId: "australia-fund-account", bucketId: "food" },
  ]);
  assert.equal(transactions[0].type, "expense");
  assert.deepEqual(transactions[0].tags, ["lunch", "work"]);
  assert.equal(transactions[1].direction, "income");
  assert.equal(transactions[2].bucketId, "");
});

test("Phase 143 transactions affect account balances without counting transfers as spending", () => {
  const accounts = DEFAULT_BUDGET_ACCOUNTS.map(account => ({ ...account, balance: account.id === "main-bank" ? 1000 : 0 }));
  const transactions = normalizeBudgetTransactions([
    { type: "expense", amount: 80, accountId: "main-bank", bucketId: "food" },
    { type: "income", amount: 250, accountId: "main-bank" },
    { type: "transfer", amount: 100, accountId: "main-bank", toAccountId: "australia-fund-account" },
  ]);
  const balances = calculateBudgetAccountBalances(accounts, transactions);
  assert.equal(balances.find(account => account.id === "main-bank")?.currentBalance, 1070);
  assert.equal(balances.find(account => account.id === "australia-fund-account")?.currentBalance, 100);
  const summary = calculateBudgetSummary({ profile: DEFAULT_BUDGET_PROFILE, accounts, buckets: DEFAULT_BUDGET_BUCKETS, transactions });
  assert.equal(summary.expenseTotal, 80);
  assert.equal(summary.incomeTotal, 250);
  assert.equal(summary.transferTotal, 100);
  assert.equal(summary.monthlyBalance, 170);
});

test("Phase 143 bucket spending maps expenses to editable budget buckets", () => {
  const spending = calculateBudgetBucketSpending(DEFAULT_BUDGET_BUCKETS, [
    normalizeBudgetTransaction({ type: "expense", amount: 60, bucketId: "food" }),
    normalizeBudgetTransaction({ type: "expense", amount: 15, bucketId: "transport" }),
    normalizeBudgetTransaction({ type: "income", amount: 500, bucketId: "food" }),
  ]);
  assert.equal(spending.food, 60);
  assert.equal(spending.transport, 15);
});

test("Phase 143 UI wires transaction entry and persistence setter", () => {
  assert.match(budgetApp, /BudgetTransactionForm/);
  assert.match(budgetApp, /Record transaction/);
  assert.match(budgetApp, /onTransactionsChange/);
  assert.match(budgetApp, /calculateBudgetAccountBalances/);
  assert.match(budgetApp, /budget-calendar-real/);
  assert.match(budgetApp, /Record expense from Budget Home/);
  assert.match(budgetApp, /Record income from Budget Home/);
  assert.match(budgetApp, /openHomeTransaction/);
  assert.match(budgetApp, /showCancel/);
  assert.match(tempoApp, /const setBudgetTransactions = value =>/);
  assert.match(tempoApp, /onTransactionsChange=\{setBudgetTransactions\}/);
});
