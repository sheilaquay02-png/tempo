# Phase 145 mobile scroll + popup clipping fix

This patch corrects two mobile issues after the previous footer-clearance change:

- Budget Home had too much extra scroll space after the stronger footer spacer.
- The transaction recorder popup could feel clipped on mobile screens.

Changes:

- Replaced the large Budget Home spacer with a balanced mobile bottom padding of `var(--mobile-nav-h) + 28px`.
- Disabled the extra pseudo-element spacer and last-child margin added by the previous hard fix.
- Made the transaction popup a compact mobile bottom sheet with `100dvh` max height and internal scrolling.
- Reduced mobile popup amount/keypad/control heights so all controls remain reachable.
- Re-applied the sidebar emoji switcher spacing correction so the switcher spacing remains even.

Validation:

- `node scripts/validate-release.mjs`
- `node --test tests/*.test.mjs`
