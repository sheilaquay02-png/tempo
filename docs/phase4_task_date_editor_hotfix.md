# Phase 4 Task Date Editor Hotfix

This hotfix fixes task date editing after a task has already been assigned to a day/week/month.

## Root cause

The task editor saved edited tasks through `withTaskPeriod(form, periodDate)`. That helper preserves an existing `taskDate`, `weekKey`, or `monthKey` first. As a result, when a user changed the date in the edit modal, the old period anchor could override the newly selected date.

## Fix

- The task edit modal now applies `taskPeriodPatchForScope(scope, selectedDate)` directly when saving.
- Moving a task between Day/Week/Month also applies an explicit period patch instead of relying on inferred anchors.
- Recurring task reschedule now applies an explicit period patch too.

This prevents previous task dates or deadlines from overriding the user's selected date.
