import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DEFAULT_BUDGET_BUCKETS, DEFAULT_BUDGET_PROFILE } from "../constants/budgetConstants.js";
import { calculateBudgetSummary, normalizeBudgetBuckets } from "../utils/budgetPlanUtils.js";

const budgetApp = readFileSync("components/budget/BudgetApp.jsx", "utf8");
const styles = readFileSync("styles/tempoStyles.js", "utf8");

test("Phase 145 budget page uses dedicated BudgetPlanPage with month and ledger controls", () => {
  assert.match(budgetApp, /function BudgetPlanPage/);
  assert.match(budgetApp, /planMonthDate/);
  assert.match(budgetApp, /changePlanMonth\(-1\)/);
  assert.match(budgetApp, /changePlanMonth\(1\)/);
  assert.match(budgetApp, /Choose budget plan ledger/);
  assert.match(budgetApp, /BudgetPlanBucketCard/);
  assert.match(budgetApp, /budgetMonthProgress/);
  assert.match(budgetApp, /budgetPaceMeta/);
});

test("Phase 145 plan page tracks allocated, unallocated, protected, and spending pace", () => {
  assert.match(budgetApp, /Overallocated/);
  assert.match(budgetApp, /Unallocated/);
  assert.match(budgetApp, /Protected/);
  assert.match(budgetApp, /Too fast/);
  assert.match(budgetApp, /On track/);
  assert.match(budgetApp, /Exceeded/);
  assert.match(budgetApp, /budget-plan-progress/);
  assert.match(budgetApp, /spending pace/);
});

test("Phase 145 budget page still keeps Budget V1 allocation balanced by default", () => {
  const summary = calculateBudgetSummary({ profile: DEFAULT_BUDGET_PROFILE, buckets: normalizeBudgetBuckets(DEFAULT_BUDGET_BUCKETS) });
  assert.equal(summary.monthlyIncome, 3198.5);
  assert.equal(summary.allocated, 3198.5);
  assert.equal(summary.remaining, 0);
  assert.equal(summary.protectedMonthly, 1475);
});

test("Phase 145 styles include plan grid, progress bars, and mobile layout", () => {
  assert.match(styles, /budget-plan-header-card/);
  assert.match(styles, /budget-plan-summary-grid/);
  assert.match(styles, /budget-plan-card-grid/);
  assert.match(styles, /budget-plan-bucket-card/);
  assert.match(styles, /budget-plan-progress/);
  assert.match(styles, /@media\(max-width:768px\)[\s\S]*budget-plan-card-grid/);
});
