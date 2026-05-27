import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DEFAULT_BUDGET_BUCKETS, DEFAULT_BUDGET_PROFILE } from "../constants/budgetConstants.js";
import { calculateBudgetSummary, normalizeBudgetAccounts, normalizeBudgetBuckets, normalizeBudgetLedgers } from "../utils/budgetPlanUtils.js";

const tempoApp = readFileSync(new URL("../components/TempoApp.jsx", import.meta.url), "utf8");
const appShell = readFileSync(new URL("../components/layout/AppShell.jsx", import.meta.url), "utf8");
const budgetApp = readFileSync(new URL("../components/budget/BudgetApp.jsx", import.meta.url), "utf8");
const core = readFileSync(new URL("../lib/tempo/core.js", import.meta.url), "utf8");

test("Budget V1 defaults match pasted allocation and stay editable", () => {
  const buckets = normalizeBudgetBuckets(DEFAULT_BUDGET_BUCKETS);
  const summary = calculateBudgetSummary({ profile: DEFAULT_BUDGET_PROFILE, buckets });
  assert.equal(DEFAULT_BUDGET_PROFILE.monthlyIncome, 3198.5);
  assert.equal(summary.allocated, 3198.5);
  assert.equal(summary.remaining, 0);
  assert.equal(buckets.find(bucket => bucket.id === "australia-fund")?.monthlyAmount, 1075);
  assert.equal(buckets.find(bucket => bucket.id === "entertainment-travel-photography")?.monthlyAmount, 663.5);
  assert.equal(buckets.find(bucket => bucket.id === "side-business-fund")?.monthlyAmount, 50);
  assert.equal(buckets.find(bucket => bucket.id === "australia-fund")?.isProtected, true);
  assert.equal(buckets.find(bucket => bucket.id === "investments")?.isProtected, true);
});

test("Budget foundation includes multiple accounts and ledgers", () => {
  const accounts = normalizeBudgetAccounts();
  const ledgers = normalizeBudgetLedgers();
  assert.ok(accounts.length >= 5);
  assert.equal(ledgers.length, 3);
  assert.ok(accounts.some(account => account.type === "investment"));
  assert.ok(accounts.some(account => account.includeInAustraliaReady));
  assert.deepEqual(ledgers.map(ledger => ledger.id), ["daily-ledger", "travel-ledger", "business-ledger"]);
});

test("Budget/Schedule/Overall shell is wired into TempoApp", () => {
  assert.match(appShell, /export function AppModeSwitch/);
  assert.match(appShell, /schedule/);
  assert.match(appShell, /budget/);
  assert.match(appShell, /overall/);
  assert.match(tempoApp, /import \{ BudgetApp, OverallPage \}/);
  assert.match(tempoApp, /appMode === "budget"/);
  assert.match(tempoApp, /appMode === "overall"/);
  assert.match(tempoApp, /_budget_profile/);
  assert.match(tempoApp, /_budget_accounts/);
  assert.match(tempoApp, /_budget_buckets/);
});

test("Budget UI exposes editable accounts, ledgers, and bucket rows", () => {
  assert.match(budgetApp, /BudgetAccountPage/);
  assert.match(budgetApp, /BudgetAccountPage/);
  assert.match(budgetApp, /BucketsPanel/);
  assert.match(budgetApp, /Daily, Travel, and Business cards/);
  assert.match(budgetApp, /onProfileChange/);
  assert.match(budgetApp, /onAccountsChange/);
  assert.match(budgetApp, /onBucketsChange/);
});

test("local data detection includes budget-only data", () => {
  assert.match(core, /_budget_profile/);
  assert.match(core, /_budget_accounts/);
  assert.match(core, /_budget_buckets/);
});
