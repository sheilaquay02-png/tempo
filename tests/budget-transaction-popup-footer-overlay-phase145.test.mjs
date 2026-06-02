import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const budgetApp = readFileSync(new URL("../components/budget/BudgetApp.jsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../styles/tempoStyles.js", import.meta.url), "utf8");

test("Phase 145 transaction popup renders through a document-level portal", () => {
  assert.match(budgetApp, /import \{ createPortal \} from "react-dom";/);
  const popupSource = budgetApp.slice(budgetApp.indexOf("function BudgetTransactionPopup"), budgetApp.indexOf("function EditableProfileCard"));
  assert.match(popupSource, /const popup = \(/);
  assert.match(popupSource, /createPortal\(popup, document\.body\)/);
});

test("Phase 145 transaction popup sits above the mobile footer and keeps confirm sticky", () => {
  const block = css.slice(css.lastIndexOf("Phase 145 transaction popup footer overlay fix"));
  assert.match(block, /\.budget-transaction-popup-overlay\{[\s\S]*?z-index:40000!important;[\s\S]*?inset:0 0 var\(--mobile-nav-h,78px\) 0!important;/);
  assert.match(block, /\.budget-transaction-popup-sheet\{[\s\S]*?height:calc\(100dvh - var\(--mobile-nav-h,78px\) - env\(safe-area-inset-top,0px\) - 6px\)!important;[\s\S]*?overflow:hidden!important;/);
  assert.match(block, /\.budget-transaction-popup-card\{[\s\S]*?overflow-y:auto!important;[\s\S]*?padding-bottom:calc\(184px \+ env\(safe-area-inset-bottom,0px\)\)!important;/);
  assert.match(block, /\.budget-popup-keypad\{[\s\S]*?position:sticky!important;[\s\S]*?bottom:0!important;/);
});
