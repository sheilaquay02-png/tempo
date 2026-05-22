# Pre-Phase 22 Product Simplification — Rhythm Stats Page

## Summary
This pass simplifies the lifestyle layer before Google Calendar sync work.

## Changes
- Rhythm Stats is now a full page instead of a popup/modal.
- Bloom Room is removed from visible navigation.
- The Affirmations page is removed from visible navigation and routing.
- Daily Affirmation remains as a Today card, using the synced affirmation dataset and rotating by date.
- Gentle Stats, Weekly Recap, Monthly Life Garden, and Streak Garden are now surfaced inside Rhythm Stats.
- Removed the redundant "Habits checked off this week" meter from Rhythm Stats.
- Legacy Bloom/Affirmation data structures are kept for sync safety and future backend use.

## Validation
- `npm run build` passed successfully after this patch.
