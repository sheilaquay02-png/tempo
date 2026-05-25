# Tempo Manual Regression Checklist

Run this before publishing a production zip.

## Core navigation
- Open Today, Calendar, Tasks, Habits, Journal, Settings.
- Confirm mobile bottom navigation and desktop side menu still work.
- Confirm theme/dark mode/font settings persist after refresh.

## Local Tempo Assistant
- Confirm the bottom-right Tempo Assistant button appears.
- Open/close the assistant on desktop and mobile.
- Toggle Today Context show/hide.
- Use quick chips: Plan Today, Check in, Journal, Tomorrow Reset.
- Ask: "what should I focus on today?" and confirm a local contextual answer.
- Add a task through the conversational assistant flow and cancel once.
- Add a task through the conversational assistant flow and confirm once.
- Confirm no `/api/assistant` request appears in the network tab.

## Calendar and Google import
- Create a Tempo event and edit it.
- Connect Google Calendar if testing integration.
- Confirm Google events are read-only.
- Import an all-day Google event and verify it does not show as one day too long.
- Disconnect Google and confirm only Google imported events are removed.

## Tasks
- Add day, week, and month tasks.
- Complete and uncomplete a task.
- Move a task between periods.
- Confirm recurring tasks appear only in the correct target period.

## Habits
- Add a habit with target count greater than 1.
- Increment it once; it should not jump to complete unless target is 1.
- Complete it to target and confirm progress/streak display.

## Journal
- Save a normal memory with text/photos.
- Reopen it and confirm content persists.
- Confirm existing decorations display on mobile.
- Confirm decoration editing is unavailable on mobile and available on desktop only.
- Confirm saved memory encryption still round-trips after login/refresh.

## Push reminders
- Enable/disable push notifications.
- Confirm unsupported-browser messaging if push is unavailable.
- Trigger a test reminder only on a non-production test account.
- Confirm a push action works once and cannot be reused.

## Sync/offline
- Log in, edit data, refresh, and confirm data remains.
- Simulate offline, edit local data, reconnect, and confirm no obvious data loss.

## Release hygiene
- Confirm zip excludes `.env.local`, `.git`, `.npm-cache`, `node_modules`, and `.next`.
- Run `npm run validate:release`.
- Run `npm test`.
- Run `npm run lint` when dependencies are installed.
- Run `npm run build` on Node 24 / npm 11.
- Confirm the GitHub Actions workflow passes before using a production zip.
- Confirm no `/api/assistant` route exists and no OpenAI env variables are required.
- Confirm the local Tempo Assistant still opens, answers locally, and supports Add Task/Add Event flows.
