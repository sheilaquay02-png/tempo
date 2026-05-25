# Phase 36–50 Reliability Fixes

This phase was applied conservatively to avoid changing Tempo's core user mechanics. The restored local Tempo Assistant remains in place and no OpenAI/API assistant feature was added.

## Fixed / hardened

- Normalized push reminder timezone handling using each user's saved Tempo timezone, with a safe Singapore fallback.
- Hardened reminder date keys so push actions use the user's local date instead of UTC when a fallback is needed.
- Tightened task and habit reminder time parsing so invalid times do not silently pass as custom reminder times.
- Clamped reminder cron lookback/lookahead windows to prevent accidental oversized runs.
- Added safe parsing for the optional reminder test `now` parameter.
- Added in-run reminder candidate deduplication before inserting/sending notifications.
- Kept snoozed reminder cleanup bounded and made snoozed reminder metadata carry timezone context.
- Added a lightweight push-action rate limiter to reduce token replay/brute-force abuse.
- Sanitized push reminder server errors in production.
- Made journal photo preview generation use a compressed browser preview instead of storing huge full-size data URLs in state/local cache.
- Preserved local-first journal save behavior: the memory is saved locally even when cloud sync is pending.
- Confirmed no `/api/assistant` route, OpenAI call, or OpenAI env requirement exists in this build.
- Standardized direct string toasts through a small `showToast()` helper while leaving existing toast behavior unchanged.

## Intentionally not changed

- The local Tempo Assistant/chatbot was not removed or replaced.
- Calendar, task, habit, journal, and decoration core flows were not redesigned.
- Mobile journal decoration editing remains disabled as requested; existing decorations still display.

## Validation

- `node --check` passed for `lib/tempo/core.js`, `styles/tempoStyles.js`, and all `app/api/**/route.js` files.
- The zip excludes `.env.local`, `.git`, `.npm-cache`, `node_modules`, and `.next`.
