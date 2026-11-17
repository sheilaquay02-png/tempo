# Mini Tempo V1 — implementation and release gates

**Status:** development / review-only. User has authorised implementation in a separate branch, **not merge or deployment**.

## What's implemented on this branch

1. Windows Electron shell under `desktop/`: Mini, Full and separate Recorder windows; narrow IPC; context isolation, sandbox, Node integration disabled; same-origin navigation guard; tray, pin, minimise, window restoration, launch-at-login opt-in and unsaved-draft close confirmation.
2. Routes `/mini` and `/recorder`, both rendering the authenticated Tempo application, not a separate database.
3. Mini Today tasks, quick task entry, next event, daily spending, privacy toggle, sync indicator and Quick Add.
4. One-tap expense recording from Full Tempo Today and global Quick Add; Windows launches a dedicated recorder window.
5. Existing `BudgetTransactionPopup` and **unchanged** `BudgetAmountKeypad` reused in all contexts. The standalone recorder has an extra button *outside* the keypad for Save & Add Another. The existing ✓ is Save & Close.
6. Calendar Event and Add Event dialogs have an optional *single estimated amount*, default ledger and default card. Estimates do not count toward actual expenditure.
7. Linked expense display and explicit link/unlink within event details, with multiple transactions per event. No money amount in Calendar grid.
8. Budget transaction normalizer preserves `linkedEventId`; Finance helper tests ensure idempotent append by transaction ID and exclude planned estimates from actual spending.

## Important release gates — NOT YET COMPLETE

### Phase 2 financial synchronisation — code implemented, migration NOT applied

The branch now contains a record-level financial design:

1. `supabase/tempo_budget_records_phase2.sql` creates per-user transaction rows, row-level security policies, an idempotent operation log, a historical snapshot seed function, and a compare-and-swap RPC with per-record revisions.
2. `lib/tempo/client/budgetRecordSync.js` adds a durable, user-scoped operation journal. Record creation, editing, linking and deletion are represented as explicit operations; deletions are tombstones. Changes are stored in the journal before an optimistic UI update.
3. Duplicate retries reuse the operation ID; stale same-record revisions produce a conflict response while keeping the offline operation for review. Different transaction IDs are independent.
4. Cloud hydration reads the new table rather than trusting a timestamp-selected `settings.budgetTransactions` snapshot. Pending offline operations overlay the server rows, and old local-only records are conservatively imported.
5. Budget edits fail closed when the backend has not been initialised or secure same-origin journal locking is unavailable. Existing Budget popup save actions retain drafts if their journal commit fails.
6. Startup, focus and online events retry queued writes; Supabase Realtime can trigger refetches of updated records.

**Do NOT merge or deploy this branch yet.** The SQL migration is only in GitHub, and has **not** been run on the live Supabase database. The Next.js CI tests use an in-memory RPC simulation, not a live Supabase environment.

#### Controlled rollout checklist

- [ ] Back up the full `public.user_data` table, particularly `settings.budgetTransactions`; take a DB snapshot.
- [ ] Test the SQL migration on a disposable Supabase project with realistic Budget data and authenticated users.
- [ ] Verify two users cannot select, edit, seed or query one another's transactions (RLS).
- [ ] Verify duplicate operation IDs are idempotent, stale revisions conflict, deleted rows stay tombstoned and 1,000+ records paginate completely.
- [ ] Verify local/offline queue survives close/restart and every supported phone/browser provides Web Locks, or implement an equivalent atomic journal fallback.
- [ ] Verify Google/Apple OAuth and sign-out across Windows Mini, Full and recorder.
- [ ] Test offline/online, two-device simultaneous creates, overlapping edits, rapid repeated saves and insufficient local storage.
- [x] Implement a side-by-side Budget conflict review screen with explicit **Use cloud**, **Keep my version**, and **Save as separate transaction** choices, including durable conflict state and independent syncing of unrelated records.\n- [ ] Validate that conflict resolution, mobile layouts, and focus handling work correctly against a real Supabase staging project.
- [ ] Apply the schema migration in production *before* deploying any new client; verify Supabase Realtime table publication.
- [ ] Stage all new clients together to avoid an outdated client treating the old JSON snapshot as authoritative.
- [ ] Have a rollback/export plan that copies authoritative record rows back into a compatible snapshot before returning to legacy clients.

The legacy `settings.budgetTransactions` field remains as a backup/migration bridge. New clients must treat the record table as the single financial source of truth. The rest of Tempo's settings still uses the pre-existing snapshot storage system, which is outside this Phase 2 migration.


### Windows packaging

`desktop/package.json` uses Electron but no signed installer or desktop dependency lockfile has been generated. The project has not yet been run interactively in Windows. The wrapper loads a separately configured approved Tempo URL; it does not bundle the Next.js API server and no live deployment is included.

### Functional QA

- Inspect mobile and desktop rendering, especially the existing Budget keypad.
- Windows login, sign-out, shared sessions and OAuth redirects.
- Test the recorder on different Windows DPI scaling factors and monitors.
- Full/Mini window coexistence; app restart; tray hide/quit; pin-on-top behavior.
- Normal ✓ Save & Close; Save & Add Another keeps account/card/date and clears transaction-specific fields.
- Unsaved-draft handling for both window-close and quit.
- Multiple rapid saves, failed local storage, offline/reconnect and simultaneous writes across two devices.
- Event recurrence, moved occurrences, Google calendar resync and imported Google events.
- Budget account balance, transfers, income and protected-card regressions.
- Accessibility keyboard navigation for focus and modals.

### Known follow-ups

- Imported Google Calendar events need a durable Tempo-private event-spending-plan mapping if the user wants estimates on read-only imported events; link/unlink is already available.
- Unify the remaining Schedule/Budget/Overall mode navigation only after checking that doing so doesn't disrupt existing Budget navigation on phone.
- Desktop auto-update, installer signing and distribution are intentionally out of scope until explicit release approval.
- Improve window-to-window same-device immediacy beyond the current local snapshot/reload and cloud reconciliation.

## Phase 2 additional validation artifacts\n\n- `tests/budget-record-sync-phase2.test.mjs`: simulated independent writes, stale same-record edits, retries, tombstones, and all explicit conflict decisions.\n- `scripts/verify-budget-phase2-staging.mjs`: **opt-in only** integration harness requiring two test accounts in a disposable Supabase project. Never run in production.\n- `docs/tempo_budget_phase2_staging_checklist.md`: database migration, RLS, rollback and staging acceptance checklist.\n\n**No live Supabase test has been performed yet; GitHub CI only runs simulations and build checks.**\n\n## Manual local validation (after installing dependencies)

```bash
npm ci
npm test
npm run lint
npm run build
# In another terminal, npm run dev
# In a second terminal: cd desktop && npm install
# Windows PowerShell: $env:TEMPO_DEV="1"; $env:TEMPO_DESKTOP_URL="http://localhost:3000"; npm start
```

No merges or deployments are performed by the draft pull request.
