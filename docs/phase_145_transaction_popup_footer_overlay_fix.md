# Phase 145 transaction popup footer overlay fix

This patch fixes the mobile transaction recorder when the fixed Budget footer covers the confirm keypad.

## Changes

- Renders the transaction recorder popup through a document-level React portal so it is no longer trapped by the Budget page scroll container or app stacking context.
- On mobile, constrains the popup overlay to the viewport area above the fixed six-button footer using `var(--mobile-nav-h)`.
- Turns the popup sheet into a fixed-height flex bottom sheet with internal scrolling.
- Makes the keypad sticky inside the sheet, so the confirm check button remains visible and tappable above the footer.
- Keeps the existing balanced Budget Home footer scroll spacing from the prior Phase 145 correction.

## Validation

- `node scripts/validate-release.mjs`
- `node --test tests/*.test.mjs`
