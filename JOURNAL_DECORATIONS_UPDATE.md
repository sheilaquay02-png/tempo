# Journal Decorations Update

This update removes the separate scrapbook page feature from Journal memories and replaces it with freeform entry decorations.

## Changed

- Removed the visible scrapbook page/editor UI from the journal entry modal.
- Added a new **Decorations** section for journal entries.
- Users can add **Tape** and **Sticker** decorations directly around the journal entry modal/view.
- Decorations can be dragged, resized, rotated, duplicated, removed, and layered.
- Stickers can still be chosen from the existing sticker packs and flipped horizontally/vertically.
- Tape can be typed into directly on the journal entry view.
- Saved journal entries now display decorations around the entry view instead of inside a separate scrapbook canvas.
- New saves no longer persist `scrapbookSize`.

## Compatibility

- Existing saved sticker/tape/text scrapbook blocks are normalized into journal decorations.
- Legacy text/quote blocks become tape notes.
- Legacy photo/divider scrapbook blocks are no longer shown as decorations, because the new feature is intentionally limited to tape and stickers around the entry view.
- Journal photos remain available in the normal Photos section.

## Validation

- JSX parse check passed with TypeScript parser.
- Server/core syntax checks passed with Node.
- No `.env.local`, `.git`, `.npm-cache`, or backup patch files are included.
