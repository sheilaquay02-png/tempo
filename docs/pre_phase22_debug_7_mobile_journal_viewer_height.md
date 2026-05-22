# Pre-Phase 22 Debug 7 — Mobile Journal Viewer Height

Fixes the mobile Journal entry viewer so it ends higher above the fixed footer menu.

Changes:
- The journal entry viewer overlay now reserves extra bottom clearance for the mobile footer.
- The viewer modal has a stricter mobile height calculation.
- The viewer body remains scrollable while the header stays visible.
- This applies specifically to the view-only Journal entry modal, not only the editor.
