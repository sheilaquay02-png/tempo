# Vercel npm ci Fix

This update fixes the Vercel install failure where `npm ci --no-audit --no-fund` exited with code 1.

Changes made:

- Kept Node runtime at `24.x`.
- Removed `packageManager: npm@10.9.2` so Vercel can use the Node 24 bundled npm 11 instead of forcing npm 10.
- Updated npm engine to `>=11 <12`.
- Added `name`, `version`, and `private` to `package.json`.
- Updated `package-lock.json` root metadata to match `package.json`.
- Rewrote package-lock tarball URLs from the sandbox/internal registry to the public npm registry.
- Added `registry=https://registry.npmjs.org/` to `.npmrc`.

Deploy steps:

1. Upload this version to GitHub.
2. In Vercel, redeploy with **Clear Build Cache** enabled once.
3. Keep Project Settings Node.js version at **24.x**.

If Vercel still fails, open the full npm log and look for the first actual error line above `exited with 1`.
