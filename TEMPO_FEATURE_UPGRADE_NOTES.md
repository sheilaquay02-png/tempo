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
