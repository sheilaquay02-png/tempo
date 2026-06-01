import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../styles/tempoStyles.js", import.meta.url), "utf8");

test("Phase 145 mobile budget pages can scroll past the fixed footer", () => {
  assert.match(css, /Phase 145 mobile scroll\/menu spacing patch/);
  assert.match(css, /\.budget-page,\s*\.budget-page-home\{\s*padding-bottom:calc\(var\(--mobile-nav-h,78px\) \+ 128px\)!important;/s);
  assert.match(css, /scroll-padding-bottom:calc\(var\(--mobile-nav-h,78px\) \+ 128px\)!important;/);
});

test("Phase 145 sidebar mode switch has even spacing around the emoji switcher", () => {
  assert.match(css, /\.app-mode-switch\{[\s\S]*?margin:12px 12px 12px;/);
  assert.match(css, /@media\(max-width:768px\)\{[\s\S]*?\.app-mode-switch\{\s*margin:12px 10px 12px!important;/);
});
