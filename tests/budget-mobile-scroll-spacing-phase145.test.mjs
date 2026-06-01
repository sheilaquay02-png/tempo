import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../styles/tempoStyles.js", import.meta.url), "utf8");

test("Phase 145 mobile Budget Home uses balanced footer clearance", () => {
  assert.match(css, /Phase 145 mobile scroll \+ popup clipping correction/);
  const block = css.slice(css.lastIndexOf("Phase 145 mobile scroll + popup clipping correction"));
  assert.match(block, /\.budget-page\.budget-page-home\{[\s\S]*?padding-bottom:calc\(var\(--mobile-nav-h,78px\) \+ 28px\)!important;/);
  assert.match(block, /scroll-padding-bottom:calc\(var\(--mobile-nav-h,78px\) \+ 28px\)!important;/);
  assert.match(block, /\.budget-page\.budget-page-home::after\{[\s\S]*?display:none!important;/);
});

test("Phase 145 sidebar mode switch has even spacing around the emoji switcher", () => {
  assert.match(css, /\.app-mode-switch\{[\s\S]*?margin:12px 12px 12px!important;/);
  assert.match(css, /@media\(max-width:768px\)\{[\s\S]*?\.app-mode-switch\{\s*margin:12px 10px 12px!important;/);
});
