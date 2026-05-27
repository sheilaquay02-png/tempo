# Phase 144 Home Visual Correction

This patch corrects the Budget Home layout after the ledger/account changes.

## Changes

- Budget Home keeps one combined monthly Income/Expense card.
- Ledger selection is still Daily, Travel, or Business only.
- Ledger dropdown is widened to avoid clipping.
- Home shows only the selected ledger's income and expense cards.
- Expense and Income row titles remain collapse/expand controls.
- Removed the instructional helper sentence from Home.
- Removed the extra Home net worth/metrics/protected/month-flow sections.
- Expense and Income amounts now show the selected month's actual transaction totals.
- Home month can be changed freely with previous/next month buttons.
- Card grids are fixed to equal-size cards: 5 columns on desktop, 3 columns on mobile.
- Account page net worth card uses the pink-purple gradient requested from the reference screenshot.

## Manual checks

- Budget → Home → switch ledger: only Daily/Travel/Business options appear.
- Budget → Home → switch month: totals change by transaction month.
- Tap Expense/Income title: section collapses/expands.
- Tap a card: transaction popup opens.
- Edit/add/remove cards still works.
- Budget → Account: net worth card has the updated pink-purple gradient.
