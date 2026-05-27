# Phase 145 — Budget Plan buckets + spending pace tracker

This phase upgrades the Budget tab into a usable monthly planning page.

## Added

- Dedicated `BudgetPlanPage`
- Month switching for the Budget Plan page
- Ledger filter for Daily / Travel / Business
- Budget summary cards for monthly income, allocated, unallocated/overallocated, and protected monthly amounts
- Editable monthly income profile
- Per-ledger income and expense card overview
- Spending pace status per expense card
- Income progress status per income card
- Add/edit/remove card flow reused from Budget Home
- Protected-card warning before removing a protected card

## Behaviour

- Spending pace compares card spending against how much of the selected month has passed.
- Past months are treated as 100% elapsed.
- Future months are treated as 0% elapsed.
- Protected cards remain editable, but the app warns before removal.
- Transactions are filtered to the selected month before calculating spent/received amounts.

## Manual check

1. Open Budget → Budget.
2. Switch between Daily, Travel, and Business ledgers.
3. Use previous/next month.
4. Confirm card spent/received values change by selected month.
5. Edit monthly income and confirm unallocated/overallocated changes.
6. Add an expense card and confirm it appears.
7. Edit a protected card and try removing it to confirm warning.
8. Confirm Budget Home and Transactions still work.
