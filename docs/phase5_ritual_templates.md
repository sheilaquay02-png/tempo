# Phase 5 — Ritual Templates

## Objective

Make Rituals easier to start by giving users ready-made routines they can add or customize.

## Added templates

- Morning Reset
- Night Wind Down
- Sunday Reset
- Workday Start
- Study Reset
- Room Reset
- Digital Declutter
- Weekly Planning
- Meal Prep Reset
- Clean Desk Reset

## User experience

The Rituals page now has a Template Library section above Today’s Rituals.

Users can:

- Filter templates by category
- See template description, time, duration, and sample steps
- Add a template immediately
- Customize a template before saving it
- Add another copy of a template without overwriting the original ritual

## Data behavior

Templates are static presets in the app bundle. They do not sync as user data until used.

When a user adds a template, Tempo creates a normal ritual with:

- A fresh ritual ID
- A `templateId` reference
- Normal checklist steps
- Repeat days
- Reminder settings
- Sync-safe timestamps

Existing rituals are preserved. If a ritual with the same name already exists, the new ritual name gets a numeric suffix.

## Acceptance checklist

- [x] Users can create rituals from templates.
- [x] Users can customize template steps before saving.
- [x] Templates do not overwrite existing rituals.
- [x] Template-created rituals sync as normal rituals.
- [x] The Rituals page remains mobile-friendly.
