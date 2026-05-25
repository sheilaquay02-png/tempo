# Phase 111–120 Safe Modular Refactor Notes

This phase begins the gradual split of the large Tempo application component without changing user-facing mechanics.

## Rules followed

1. Do not remove the local Tempo Assistant.
2. Do not add OpenAI/API assistant behavior.
3. Do not redesign UI while refactoring.
4. Move pure helpers first.
5. Add tests before deeper component extraction.

## Extracted boundaries

- `lib/tempo/client/calendarPresentation.js`
- `lib/tempo/client/journalDecorationModel.js`
- `lib/tempo/client/googleCalendarClient.js`
- `lib/tempo/client/pushNotifications.js`

## What remains for future refactor phases

- Extract the Google settings UI section into a small component.
- Extract notification/settings panels gradually.
- Extract journal decoration React components only after screenshot/manual comparison.
- Extract Tempo Assistant last, with a visual regression checklist, because it is a core feature.

## Manual regression checklist for this phase

- Open Tempo Assistant and confirm original UI/design remains.
- Open Assistant Today Context and quick action chips.
- Test Assistant Add Event and Add Task conversational flows.
- Open Google Calendar settings and confirm connect/import/disconnect buttons still work.
- Open Journal on desktop and confirm existing decorations display.
- Confirm mobile decoration editing remains disabled if that is the active product decision.
- Enable push notifications and confirm the success/error toast still appears.
