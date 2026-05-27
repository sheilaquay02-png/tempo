# Phase 144 Account/Card Editor Bugfix Patch

Base: `tempo_phase144.zip` with the Phase 144 ledger and Home popup corrections applied.

## Fixed

- Fixed the account edit popup bug where tapping **Edit** inside an account detail screen could fail to show the popup immediately.
- Added Home ledger card management directly inside the selected ledger's Income/Expense sections.
- Added `+ Card` buttons for each selected ledger section.
- Added per-card edit buttons for cards such as Mother, Food, Transport, Salary, Returned Money, etc.
- Added a card editor popup that lets the user rename, change amount, assign ledger/account, mark protected/rollover, save, or remove cards.

## Behaviour preserved

- The Home page remains a single combined Income/Expense card.
- Expense and Income titles remain collapse/expand controls.
- The ledger dropdown remains limited to Daily, Travel, and Business.
- Tapping a card still opens the transaction popup.
- The transaction popup still uses tag, note, and date controls based on IMG_6788.MP4.
