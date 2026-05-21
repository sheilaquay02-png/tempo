
## Phase 4 — Rituals Foundation

- Added Rituals page.
- Added create/edit/delete ritual flow.
- Added repeat days, checklist steps, scheduled time, duration, category, color, and reminder fields.
- Added daily ritual completion tracking.
- Added Today dashboard ritual cards.
- Added ritual reminder support to the push reminder cron route.
- Added sync-safe ritual storage and ritual tombstones.

# Tempo Current Changelog

## Phase 3 — Terminology Rebrand

Tempo now uses the new daily-rhythm terminology throughout the active app experience.

### Canonical task and event categories

- Important
- Main Thing
- Light Task
- Meeting
- Personal
- Wellness

Legacy category IDs are migrated safely on load:

- `deep` → `important`
- `boss` → `main`
- `admin` → `light`
- `health` → `wellness`

This preserves existing user data while moving the app to the new lifestyle/rhythm language.

### Visible language

- Plan Today is the main planning action.
- Tomorrow Reset replaces end-of-day rollover language.
- Rhythm Stats replaces hard output stats language.
- Journal/Bloom Room is now the reflection and scrapbook-facing language.
- Main Thing replaces old high-intensity task language.

### Removed direction

The previous timer-centric features remain removed so the app can move toward routines, habits, and daily rhythm.

## Deployment notes

- Vercel Hobby-safe: frequent Vercel Cron is not used.
- Frequent reminders should be triggered by GitHub Actions or an external cron provider.
- Node engine remains set to Node 24.x for Vercel.

## Phase 4 Debug Hotfix

- Added explicit task date/week/month selection to task creation and editing flows.
- Replaced event overlap browser confirmation with an in-app modal.
- Replaced recurring task browser prompts with in-app modals.
- Added grouped sticker pack support for Lola, Luna, Sugar, and Truffle, with expected assets named 1.png through 9.png.

## Phase 4 Task Date Editor Hotfix

- Fixed task date editing after a task has already been assigned to a date.
- The edit modal now saves the selected day/week/month explicitly instead of letting the previous period anchor override it.
- Task drag/move and recurring task reschedule also use explicit period patches.
