# Phase 142 navigation/skeleton adjustment

This adjustment keeps Budget V1 as a separate app mode while tightening the shell before transaction work begins.

## Changed

- App mode switch now shows emoji-only visible buttons for Schedule, Budget, and Overall while keeping accessible labels and titles.
- Desktop sidebar menu is context-specific:
  - Schedule mode shows Schedule navigation and My Calendars.
  - Budget mode shows Budget navigation only: Home, Account, Transactions, Budget, Settings.
  - Overall remains minimal until its information architecture is designed.
- Mobile footer is context-specific:
  - Schedule: Menu, Today, Calendar, Tasks, Journal, Habits.
  - Budget: Home, Account, Transactions, Budget, Settings.
- BudgetApp now has skeleton subpages for the five requested Budget footer buttons.

## Not implemented yet

No new finance logic was added in this adjustment. Transactions, recurring entries, spending pace, damage control, savings projections, and Overall pattern analysis remain future phases.
