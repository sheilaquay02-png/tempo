# Phase 133 — Planning Modal Split

## Summary

Phase 133 extracts planning modal UI out of `components/TempoApp.jsx` while preserving the existing planning state, task scheduling logic, meal-break behavior, and saved data shape.

## New files

- `components/planning/PlanningModals.jsx`
- `utils/planningUtils.js`

## Moved from `components/TempoApp.jsx`

- `TaskScheduleModal`
- `DailyPlanModal`
- `normalizePlanningRules`
- `normalizePlanningMode`
- `planningModeForEnergy`
- `planningModeMeta`
- `applyPlanningModeToRules`
- `normalizeMealBreaks`

## Intentionally unchanged

- `buildDailyPlan`
- `applyDayPlan`
- `regenerateDayPlan`
- `movePlanRemainingToTomorrow`
- `movePlanRemainingToThisWeek`
- `skipLowPriorityInDayPlan`
- `scheduleTaskIntoCalendar`
- task/event persistence
- Google Calendar sync
- reminder/notification behavior
- saved local/cloud data keys

## Validation run

- `node scripts/validate-release.mjs`
- `node --test tests/*.test.mjs`
- JS/JSX parse sweep with TypeScript transpilation
- `npm run lint -- --quiet`
- `npm run build`

## Manual checks

### Plan Today

- Open Today and click `Plan Today`.
- Confirm the modal opens.
- Switch planning modes: Light Day, Normal Day, Productive Day.
- Select/deselect tasks.
- Use `All` and `None`.
- Click `Regenerate plan`.
- Click `Skip low-priority today`.
- Use `Move remaining to tomorrow` if remaining tasks exist.
- Use `Move remaining to this week` if remaining tasks exist.
- Click `Apply plan` and confirm events are created.

### Schedule task

- Open a task.
- Use the task schedule flow.
- Try Today, This week, and Before deadline.
- Confirm scheduled calendar blocks are created and task schedule metadata updates.

### Settings impact

- Change work hours.
- Change meal breaks.
- Change planning style/rules.
- Refresh the app and confirm those settings persist.
- Run Plan Today again and confirm the updated settings are reflected.
