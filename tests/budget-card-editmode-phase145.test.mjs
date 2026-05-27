import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("Phase 145 home and account cards support long-press edit mode", () => {
  const source = readFileSync("components/budget/BudgetApp.jsx", "utf8");
  assert.match(source, /function useBudgetLongPress/);
  assert.match(source, /delay = 3000/);
  assert.match(source, /homeCardEditMode/);
  assert.match(source, /accountCardEditMode/);
  assert.match(source, /budget-card-edit-controls/);
  assert.match(source, /moveBudgetItem/);
  assert.match(source, /quickDeleteCard/);
  assert.match(source, /quickDeleteAccount/);
});

test("Phase 145 mobile home income cards stay three per row", () => {
  const source = readFileSync("styles/tempoStyles.js", "utf8");
  assert.match(source, /budget-home-combined-card \.budget-home-category-grid\.compact\{\s*grid-template-columns:repeat\(3,minmax\(0,1fr\)\)!important;/s);
});

test("Phase 145 edit mode styles expose delete and move controls", () => {
  const source = readFileSync("styles/tempoStyles.js", "utf8");
  assert.match(source, /Phase 145 Home\/account long-press edit mode patch/);
  assert.match(source, /budget-card-edit-controls button\.danger/);
  assert.match(source, /budget-account-card-main/);
});
