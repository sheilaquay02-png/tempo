# CI Node 24 Workflow Hotfix

This hotfix updates the GitHub Actions workflow so Tempo CI uses Node 24-native actions and can run whether the app is checked out at the repository root or inside a `tempo/` folder.

## Changes

- Updated `actions/checkout` to `@v5`.
- Updated `actions/setup-node` to `@v5`.
- Removed the `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24` workaround.
- Added an app-root detection step for `.` or `tempo/`.
- Disabled setup-node automatic package-manager caching to avoid cache-path issues when the app is nested.
- Added runtime version output for easier debugging.
- Every npm command now runs from the detected Tempo app root.

No app feature code was changed.
