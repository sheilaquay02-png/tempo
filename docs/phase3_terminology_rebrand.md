# Phase 3 — Terminology Rebrand

Tempo now uses the daily-rhythm terminology foundation.

## Canonical categories

| Canonical ID | Label |
|---|---|
| `important` | Important |
| `main` | Main Thing |
| `light` | Light Task |
| `meeting` | Meeting |
| `personal` | Personal |
| `wellness` | Wellness |

## Legacy category migration

The app preserves existing events/tasks by mapping old category IDs into the new canonical IDs during load, sync merge, and local persistence.

| Legacy ID | New ID |
|---|---|
| `deep` | `important` |
| `boss` | `main` |
| `admin` | `light` |
| `health` | `wellness` |

This means old user data stays safe while the UI moves forward with the new softer language.

## What changed

- Default category definitions now use the new canonical IDs.
- Existing tasks are normalized through `normalizeTasks()`.
- Existing events are normalized through `reviveEvents()`.
- Settings categories are normalized through `normalizeCategories()`.
- Sync merge normalizes category IDs before returning merged events/tasks.
- Seed events, seed tasks, day templates, Today summary and Rhythm Stats now use the new labels.

## What remains intentionally compatible

Natural-language parsing still accepts words like old task/category terms as input so existing user habits do not break. The output language remains daily-rhythm aligned.
