# Tempo Pre-Split Manual Test Checklist

## Auth / Data Isolation
- [ ] New user sees empty calendar, tasks, Journal, and Bloom stats.
- [ ] User A cannot see User B data after logout/login.
- [ ] Logout/login does not briefly show previous user data.
- [ ] Sync status shows cloud/offline/failed state correctly.
- [ ] Tap failed sync pill retries cloud save.

## Calendar
- [ ] Add event from global + Add.
- [ ] Add event from day slot click.
- [ ] Edit event and save.
- [ ] Delete one-off event.
- [ ] Copy event and paste into day view slot.
- [ ] Copy event and paste into week view slot.
- [ ] Copy event and paste onto month date.
- [ ] Conflict preview appears before pasted/moved event overlaps another event.
- [ ] Press-and-hold moves event; quick tap opens event.
- [ ] Drag movement cancels if finger/mouse moves before hold completes.
- [ ] Recurring move/edit/delete asks single/following/all.
- [ ] Mobile month view is readable and usable.

## Tasks
- [ ] Add task from global + Add.
- [ ] Add day task from Day card.
- [ ] Add week task from Week card.
- [ ] Add month task from Month card.
- [ ] Drag task between Day / Week / Month cards on desktop.
- [ ] Press-and-hold drag task between Day / Week / Month on mobile.
- [ ] Use non-drag Move to Day / Week / Month buttons.
- [ ] Complete task and confirm it appears in correct day’s Journal.
- [ ] Recurring task appears in future period.
- [ ] Deleting recurring task asks before deleting whole series.

## Journal
- [ ] Add memory from + Add Memory.
- [ ] Add memory from global + Add.
- [ ] Upload 1 image.
- [ ] Upload 6 images.
- [ ] Reject 7th image.
- [ ] Reject image larger than 15MB.
- [ ] Upload progress/status appears while saving.
- [ ] Remove image asks confirmation.
- [ ] Removed image is deleted after successful save.
- [ ] Cancelled memory does not upload photos.
- [ ] Close edited memory shows unsaved-change warning.
- [ ] Search affects Journal grid.
- [ ] Tag filter keeps all dates visible and fades non-matches.
- [ ] Rename tag through Memory Settings.
- [ ] Merge tag through Memory Settings.
- [ ] Archive activity through Memory Settings.
- [ ] Open same memory on mobile and desktop.
- [ ] Thumbnail loads in grid; full image loads in detail view.

## Bloom Room
- [ ] XP stays stable across Calendar / Tasks / Memory / Bloom pages.
- [ ] Daily quests update correctly.
- [ ] Badges unlock correctly.
- [ ] Daily score matches completed tasks and Journal entry.
- [ ] XP breakdown explains why XP changed.
- [ ] Advanced Bloom sections are collapsed by default.

## Settings / Misc
- [ ] Reminder notification wording is accurate.
- [ ] Keyboard shortcuts hidden on mobile.
- [ ] Quick-add FAB works on mobile and desktop.
