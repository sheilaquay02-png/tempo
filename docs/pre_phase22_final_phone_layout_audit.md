# Pre-Phase 22 Final Phone Layout Audit

This patch is a stabilisation and design-audit release before Phase 22 Google Calendar sync.

## Today

- Rebalanced the top Today layout so Top 3 Tasks shares the hero row with Daily Affirmation and Check-in.
- Kept Today's Habits on the same layout row as Calendar.
- Removed the Next Gentle Step card from the visible Today layout.
- Forced the four summary cards — Events, Tasks, Habits, Free time — to fill the available row width evenly.
- Added Sugar empty state for Top 3 Tasks when there are no tasks.

## Bloom Room

- Kept Mood & Energy and Daily Affirmation on the same row.
- Kept Tomorrow Reset and Weekly Reset on the same row.
- Restored the Mood & Energy emoji display.
- Further softened the remaining gamification area by removing the daily quest/checkpoint card from the main Bloom dashboard.

## Journal

- Check-in and Tomorrow Reset now share the same row.
- On mobile, Journal is calendar-first again: the month grid stays in 7 columns instead of turning into a vertical list.
- On mobile, Recent Entries/search/extra reflection blocks are hidden so the Journal screen stays compact and does not require excessive scrolling.
- Journal editor/footer remains reachable above the mobile footer.

## Mobile optimisation

- Reduced mobile footer height and button sizes to avoid clipping.
- Tightened Today, Journal, and Bloom spacing on phones.
- Preserved safe-area padding so modals and page content do not hide behind the footer.
