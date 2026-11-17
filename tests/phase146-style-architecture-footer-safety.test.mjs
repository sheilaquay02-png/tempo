import { readFileSync } from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const tempoApp = readFileSync("components/TempoApp.jsx", "utf8");
const legacyStyles = readFileSync("styles/tempoLegacyInlineStyles.js", "utf8");
const safetyStyles = readFileSync("styles/tempoMobileFooterPopupSafety.js", "utf8");

test("Phase 146 removes the giant inline CSS append from TempoApp", () => {
  assert.doesNotMatch(tempoApp, /<style>\{memoAppCSS \+ `/);
  assert.match(tempoApp, /import \{ tempoLegacyInlineCSS \} from "\.\.\/styles\/tempoLegacyInlineStyles";/);
  assert.match(tempoApp, /import \{ tempoMobileFooterPopupSafetyCSS \} from "\.\.\/styles\/tempoMobileFooterPopupSafety";/);
  assert.match(tempoApp, /const memoAppCSS\s*=\s*appCSS\(cvars, fontScale\) \+ tempoLegacyInlineCSS \+ tempoMobileFooterPopupSafetyCSS \+ miniTempoCSS;/);
  assert.match(tempoApp, /<style>\{memoAppCSS\}<\/style>/);
});

test("Phase 146 keeps the extracted legacy CSS out of the component but still loaded", () => {
  assert.match(legacyStyles, /export const tempoLegacyInlineCSS = `/);
  assert.match(legacyStyles, /\.editable-chip\{/);
  assert.match(legacyStyles, /:root\{--mobile-nav-h:/);
  assert.match(legacyStyles, /\.mobile-nav\{/);
});

test("Phase 146 applies footer and popup safety after legacy styles", () => {
  assert.match(safetyStyles, /export const tempoMobileFooterPopupSafetyCSS = `/);
  assert.match(safetyStyles, /--tempo-footer-h:var\(--mobile-nav-h/);
  assert.match(safetyStyles, /\.budget-page\.budget-page-home\.phase-page\{[\s\S]*?padding-bottom:calc\(var\(--tempo-footer-clearance\) \+ 104px\)!important;/);
  assert.match(safetyStyles, /\.budget-page\.budget-page-home\.phase-page::after\{[\s\S]*?min-height:72px!important;/);
});

test("Phase 146 makes mobile transaction popup a no-scroll bottom sheet above the footer", () => {
  assert.match(safetyStyles, /\.budget-transaction-popup-overlay,\s*\.budget-card-editor-overlay\{[\s\S]*?inset:0 0 var\(--tempo-footer-h\) 0!important;[\s\S]*?height:calc\(100dvh - var\(--tempo-footer-h\)\)!important;/);
  assert.match(safetyStyles, /\.budget-transaction-popup-sheet\{[\s\S]*?overflow:hidden!important;[\s\S]*?display:flex!important;[\s\S]*?flex-direction:column!important;/);
  assert.match(safetyStyles, /\.budget-transaction-popup-card \.budget-transaction-form-grid\{[\s\S]*?order:20!important;/);
  assert.match(safetyStyles, /\.budget-popup-keypad\{[\s\S]*?position:static!important;[\s\S]*?order:30!important;[\s\S]*?transform:none!important;/);
});

test("Phase 146 keeps add-card editor save actions above the footer", () => {
  assert.match(safetyStyles, /\.budget-card-editor-sheet\{[\s\S]*?max-height:calc\(100dvh - var\(--tempo-footer-h\) - env\(safe-area-inset-top,0px\) - 8px\)!important;[\s\S]*?overflow-y:auto!important;/);
  assert.match(safetyStyles, /\.budget-card-editor-actions\{[\s\S]*?position:sticky!important;[\s\S]*?bottom:0!important;[\s\S]*?padding:10px 14px calc\(14px \+ env\(safe-area-inset-bottom,0px\)\)!important;/);
});
