# Phase 18 — Mobile-First Polish

Phase 18 improves Tempo as a phone-first PWA while keeping the desktop experience intact.

## Added

- Mobile bottom navigation now prioritizes the core daily actions:
  - Menu
  - Today
  - Calendar
  - Tasks
  - Rituals
  - Habits
- Active bottom-nav states so users can see where they are.
- Mobile menu scrim and safer drawer behavior.
- Mobile sync status strip for failed/offline/pending changes.
- Larger mobile tap targets across tasks, rituals, habits, modals, calendar controls, and primary actions.
- Safer mobile spacing using dynamic viewport height and safe-area insets.
- Sticky opaque page headers for mobile rhythm pages.
- Improved mobile Today layout with stacked sections and full-width actions.
- Mobile calendar touch polish:
  - Sticky topbar
  - Larger day/week/month touch targets
  - Larger event blocks
  - Mobile-safe bottom spacing
- Full-screen ritual checklist sheet on mobile.
- Habit weekly grid mobile scroll/tap polish.
- Journal input polish with larger writing fields and sticky action area.
- Chat, undo, toast, and event-copy bars moved above the mobile nav.

## Notes

This phase intentionally does not change data models. It is a UI/UX hardening phase on top of Phase 17.

## Validation

- `lib/tempo/core.js` syntax check passed.
- `styles/tempoStyles.js` syntax check passed.
- JSX transpile checks passed for:
  - `components/TempoApp.jsx`
  - `components/bloom/BloomRoom.jsx`
  - `components/tasks/Tasks.jsx`
  - `components/calendar/CalendarViews.jsx`
