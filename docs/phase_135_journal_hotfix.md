# Phase 135 Journal hotfix

## Fixed

The Phase 135 split moved `JournalPage` into `components/journal/Journal.jsx`, but the extracted file did not destructure `dailyGameSummary` from `Core`. The Journal page called `dailyGameSummary(...)` while rendering memory cards/detail views, which caused a runtime `ReferenceError` when opening Journal.

## Change

Added `dailyGameSummary` to the `Core` destructuring list in `components/journal/Journal.jsx`.

## Regression coverage

Added `tests/journal-page-core-import-regression.test.mjs` to guard the extracted Journal page dependency.

## Manual check

Open Journal after deploy and confirm the page renders. Then open an existing memory and confirm the score/XP display appears normally.
