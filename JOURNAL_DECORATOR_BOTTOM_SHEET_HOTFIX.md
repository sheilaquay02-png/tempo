# Journal Decorator Bottom Sheet Hotfix

This update corrects the journal decorator interaction layer and changes the decoration tools into a swipe-up style bottom sheet.

## Fixed
- Decoration elements are now real hit targets while decorating.
- The non-editing pointer-events rule no longer blocks editing mode.
- The decoration layer now sits above the saved memory view during decoration.
- Stickers and tape can be selected, dragged, resized, rotated, flipped, layered, copied, deleted, and saved.
- Tape no longer uses a full textarea that blocks dragging; double-tap tape and choose Text to add or edit text.

## UX changes
- Removed the inline tool panel that appeared inside the memory card.
- Added a bottom sheet for decoration tools.
- The bottom sheet can collapse/expand like a swipe-up tool tray.
- Sticker packs and sticker choices scroll horizontally in one row.
- The saved journal view stays visible while editing decorations.
- Journal view card rounding and clipping behavior were adjusted.

## Validation
- `npm run build` completed successfully.
