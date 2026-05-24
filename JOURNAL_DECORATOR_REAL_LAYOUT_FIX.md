# Journal Decorator Real Layout Fix

This patch addresses the remaining decorator issues reported from the deployed UI:

- The bottom decoration sheet now actually collapses/expands.
- The sheet content is not rendered while collapsed, so it cannot remain visible below the handle.
- Swipe/drag handling is registered globally during the pointer gesture so dragging down can close the sheet even if the pointer leaves the handle.
- The journal entry modal is pinned to the top of the viewport in decorate mode to remove the unnecessary empty space above the card.
- Decoration placement now measures the full journal scroll content and applies an explicit pixel-sized decoration layer, so stickers/tape stay anchored to the saved journal page rather than the visible viewport.
- Added final high-specificity CSS overrides for decorate mode layout.

Validation performed here: TypeScript JSX transpile syntax check passed for `components/TempoApp.jsx`.
