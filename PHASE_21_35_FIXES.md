# Tempo Phase 21-35 reliability fixes

Implemented in this handoff:

1. Fixed Google all-day event handling so date-only Google events respect the app timezone and Google's exclusive end-date model.
2. Added safer Google event normalization with explicit read-only imported event metadata.
3. Preserved Google recurring event metadata such as recurring event IDs, original start times, iCalUIDs, and sequence numbers.
4. Handled cancelled Google events without fabricating invalid start/end dates.
5. Improved Google import merging so missing synced Google events are marked removed instead of lingering forever.
6. Prevented local Tempo events from being overwritten if a Google event ID collides with a local event ID.
7. Added sync-window awareness to Google imports so stale cleanup only applies to imported Google events in the synced window.
8. Cleaned hidden Google calendar IDs against the actual connected Google calendar list.
9. Made Google disconnect remove only imported Google Calendar events, not arbitrary local events with a matching source string.
10. Replaced placeholder Google webhook behavior with a safer acknowledgement endpoint that can validate an optional webhook token.
11. Switched the Supabase browser client from CDN loading to the bundled `@supabase/supabase-js` package.
12. Changed anonymous browser identity persistence from `sessionStorage` to `localStorage` so anonymous local data is less likely to disappear between browser sessions.
13. Added cloud hydration protection so fallback local data is not immediately written back over slow cloud data before cloud load resolves.
14. Hardened persisted event date revival so invalid or missing dates are normalized defensively before rendering/saving.
15. Standardized reminder time validation so invalid times such as `99:99` are rejected instead of silently clamped.
16. Padded reminder date keys to stable `YYYY-MM-DD` format.
17. Added reminder metadata for task period/date targeting so push actions are less likely to complete the wrong recurring task period.
18. Pruned and deduplicated snoozed reminders to prevent unbounded snooze growth.
19. Changed habit completion push actions to increment count by one instead of jumping directly to the target count.
20. Made memory journal saves local-first with cloud sync queued afterward, reducing journal data-loss risk when cloud save fails.
21. Removed the remaining active assistant/API route, setup doc, visible assistant UI entry points, assistant settings props/state, and assistant CSS references. Existing stored user data keys are not force-deleted from Supabase; they simply are no longer used by the app.
22. Removed leftover backup patch files from the production zip.

Validation performed:

- Server/lib JavaScript syntax checks passed with `node --check` for API routes and `lib/tempo/*.js`.
- A static relative import scan found no unresolved relative imports.
- Full `next build` was not run in this container because the local environment does not match the project `engines` requirement (`node 24.x`, `npm >=11 <12`) and dependency installation was not completed here.

Recommended deployment check after uploading to Vercel:

- Confirm Vercel uses Node 24.x.
- Redeploy with the existing production env vars, including `GOOGLE_TOKEN_ENCRYPTION_KEY`.
- Reconnect Google Calendar once if old plaintext tokens fail migration.
- Test a one-day all-day Google event, a cancelled event, a snoozed reminder, and a recurring task reminder action.
