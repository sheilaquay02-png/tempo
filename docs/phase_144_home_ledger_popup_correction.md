# Phase 144 Home/Ledger/Popup Correction

This patch corrects the Budget Home flow to match the IMG_6788.MP4 reference more closely.

## Corrected behaviour

- Budget Home uses one combined monthly card for the selected ledger.
- The ledger selector is not `All`; it only offers `Daily`, `Travel`, and `Business`.
- Only the selected ledger's cards show on Home.
- `Expense` and `Income` headers are collapse/expand controls, not transaction record buttons.
- Tapping a card such as Food, Transport, Mother, Salary, or Returned Money opens the transaction popup.
- Quick chips in the popup are tags, not descriptions.
- The yellow row actions now expose editable transaction controls:
  - Tag: add/edit/remove tags.
  - Note: add a reference note.
  - Today: edit the transaction date or reset to today.
- The Account overview no longer shows the misleading `All` button at top-left.

## Validation

- `npm test` passed: 70 passed / 0 failed.
- `npm run lint -- --quiet` passed.
- `npm run build` compiled successfully in the sandbox before the command window timed out during final output handling.
