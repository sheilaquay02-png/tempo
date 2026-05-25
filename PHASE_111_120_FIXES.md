# Phase 111–120: Safe modular refactor

Scope: reduce risk inside `components/TempoApp.jsx` without changing app behavior or removing core mechanics.

## Preserved

- Local Tempo Assistant/chatbot stays intact.
- No `/api/assistant` route was added.
- No OpenAI/API assistant integration was added.
- Journal, tasks, calendar, habits, reminders, sync, and decoration mechanics are intended to behave the same.

## Extracted modules

### Calendar presentation helpers

New file:

- `lib/tempo/client/calendarPresentation.js`

Moved out of `TempoApp.jsx`:

- calendar color presets
- event templates
- calendar color validation
- event source labels/icons
- read-only source detection

### Journal decoration data helpers

New file:

- `lib/tempo/client/journalDecorationModel.js`

Moved out of `TempoApp.jsx`:

- decoration defaults/history limit
- decoration type detection
- decoration layout clamping
- sticker/tape item creation
- text sizing helper
- sticker flip style helper
- decoration save normalization

The visual decoration editor remains in `TempoApp.jsx` for now to avoid a high-risk JSX/component split.

### Google Calendar browser client helpers

New file:

- `lib/tempo/client/googleCalendarClient.js`

Moved out of `TempoApp.jsx`:

- authenticated Google route fetch helper
- Google calendar merge logic
- Google payload state derivation
- imported Google event counting
- Google disconnect warning copy
- Google import toast formatting

### Push notification browser helper

New file:

- `lib/tempo/client/pushNotifications.js`

Moved out of `TempoApp.jsx`:

- closed-app push setup success/error flow

## Tests added

New test file:

- `tests/client-refactor-boundaries.test.mjs`

Covers:

- calendar source/read-only behavior
- Google calendar merge behavior
- Google payload state derivation
- Google import/disconnect text stability
- journal decoration normalization

## Why this phase is intentionally conservative

`TempoApp.jsx` is still large, but a full component split would be high-risk. This phase extracts pure helpers and client service boundaries first, while keeping the existing rendered UI and local assistant mechanics untouched.

## Validation performed

- `npm test` passed: 28/28 tests.
- New client helper modules passed `node --check`.
- Zip excludes `.env.local`, `.git`, `.npm-cache`, `node_modules`, and `.next`.
