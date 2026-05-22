# Pre-Phase 22 — Full Extensive Audit and Cleanup

This pass audited the whole app before starting Google Calendar live sync. It focused on build safety, dead-code cleanup, navigation consistency, notification compatibility, and keeping the product aligned with the simplified Tempo direction.

## Validation run

- `npm run build` passes successfully.
- `npm run lint` exits with 0 errors.
- Remaining lint items are warnings only:
  - React hook dependency warnings from the existing large legacy shell.
  - Next.js `<img>` optimisation warnings in Journal and calendar photo/asset surfaces.

## Cleanup completed

### Product surface cleanup

- Confirmed removed pages stay out of visible routing/navigation:
  - Bloom Room
  - standalone Affirmations page
  - Rituals page
- Kept old `?page=bloom` and `?page=affirmations` links safe by redirecting them to Rhythm Stats / Today instead of breaking old notification links.
- Removed old standalone Affirmations page code from `TempoApp.jsx`.
- Replaced the old Bloom Room component file with reusable Rhythm Stats card exports only.

### Ritual cleanup

- Disabled ritual seeding.
- Removed visible ritual mutation handlers and ritual notification actions.
- Removed ritual reminder generation from the cron reminder endpoint.
- Removed ritual actions from the service worker action handler.
- Left only legacy ritual normalizers/sync fields so old user data does not break existing cloud records.

### Gamification cleanup

- Simplified old gamification helpers so they no longer calculate or surface:
  - weekly missions
  - combos
  - badges
  - personal leaderboard
  - mascot progression
  - theme unlock gates
- Rhythm Stats now keeps only the softer stats surfaces that are still part of the current app direction.
- Themes remain available without unlock conditions.

### Dead files and syntax cleanup

- Removed unused backup patch files.
- Removed the unused default `app/page.module.css` file.
- Normalized `app/globals.css` formatting.
- Fixed JSX entity issues in Journal copy.
- Fixed the previous CSS template-string placement issue so Turbopack builds cleanly.

### Push/reminder cleanup

- Reminder categories now keep rituals disabled.
- Cron reminder candidate generation now focuses on active product surfaces:
  - events
  - tasks
  - habits
  - journal
  - tomorrow reset
  - weekly reset
  - daily affirmation
- Removed stale ritual action handling from push actions and the service worker.

## Notes for next refactor

The app still uses a large `TempoApp.jsx` shell. It is stable enough to build on, but the next engineering cleanup should split it into smaller page components before adding too much more complexity.

Recommended later cleanup:

1. Split Journal, Today, Settings, Plan Today, Tomorrow Reset, Weekly Reset, and Rhythm Stats into separate files.
2. Replace broad `Core` destructuring imports with narrower imports.
3. Decide whether to fully remove legacy ritual sync fields after active users have migrated.
4. Replace Journal/calendar `<img>` tags with a controlled image component later if performance becomes an issue.
5. Address hook dependency warnings only after component splitting, because fixing them inside the current large shell can create regressions.
