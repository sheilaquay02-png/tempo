# Phase 8 — Today Dashboard Revamp

This phase upgrades Today from a lightweight landing page into the main daily rhythm dashboard.

## Added

- New Today dashboard hero with greeting, Plan Today, and Tomorrow Reset actions.
- Dedicated check-in card showing the current Journal mood when available.
- Energy placeholder for the upcoming mood/energy phase.
- Rhythm summary strip for events, tasks, rituals, habits, and free time.
- Interactive Top 3 task section with task completion and edit actions.
- Calendar preview for today's events using events expanded specifically for today, not the current calendar view range.
- Today’s Rituals section wired to ritual checklist completion.
- Today’s Habits section wired to habit check-offs and multi-count increments.
- Journal Prompt card with shortcut to Journal and Tomorrow Reset.
- Daily loop card showing: Check in → Plan → Do → Reset → Reflect.

## Notes

- No new mood/energy data model was added in this phase. Deeper mood and energy check-ins remain planned for the next phase.
- Rituals and habits continue to sync through the existing settings-based Supabase data model.
- The Today dashboard is mobile-first but expands to use more desktop space.
