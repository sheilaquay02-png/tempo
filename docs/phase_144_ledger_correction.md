# Phase 144 Ledger Correction

Base package: `tempo_phase144.zip`

This patch corrects the Budget ledger model after the Phase 144 account page implementation.

## Corrections

- Ledgers are now the three intended money contexts:
  - Daily
  - Travel
  - Business
- Legacy ledger IDs are normalized into the new three-ledger model:
  - `personal-ledger` -> `daily-ledger`
  - `australia-ledger`, `investment-ledger`, `travel-ledger` -> `travel-ledger`
  - `business-ledger` -> `business-ledger`
- Budget cards now support `cashFlowType`:
  - `income`
  - `expense`
- Each ledger can have its own editable income and expense cards.
- Budget Home displays cards grouped by Daily, Travel, and Business ledgers.
- Budget Plan lets the user add, edit, and remove cards within each ledger.
- Removed the floating transfer button from the Account overview.

## Notes

Transfers are still available from the account detail flow and Transactions page. The removed control was only the floating button on the Account overview.

## Validation

- `npm run validate:release`
- `npm test`
- `npm run lint -- --quiet`
- `npm run build`
