import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../styles/tempoStyles.js", import.meta.url), "utf8");

test("Phase 145 uses balanced Budget Home footer clearance without excessive spacer", () => {
  assert.match(css, /Phase 145 mobile scroll \+ popup clipping correction/);
  const block = css.slice(css.lastIndexOf("Phase 145 mobile scroll + popup clipping correction"));
  assert.match(block, /\.budget-page\.budget-page-home\{[\s\S]*?padding-bottom:calc\(var\(--mobile-nav-h,78px\) \+ 28px\)!important;[\s\S]*?scroll-padding-bottom:calc\(var\(--mobile-nav-h,78px\) \+ 28px\)!important;/);
  assert.match(block, /\.budget-page\.budget-page-home::after\{[\s\S]*?display:none!important;[\s\S]*?min-height:0!important;/);
  assert.match(block, /\.budget-page\.budget-page-home > \*:last-child\{[\s\S]*?margin-bottom:0!important;/);
  assert.doesNotMatch(block, /\+ 176px/);
  assert.doesNotMatch(block, /\+ 132px/);
});

test("Phase 145 makes the mobile transaction popup a compact scrollable bottom sheet", () => {
  const block = css.slice(css.lastIndexOf("Phase 145 mobile scroll + popup clipping correction"));
  assert.match(block, /\.budget-transaction-popup-overlay\{[\s\S]*?overflow:hidden!important;/);
  assert.match(block, /\.budget-transaction-popup-sheet\{[\s\S]*?max-height:calc\(100dvh - env\(safe-area-inset-top,0px\) - 8px\)!important;[\s\S]*?overflow-y:auto!important;/);
  assert.match(block, /\.budget-transaction-popup-card \.budget-amount-stage\{[\s\S]*?min-height:116px!important;/);
  assert.match(block, /\.budget-popup-keypad button\{[\s\S]*?min-height:44px!important;/);
});
