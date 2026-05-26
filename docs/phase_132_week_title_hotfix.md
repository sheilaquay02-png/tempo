# Phase 132 Week Title Hotfix

## Issue

Week view displayed accidental journal decorator CSS text inside the calendar title, after the date range.

## Cause

A journal decorator CSS block was accidentally left inside the week-title template literal in `components/TempoApp.jsx`.

## Fix

Restored the week title branch to return only the formatted Monday-to-Sunday date range:

```js
return `${formatWithDisplayTimezone(mon,{month:"short",day:"numeric"})} – ${formatWithDisplayTimezone(sun,{month:"short",day:"numeric"})}`;
```

## Checks

- Release validation passed.
- Test suite passed.
- Confirmed the accidental CSS block is no longer inside the week-title JSX branch.

## Manual QA

- Open Calendar.
- Switch to Week view.
- Confirm topbar title shows only the date range, e.g. `May 25 – May 31`.
- Switch Day/Month/Week again to confirm no layout regression.
