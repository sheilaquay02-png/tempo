# Vercel Install Fix

This version removes the stricter `npm ci` install command because the Vercel deployment was failing at install with `Command "npm ci --no-audit --no-fund" exited with 1`.

Changes made:

- Kept Node runtime at `24.x`.
- Removed `packageManager: npm@10.9.2` so Vercel can use the npm version bundled with Node 24 instead of forcing npm 10.
- Set npm engine to `>=11 <12`.
- Changed Vercel install command to `npm install --no-audit --no-fund --prefer-online`.
- Added `name`, `version`, and `private` to `package.json`.
- Updated `package-lock.json` root metadata to match `package.json`.
- Rewrote package-lock tarball URLs from the sandbox/internal registry to the public npm registry.
- Added `registry=https://registry.npmjs.org/` to `.npmrc`.

Deploy steps:

1. Upload this version to GitHub.
2. In Vercel, redeploy with **Clear Build Cache** enabled once.
3. Keep Project Settings Node.js version at **24.x**.

If Vercel still fails, open the full npm log and copy the first actual error above `exited with 1`.
