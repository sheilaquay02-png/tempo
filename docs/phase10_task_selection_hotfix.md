# Phase 10 Task Selection Hotfix

This patch replaces the visible "Lock task blocks" workflow in Plan Today with a clearer task picker.

## Changes

- Plan Today now shows a checklist of open tasks before the generated plan.
- Users can tick tasks they want Tempo to schedule today.
- Users can untick tasks they do not want planned today.
- Toggling a task regenerates the suggested day plan while preserving the selected planning mode.
- Added All / None quick controls.
- Unchecked tasks appear under "Not planned by choice" and are not treated as tasks that failed to fit.
- Removed the visible Lock / Locked buttons from the plan rows.

## Notes

The internal planner still supports fixed suggestions if needed later, but the user-facing Phase 10 flow is now selection-first instead of lock-first.
