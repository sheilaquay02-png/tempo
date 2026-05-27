# Phase 144 — Budget Accounts Page

Phase 144 refines the Budget → Account page using the uploaded account-page reference video as the functional skeleton.

## Added

- Account overview with an app-like net worth card.
- Accounts grouped into Debit, Credit, Borrowed, Invest, and Other sections.
- Soft two-column/mobile account cards with icon, note/institution, and current balance.
- Account detail view after tapping a card.
- Account detail quick actions for adding an account transaction and creating a transfer.
- Account edit popup with icon, name, note/institution, currency, starting balance, type, ledger, net worth toggle, Australia-ready toggle, and hide-balance toggle.
- Add Account bottom sheet with grouped account type picker.
- Floating transfer button from the account overview.

## Preserved

- Existing Phase 143 transaction math.
- Existing Budget transaction data shape.
- Existing Schedule mode behaviour.
- Existing cloud/local persistence wiring.

## Manual checks

1. Open Budget → Account.
2. Confirm the net worth card and grouped account cards appear.
3. Tap an account card and confirm the detail view opens.
4. Use Edit and confirm account values save.
5. Use Add Account and confirm the new account appears in the correct group.
6. Use ⇄ transfer and confirm the transaction updates balances.
7. Use + inside an account detail view and confirm an account transaction records.
8. Refresh and confirm account edits persist.
