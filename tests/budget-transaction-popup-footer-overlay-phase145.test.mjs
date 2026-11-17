import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const budgetApp = readFileSync(new URL("../components/budget/BudgetApp.jsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../styles/tempoMobileFooterPopupSafety.js", import.meta.url), "utf8");

test("Phase 145 transaction popup renders through a document-level portal", () => {
  assert.match(budgetApp, /import \{ createPortal \} from "react-dom";/);
  const popupSource = budgetApp.slice(budgetApp.indexOf("function BudgetTransactionPopup"), budgetApp.indexOf("function EditableProfileCard"));
  assert.match(popupSource, /const popup = \(/);
  assert.match(popupSource, /createPortal\(popup, document\.body\)/);
});

test("Current mobile transaction popup stays safely above footer and keeps keypad accessible", () => {
  assert.match(css, /\.budget-transaction-popup-overlay,[\s\S]*?z-index:60000!important;/);
  assert.match(css, /inset:0 0 var\(--tempo-footer-h\) 0!important;/);
  assert.match(css, /\.budget-transaction-popup-sheet\{[\s\S]*?max-height:calc\(100dvh - var\(--tempo-footer-h\)/);
  assert.match(css, /\.budget-transaction-popup-card \.budget-transaction-form-grid\{[\s\S]*?order:20!important;/);
  assert.match(css, /\.budget-popup-keypad\{[\s\S]*?position:static!important;[\s\S]*?order:30!important;/);
});
