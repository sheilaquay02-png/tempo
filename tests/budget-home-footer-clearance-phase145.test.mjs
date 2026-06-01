import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../styles/tempoStyles.js", import.meta.url), "utf8");

test("Phase 145 hard fix gives Budget Home a footer-safe mobile scroll spacer", () => {
  assert.match(css, /Phase 145 mobile Budget Home footer clearance hard fix/);
  assert.match(css, /\.budget-page\.budget-page-home\{[\s\S]*?overflow-y:auto!important;[\s\S]*?padding-bottom:calc\(var\(--mobile-nav-h,86px\) \+ env\(safe-area-inset-bottom\) \+ 176px\)!important;[\s\S]*?scroll-padding-bottom:calc\(var\(--mobile-nav-h,86px\) \+ env\(safe-area-inset-bottom\) \+ 176px\)!important;/);
  assert.match(css, /\.budget-page\.budget-page-home::after\{[\s\S]*?content:"";[\s\S]*?min-height:calc\(var\(--mobile-nav-h,86px\) \+ env\(safe-area-inset-bottom\) \+ 132px\);/);
  assert.match(css, /\.budget-page\.budget-page-home > \*:last-child\{[\s\S]*?margin-bottom:calc\(var\(--mobile-nav-h,86px\) \+ env\(safe-area-inset-bottom\) \+ 72px\)!important;/);
});
