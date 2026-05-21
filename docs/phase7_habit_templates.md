# Phase 7 — Habit Templates

Phase 7 adds a starter Habit Template Library to the Habits page so users do not have to create every habit from scratch.

## Added templates

- Drink water
- Journal
- Stretch
- Read 10 minutes
- Walk
- Plan tomorrow
- Tidy room
- Gratitude
- Sleep routine
- No phone before bed

## User actions

Users can:

- Add a template directly.
- Customize a template before saving.
- Add another copy of a template without overwriting an existing habit.
- Filter templates by habit category.

## Data behavior

Template-created habits are normal habits with fresh IDs and sync-safe timestamps. Each template-created habit also stores a `templateId` reference so the UI can show when a template has already been added.

The template library does not overwrite existing habits. If a user adds the same template again, Tempo appends a copy suffix to the name.
