# Pre Phase 22 Debug 10 — CSS Build Fix

Fixed a build-breaking syntax issue in `styles/tempoStyles.js` where a mobile Journal header media query was accidentally appended outside the exported CSS template string.

## Fix

- Moved the Journal mobile header CSS back inside `appCSS()` template output.
- Preserved the mobile Journal header behavior: non-sticky, opaque, and scrolls normally.
- Verified with `node --check styles/tempoStyles.js`.
- Verified with `npm run build`.
