import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { BUDGET_ACCOUNT_TYPES, DEFAULT_BUDGET_ACCOUNTS } from "../constants/budgetConstants.js";
import { calculateBudgetAccountBalances, normalizeBudgetAccount } from "../utils/budgetPlanUtils.js";

const budgetApp = readFileSync(new URL("../components/budget/BudgetApp.jsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../styles/tempoStyles.js", import.meta.url), "utf8");

test("Phase 144 account page follows the account overview/detail skeleton", () => {
  assert.match(budgetApp, /function BudgetAccountPage/);
  assert.match(budgetApp, /budget-account-networth-card/);
  assert.match(budgetApp, /budget-account-card-grid/);
  assert.match(budgetApp, /AccountDetailView/);
  assert.match(budgetApp, /AccountEditPopup/);
  assert.match(budgetApp, /AccountAddSheet/);
  assert.match(budgetApp, /budget-account-transfer-fab/);
  assert.match(budgetApp, /Add Account/);
});

test("Phase 144 account types cover debit, credit, borrow, and invest skeleton groups", () => {
  for (const type of ["debit", "credit", "borrowed", "stock", "fund", "crypto", "real_estate", "wallet"]) {
    assert.ok(BUDGET_ACCOUNT_TYPES.includes(type), `${type} account type should be available`);
  }
  const account = normalizeBudgetAccount({ name: "Hidden wallet", type: "wallet", icon: "👛", hideBalance: true, chartColor: "#abc" });
  assert.equal(account.type, "wallet");
  assert.equal(account.icon, "👛");
  assert.equal(account.hideBalance, true);
  assert.equal(account.chartColor, "#abc");
});

test("Phase 144 account page styling includes mobile card/detail sheets", () => {
  assert.match(css, /budget-account-card/);
  assert.match(css, /budget-account-detail-card/);
  assert.match(css, /budget-account-sheet-overlay/);
  assert.match(css, /budget-account-edit-sheet/);
});

test("Phase 144 account balances still use Phase 143 transaction math", () => {
  const accounts = DEFAULT_BUDGET_ACCOUNTS.map(account => ({ ...account, balance: account.id === "main-bank" ? 1000 : 0 }));
  const balanced = calculateBudgetAccountBalances(accounts, [
    { type: "expense", amount: 20, accountId: "main-bank" },
    { type: "income", amount: 100, accountId: "main-bank" },
    { type: "transfer", amount: 50, accountId: "main-bank", toAccountId: "australia-fund-account" },
  ]);
  assert.equal(balanced.find(account => account.id === "main-bank")?.currentBalance, 1030);
  assert.equal(balanced.find(account => account.id === "australia-fund-account")?.currentBalance, 50);
});
