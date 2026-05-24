# Journal Decorator Scroll + Button Fix

This patch fixes the decorator overlay behavior after the undo/redo update.

## Fixed

- Added a dedicated `journal-decorating-overlay` class for decorate mode.
- Locks `document.body` and `document.documentElement` scrolling while the journal memory modal is open.
- Prevents the whole page/popup from scrolling behind the decorator.
- Keeps the journal entry card fixed within the viewport.
- Makes only `.entry-view-body` scrollable.
- Forces the decoration tools to remain a fixed bottom sheet.
- Keeps the header Done, Cancel, and close buttons above the decoration layer.
- Adds explicit click propagation handling for Done, Cancel, and close.
- Keeps sticker/tape hit targets interactive without blocking the journal header or tool panel.

## Validation

- `npm run build` completed successfully in the local container.
- Build output generated all Next.js routes successfully.
