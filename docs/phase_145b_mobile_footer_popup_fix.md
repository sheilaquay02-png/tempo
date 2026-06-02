# Phase 145B — Mobile footer and popup correction

Fixes the remaining mobile Budget V1 footer overlap issues reported from iPhone screenshots.

## Fixed

- Transaction recorder now renders through a body portal so parent scroll containers cannot clip it.
- Transaction recorder is bounded above the six-button mobile footer nav.
- Transaction recorder no longer relies on an internal scroll/sticky keypad on mobile; the account/ledger/card selectors remain directly above the calculator keypad.
- Add income/expense card editor is also bounded above the mobile footer and uses sticky save/remove actions inside the sheet.
- Budget Home gets a moderate footer-safe scroll clearance so the last income/expense cards can scroll fully above the footer nav without the huge empty spacer from the earlier attempt.

## Files changed

- `components/budget/BudgetApp.jsx`
- `styles/tempoStyles.js`
- `tests/budget-mobile-footer-popup-hardfix-phase145b.test.mjs`
