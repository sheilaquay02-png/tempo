# Phase 4 Debug Hotfix

This hotfix is based on the Phase 4 Rituals Foundation build.

## Fixed / changed

### Task dates
- Added an explicit task period date/month control to the task add forms.
- The task editor now normalizes legacy tasks to a valid scope before saving.
- Saving a new task now preserves the selected task date/week/month instead of relying only on the currently selected task panel period.

### App popups instead of browser popups
- Replaced the browser overlap confirmation for event conflicts with an in-app modal.
- Replaced the browser prompt for recurring task action choices with an in-app modal.
- Replaced the browser prompt for recurring task reschedule date with an in-app modal.

### Stickers
- Added sticker pack support for:
  - Lola: 1.png to 9.png
  - Luna: 1.png to 9.png
  - Sugar: 1.png to 9.png
  - Truffle: 1.png to 9.png
- Sticker picker now groups stickers by pack.
- Added placeholder PNGs in the expected folders so the UI does not break before final assets are swapped in.

## Sticker asset paths

Replace the placeholder files with the real sticker images:

```txt
public/memory-assets/stickers/lola/1.png ... 9.png
public/memory-assets/stickers/luna/1.png ... 9.png
public/memory-assets/stickers/sugar/1.png ... 9.png
public/memory-assets/stickers/truffle/1.png ... 9.png
```

Keep the filenames as simple numbers.
