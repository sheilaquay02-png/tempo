# Mini Tempo V1 — implementation and release gates

**Status:** development on `feature/mini-tempo-v1-desktop-companion` in **Draft PR #3**. The owner has approved implementation in this separate branch only. **No merge, deploy, production Supabase migration, live data edits, paid infrastructure or distribution is authorised.**

## V1 navigation and daily companion

- Four primary navigation tabs: **Today / Calendar / Tasks / Budget**, on desktop and mobile. The original Budget screen and existing Budget subpages (Home, Account, Transactions, Budget, Settings) remain accessible.
- The existing Overall page remains a secondary option rather than a fifth primary tab.
- Today displays upcoming tasks/events and today's **recorded** spending, with one-tap expense recording and Quick Add.
- Mini Tempo (~360×520 px) shows today's three priority tasks, add-task input, the next event within the next 30 days, recorded spending, quick record, sync state, pin, tray and Open Full.
- A checked task remains visible with an explicit **Undo** action instead of disappearing instantly.
- The next event includes its date, so events on future days are unambiguous.

## Existing Budget recorder, unchanged keypad

- `BudgetTransactionPopup` and `BudgetAmountKeypad` are reused from the original Budget component; the existing keypad layout and ✓ action remain intact.
- **Save & Close** is primary; **Save & Add Another** is a separate button outside the keypad. The secondary action retains account, ledger, card, date and explicit event link while resetting amount, description, notes and tags.
- Editing any unsaved draft field (including date/card/type/tags/amount/description) requires confirmation before close/quit.
- A per-record local financial journal is written before the expense is reported as locally saved; repeated clicks are guarded against duplicate submissions.

## Private Calendar spending links

- Optional **single estimated total**, default ledger and Budget card exist only inside event details/editor.
- Actual expenses can be linked/unlinked to a specific event occurrence without creating a duplicate charge. Deleting an event never deletes its recorded transactions.
- The Calendar grid itself shows no spending overlays.
- Repeating-event edits, split series and third-party imported calendar persistence require further end-to-end review before release.

## Phase 2: financial sync — implemented and locally tested

- `supabase/tempo_budget_records_phase2.sql` adds per-user transactions, RLS, idempotent operation receipts, revisions, compare-and-swap mutations and tombstones.
- `lib/tempo/client/budgetRecordSync.js` adds the durable offline queue, cross-window write locking, conflict detection and explicit resolutions.
- Full/Mini/Recorder use the same authenticated Tempo store; the legacy settings snapshot remains for compatibility and migration safety but is not intended to overwrite the new financial ledger.
- **11/11 real local Supabase integration checks passed** on a disposable GitHub runner with local Auth, PostgREST, database, Realtime, two fake accounts, concurrent edits, conflict detection, queued offline replay and sign-out isolation.
- Separate isolated PostgreSQL migration tests also passed.
- **The migration has NOT been applied to live Supabase.** Production schema, old-client compatibility, backups, rollback and historical-record reconciliation remain mandatory release gates.

See `docs/tempo_budget_phase2_staging_checklist.md` and `.github/workflows/budget-local-supabase.yml` for free verification.

## Phase 3: Windows shell and offline boundaries

- Electron includes one Mini, Full and expense window per process; tray/always-on-top/window preferences and a restricted preload/IPC bridge.
- Desktop shell tests mock Electron to exercise window lifecycle, safe navigation, quit/close draft protection, same-window reload and pin/recorder stacking.
- **If the desktop web application cannot load from a cold start, it displays a bundled static "Retry connection" page. This page contains no user financial records and cannot record an expense.**
- If Mini is **already loaded and the account has completed an initial financial sync**, losing connectivity uses the existing Budget popup inside Mini so an expense can be stored in the local offline queue. It synchronises when connectivity returns.
- **A full offline cold start and guaranteed offline reopening after quitting are NOT supported in V1 as currently implemented**. The web app is still served by an external/local Next.js server; no bundled offline Next.js server or static application distribution has been built.
- No installer, signing or actual Windows display/keyboard/screen-scaling test has been completed.

See `desktop/TESTING.md` and `desktop/start-local-test.ps1` for guarded, fake-data manual testing steps.

## Outstanding acceptance gates before owner approval

1. **No data loss:** Back up the existing production `user_data` data and every Budget record, verify IDs/totals, and rehearse the record-level migration/rollback with old-client coexistence safeguards.
2. **Windows GUI:** Verify actual Mini/Recorder/Full operation, login, tray, pin, scaling (100/125/150%), accessibility, single-window behaviour and record/undo tasks.
3. **Budget regression:** Test account, ledger, card, income, transfer, normal keypad ✓, Save & Add Another, transaction links and offline/reconnect replay.
4. **Navigation:** Confirm exactly four accessible primary tabs and all nested Budget pages on desktop/mobile without changing Budget content.
5. **Conflict UX:** Exercise the three explicit resolution choices on two devices; confirm neither record disappears without consent.
6. **Event recurrence:** Verify event-occurrence links, moved/deleted occurrences and Google Calendar imports/resyncs.
7. **Desktop distribution:** Decide how a local-only or hosted runtime should be distributed, prepare a real Windows test build, and test signing/installer needs. A packaged app is not yet available.
8. **Approval:** Present test evidence and migration/rollback plan, then obtain separate explicit owner approval before *any* merge, deployment, production SQL, or installer distribution.

**Cost rule:** Keep to existing free GitHub Actions allowances and local Docker tools. Do not provision paid Supabase branches or infrastructure.

## Development checks

```bash
npm ci
npm test
npm run lint
npm run build
# The local-only Supabase Docker integration job runs through GitHub Actions
# Manual Windows checks are described in desktop/TESTING.md
```

Passing CI is necessary but not sufficient for release.
