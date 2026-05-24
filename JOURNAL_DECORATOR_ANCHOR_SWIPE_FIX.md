# Journal Decorator Anchor + Swipe Fix

This patch corrects the remaining journal decoration issues:

- Reworked sticker/tape placement to use pixel coordinates relative to the full saved journal entry content while decorating.
- Existing percentage-based decorations are converted to pixel coordinates when entering decorate mode so they stay fixed on the journal card as the entry scrolls.
- Reworked move/resize/rotate math to use the full journal content coordinate system instead of the visible viewport.
- Added a stronger bottom-sheet drag handler using window-level pointer tracking so swipe down/up works even if the pointer leaves the handle.
- Added final CSS overrides to remove unnecessary top spacing in decorate mode.
- Kept the outer modal/page locked while only the journal entry body scrolls.
- Kept the decoration panel as a bottom sheet that collapses to the handle and expands again.

Build check:

- `next build --webpack` compiled successfully in this environment.
- Turbopack was not used locally because this workspace has a symlinked node_modules setup; Vercel will install normal dependencies.
