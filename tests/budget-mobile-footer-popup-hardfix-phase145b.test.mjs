import { readFileSync } from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const budgetApp = readFileSync("components/budget/BudgetApp.jsx", "utf8");
const styles = readFileSync("styles/tempoStyles.js", "utf8");

test("Phase 145B renders transaction and card editors through body portals", () => {
  assert.match(budgetApp, /import \{ createPortal \} from "react-dom";/);
  assert.match(budgetApp, /BudgetTransactionPopup[\s\S]*?return typeof document !== "undefined" \? createPortal\(popup, document\.body\) : popup;/);
  assert.match(budgetApp, /BudgetCardEditorPopup[\s\S]*?return typeof document !== "undefined" \? createPortal\(popup, document\.body\) : popup;/);
});

test("Phase 145B keeps mobile sheets above the footer nav", () => {
  const block = styles.match(/Phase 145B hard mobile footer boundary \+ popup layout fix[\s\S]*?`; \}/)?.[0] || styles;
  assert.match(block, /\.budget-page\.budget-page-home\{[\s\S]*?padding-bottom:calc\(var\(--mobile-nav-h,78px\) \+ 92px\)!important;[\s\S]*?scroll-padding-bottom:calc\(var\(--mobile-nav-h,78px\) \+ 92px\)!important;/);
  assert.match(block, /\.budget-transaction-popup-overlay,\s*\.budget-card-editor-overlay\{[\s\S]*?inset:0 0 var\(--mobile-nav-h,78px\) 0!important;[\s\S]*?height:calc\(100dvh - var\(--mobile-nav-h,78px\)\)!important;/);
  assert.match(block, /\.budget-card-editor-sheet\{[\s\S]*?max-height:calc\(100dvh - var\(--mobile-nav-h,78px\) - env\(safe-area-inset-top,0px\) - 8px\)!important;/);
  assert.match(block, /\.budget-card-editor-actions\{[\s\S]*?position:sticky!important;[\s\S]*?bottom:0!important;/);
});

test("Phase 145B places popup selections before the calculator without sticky overlap", () => {
  const block = styles.match(/Phase 145B hard mobile footer boundary \+ popup layout fix[\s\S]*?`; \}/)?.[0] || styles;
  assert.match(block, /\.budget-transaction-popup-sheet\{[\s\S]*?height:auto!important;[\s\S]*?overflow:hidden!important;/);
  assert.match(block, /\.budget-transaction-popup-card \.budget-transaction-form-grid\{[\s\S]*?order:20!important;/);
  assert.match(block, /\.budget-popup-keypad\{[\s\S]*?position:static!important;[\s\S]*?order:21!important;[\s\S]*?box-shadow:none!important;/);
  assert.doesNotMatch(block, /\.budget-popup-keypad\{[\s\S]{0,180}?position:sticky!important;/);
});
