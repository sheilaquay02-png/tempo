import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../styles/tempoStyles.js", import.meta.url), "utf8");

test("Phase 145 account cards use fixed desktop and mobile grids", () => {
  assert.match(css, /Phase 145 account card grid consistency patch/);
  assert.match(css, /\.budget-account-card-grid\{\s*grid-template-columns:repeat\(5,minmax\(0,1fr\)\)!important;/);
  assert.match(css, /\.budget-account-card\{\s*width:100%;\s*height:154px;\s*min-height:154px;/);
  assert.match(css, /@media\(max-width:768px\)\{\s*\.budget-account-card-grid\{grid-template-columns:repeat\(3,minmax\(0,1fr\)\)!important;/);
});
