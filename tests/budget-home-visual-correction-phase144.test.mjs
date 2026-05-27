import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("budget home month and ledger controls match the corrected card layout", () => {
  const source = readFileSync("components/budget/BudgetApp.jsx", "utf8");
  assert.match(source, /homeMonthDate/);
  assert.match(source, /budget-home-month-switcher/);
  assert.match(source, /budget-home-toolbar-spacer/);
  assert.match(source, /changeHomeMonth\(-1\)/);
  assert.match(source, /changeHomeMonth\(1\)/);
  assert.match(source, /formatBudgetMoney\(incomeRecorded, currency\)/);
  assert.match(source, /formatBudgetMoney\(expenseRecorded, currency\)/);
  assert.match(source, /monthSummary\.bucketSpendById/);
  assert.match(source, /monthSummary\.bucketIncomeById/);
  assert.doesNotMatch(source, /budget-home-record-hint/);
  const homeSource = source.slice(source.indexOf("function BudgetHomePage"), source.indexOf("function BudgetTransactionForm"));
  assert.doesNotMatch(homeSource, /<BudgetMetrics summary=\{summary\} currency=\{currency\} \/>/);
  assert.doesNotMatch(homeSource, /budget-networth-card/);
});

test("budget home card grid is fixed to five desktop and three mobile columns", () => {
  const styles = readFileSync("styles/tempoStyles.js", "utf8");
  assert.match(styles, /budget-home-combined-card \.budget-home-category-grid[\s\S]*grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/);
  assert.match(styles, /budget-home-combined-card \.budget-home-category-grid[\s\S]*grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(styles, /budget-ledger-home-select[\s\S]*min-width:190px/);
  assert.match(styles, /budget-home-month-toolbar[\s\S]*grid-template-columns:minmax\(190px,240px\) minmax\(0,1fr\) minmax\(190px,240px\)/);
  assert.match(styles, /budget-account-networth-card[\s\S]*#C85A8A/);
});
