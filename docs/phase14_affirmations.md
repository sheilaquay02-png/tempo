# Phase 14 — Affirmations

Phase 14 adds a grounded affirmation layer that fits Tempo's soft daily rhythm direction.

## What changed

- Added a full Affirmations page instead of the old placeholder.
- Added a daily affirmation card to Today.
- Added an affirmation rhythm card to Bloom Room.
- Added starter affirmations across calm, clarity, confidence, reset, and kindness.
- Added shuffle support for the daily affirmation.
- Added favorite support.
- Added custom affirmation creation and editing.
- Added custom affirmation deletion.
- Added optional reminder preferences for the future notification revamp.
- Added a shortcut to add an affirmation step into the Morning Reset ritual.

## Data added

Affirmations are stored in the synced settings payload as:

```js
settings.affirmations
settings.affirmationSettings
```

Local storage keys:

```txt
<userId>_affirmations
<userId>_affirmation_settings
```

## Sync behavior

- Affirmations sync through the existing settings persistence flow.
- Custom deleted affirmations use the existing deletedRecords mechanism under `deletedRecords.affirmations`.
- The merge flow uses `mergeRecordsById` and `normalizeAffirmations`.

## Product notes

The copy is intentionally grounded and non-cheesy. It is meant to support the Check in → Plan → Do → Reset → Reflect loop without becoming appearance-focused, overly motivational, or guilt-driven.
