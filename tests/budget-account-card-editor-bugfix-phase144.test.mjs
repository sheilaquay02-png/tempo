import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("account edit popup syncs draft when account opens", () => {
  const source = readFileSync("components/budget/BudgetApp.jsx", "utf8");
  assert.match(source, /import \{ useEffect, useMemo, useState \} from "react";/);
  assert.match(source, /function AccountEditPopup/);
  assert.match(source, /useEffect\(\(\) => \{\s*setDraft\(account \? \{ \.\.\.account \} : null\);\s*\}, \[account\]\);/s);
});

test("budget home has card add and edit controls per selected ledger", () => {
  const source = readFileSync("components/budget/BudgetApp.jsx", "utf8");
  assert.match(source, /function BudgetCardEditorPopup/);
  assert.match(source, /function BudgetCardTile/);
  assert.match(source, /openCardEditor\("expense"\)/);
  assert.match(source, /openCardEditor\("income"\)/);
  assert.match(source, /onEdit=\{\(\) => openCardEditor\("expense", bucket\)\}/);
  assert.match(source, /onEdit=\{\(\) => openCardEditor\("income", bucket\)\}/);
  assert.match(source, /onBucketsChange=\{onBucketsChange\}/);
});

test("budget card editor styles are included", () => {
  const source = readFileSync("styles/tempoStyles.js", "utf8");
  assert.match(source, /budget-card-editor-overlay/);
  assert.match(source, /budget-home-card-edit/);
  assert.match(source, /budget-card-add-button/);
});
