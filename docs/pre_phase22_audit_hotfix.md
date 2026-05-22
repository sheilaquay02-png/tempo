# Pre-Phase 22 Audit Hotfix

This patch prepares Tempo before Phase 22 by cleaning up UX/debug issues caught after Phase 21.

## Fixed

- Journal memory cards now use the selected background reliably, even after the Phase 19 visual rebrand CSS.
- Bloom Room Mood & Energy card no longer shows the extra recent-check-in emoji row.
- Mobile footer navigation now uses a larger safe-area-aware height so buttons are not clipped.
- Mobile footer now shows Journal instead of Rituals.
- Mobile sidebar scrim no longer appears as an empty/weird box when the drawer is closed.
- Calendar day and week views have explicit mobile scroll handling.
- Calendar month view now flexes consistently with the available pane width.
- Habits Template Library is collapsible by default.
- Rituals were removed from the visible navigation, Today dashboard, mobile footer, onboarding, and Plan Today protected blocks.
- Bloom Room gamification was simplified by removing visible weekly missions, badges/theme unlocking, combos, and personal leaderboard sections.
- Settings themes are now always available instead of being tied to unlock logic.

## Notes

Legacy ritual data and sync support are kept internally for migration safety, but Rituals are no longer surfaced as a primary app feature.
