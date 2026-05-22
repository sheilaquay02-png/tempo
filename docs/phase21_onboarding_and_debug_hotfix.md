# Phase 21 — Onboarding + Debug Hotfix

## Onboarding

Added a guided onboarding flow for new users and a restart button in Settings.

The flow helps users choose:

- what they want Tempo to help with
- day start time
- wind-down time
- first rituals
- starter habits
- gentle reminder preferences

On completion, Tempo applies selected rituals/habits without duplicating existing templates, updates work hours, applies reminder preferences, and returns the user to Today.

Onboarding can be skipped and restarted later from Settings.

## Debug fixes included

- Day and Week calendar views now scroll vertically again.
- Month calendar grid uses flexible zero-min-width columns so it responds more consistently when the task panel is resized.
- Tomorrow Reset subtitle is forced into one line on desktop.
- Weekly Reset subtitle is forced into one line on desktop.
- Bloom Room Mood & Energy card no longer shows the energy emoji as a second-row extra emoji.

## Notes

The one-line reset subtitle behavior falls back to normal wrapping on mobile so the text remains readable on small screens.
