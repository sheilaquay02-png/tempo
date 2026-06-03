# Phase 146 — style architecture + mobile footer safety

## Why this patch exists

The mobile Budget footer/popup fixes were still fragile because `components/TempoApp.jsx` appended a very large inline CSS template after `styles/tempoStyles.js`. Any future fix added to `tempoStyles.js` could be weakened by the later inline CSS layer.

## What changed

- Moved the large TempoApp inline CSS append into `styles/tempoLegacyInlineStyles.js`.
- Updated `components/TempoApp.jsx` to compose style layers explicitly:
  1. `appCSS(cvars, fontScale)`
  2. `tempoLegacyInlineCSS`
  3. `tempoMobileFooterPopupSafetyCSS`
- Added `styles/tempoMobileFooterPopupSafety.js` as the final safety layer for Budget mobile footer/popup rules.
- Kept the Phase 145B portal-based popup behavior.

## Mobile fixes reinforced

### Budget Home

`budget-page-home` now has the final mobile scroll clearance after the legacy CSS layer, so the last Expense/Income cards can be scrolled fully above the fixed footer nav.

### Transaction popup

The mobile transaction popup is bounded above the footer nav, uses a no-scroll bottom sheet layout, and forces the selector row to come before the calculator keypad. The keypad is static and placed after Account/Ledger/Card.

### Add income/expense card popup

The add/edit card sheet is bounded above the footer nav. The Save/Remove action row is sticky inside the sheet and remains reachable above the footer.

## Validation

- Added `tests/phase146-style-architecture-footer-safety.test.mjs`.
- Existing Phase 145B tests remain compatible.
