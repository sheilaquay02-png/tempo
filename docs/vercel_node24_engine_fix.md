# Vercel Node 24 engine fix

This update changes the Vercel runtime target from Node 22 to Node 24 so the project follows the Vercel Project Settings runtime.

## Changed

- `package.json` now uses:
  - `engines.node`: `24.x`
  - `engines.npm`: `>=10 <12`
- Kept `packageManager` pinned to `npm@10.9.2` for deterministic installs.
- Kept `installCommand` as:
  - `npm ci --no-audit --no-fund`
- Kept `.npmrc` stability settings.

## Why

The previous update forced Node `22.x`, which overrode Vercel Project Settings set to Node `24.x`. Capacitor 8 requires Node `>=22.0.0`, so Node `24.x` satisfies Capacitor while matching the project-level runtime.

## Vercel deployment note

After deploying this version, clear the Vercel build cache once so Vercel re-installs dependencies using the updated engine.
