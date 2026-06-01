# Phase 145 Budget Home footer clearance fix

This patch strengthens the mobile Budget Home scroll clearance so the fixed six-button Budget footer cannot cover the last row of Home content.

Changes:
- Applies the fix specifically to `.budget-page.budget-page-home`.
- Adds extra bottom padding and scroll padding that accounts for the mobile nav height and safe area.
- Adds an `::after` spacer as the final flex item, so the final cards can scroll above the footer even when normal padding is clipped by the scroll container.
- Adds a last-child margin fallback for mobile browsers that treat flex scroll padding inconsistently.
