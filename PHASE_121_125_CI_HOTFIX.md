# Phase 121-125 CI Hotfix

This hotfix corrects the initial Tempo CI workflow added in Phase 121-125.

## Fixes

- Adds `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true` to the workflow so GitHub JavaScript actions are tested on Node 24.
- Runs release validation before `npm ci`, which avoids treating installed dependencies as release artifacts.
- Updates `scripts/validate-release.mjs` so it does not fail simply because CI has a normal `.git` checkout or `node_modules` after dependency installation.
- Keeps the release zip packaging rules unchanged: `.env.local`, `.git`, `.npm-cache`, `node_modules`, and `.next` are still excluded from generated zip files.

## Why this was needed

GitHub Actions checkouts contain `.git`, and `npm ci` creates `node_modules`. The original validation script incorrectly treated those normal CI working-tree folders as release zip failures.
