# Phase 144 Home popup/month fix

Base: `tempo_phase144.zip` plus the Phase 144 ledger, home/ledger/popup, account/card editor, and home visual correction patches.

## Fixes

- Centered the Budget Home month selector by balancing the ledger dropdown with a right-side spacer on desktop.
- Kept the ledger dropdown wider so `Daily`, `Travel`, and `Business` remain readable.
- Fixed the Budget Home card transaction popup crash/blank behavior.
  - The popup now receives the summary passed into `BudgetTransactionPopup` instead of referencing a page-local `monthSummary` variable that does not exist inside the popup component scope.
- Card taps now open the transaction popup immediately again.

## Validation

- `node scripts/validate-release.mjs`
- `node --test tests/*.test.mjs`
- `npm run lint -- --quiet`
- `npm run build`
