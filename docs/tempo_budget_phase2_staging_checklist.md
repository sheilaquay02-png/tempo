# Mini Tempo Phase 2 — Staging verification and controlled rollout

**Owner approval status:** Implementation approved in the separate branch. **Merging, deploying, production SQL changes and any use of live Budget records have NOT been approved.** This checklist prepares a safe later release; it is not permission to run the migration on live Supabase.

## Completed in the draft PR

- Dedicated, RLS-scoped transaction table; idempotent CAS RPC with server revisions and tombstones.
- Durable local user-scoped operation queue and retry on reconnect/restart.
- Transactions created independently on two devices are combined without replacing one another.
- Conflicting edits to the same transaction are preserved and displayed in Full Tempo.
- Three explicit resolution choices: **Use cloud version**, **Keep my version**, **Save my version as a separate transaction**. Saving an extra copy explains that it may increase expenses.
- One conflicted record does not prevent other expense records from syncing.
- Mini Tempo displays a Review Budget Conflicts shortcut when needed.
- Existing Budget account/card/ledger UI and 4-column keypad remain unchanged.
- Automated regression tests simulate two users, two devices, offline/retry, conflicts, safe deletes and local storage failure.

## Important: limitations

Automated GitHub CI is **not** a substitute for a real Supabase integration test. This branch contains an opt-in staging harness, but it has **not been run against Supabase**, and the SQL migration has **not been executed** anywhere by this implementation task.

Conflict reviews are intentionally conservative. A stale window trying to edit a record already changed locally may have its new unsaved action rejected; it must refresh before retrying. The UI is not yet fully optimised for mobile screen readers or keyboard focus trapping.

Other Tempo settings continue using the legacy snapshot sync. The Phase 2 change only makes Budget transactions the authoritative per-record dataset.

## New: Isolated real PostgreSQL validation

The development branch now includes `.github/workflows/budget-postgres-integration.yml`, which launches **a temporary PostgreSQL 16 service inside GitHub Actions**, creates fake auth roles and user records, runs the actual SQL migration twice, then checks RLS isolation, transaction writes, duplicate operation IDs, stale revisions, deletions, and direct-update denial.

The isolated PostgreSQL checks can be found under the GitHub Actions workflow named **Tempo Budget PostgreSQL migration checks**.

**Scope of this evidence:** A real PostgreSQL server executes the SQL, but its Supabase auth schema is represented by test stubs. This does **not** test actual Supabase Auth, API request headers, Realtime or a separate hosted Supabase project. Those checks remain mandatory and are blocked until staging account access is connected.

## Step 1 — Create an entirely disposable Supabase staging project

Do not use the Supabase project hosting your real Tempo app. The database migration can write tables and seed financial records.

Create two *test* user accounts in the separate staging project, using test email addresses. Do not reuse a real person's account or password. No confidential records are needed.

## Step 2 — Apply schema only in staging

1. Open the Supabase SQL Editor **in the disposable staging project**.
2. Review `supabase/tempo_budget_records_phase2.sql` for security, ownership and privilege assumptions.
3. Apply the SQL after a database backup.
4. Confirm `public.tempo_budget_transactions` and `public.tempo_budget_operations` exist and RLS is enabled.
5. Confirm `tempo_budget_seed_legacy` and `tempo_budget_apply` are callable by authenticated test users but not anonymous users.

The schema does not delete `public.user_data` and keeps historical `settings.budgetTransactions` intact.

## Step 3 — Run isolated staging checks with environment variables

On a machine with Node 24, install the root dependencies with `npm ci`. Supply these variables through a local, ignored `.env` or shell session, **never in chat or committed files**:

```text
TEMPO_STAGING_URL=<disposable Supabase URL>
TEMPO_STAGING_ANON_KEY=<staging project's public anon key>
TEMPO_STAGING_USER_A_EMAIL=<test user A email>
TEMPO_STAGING_USER_A_PASSWORD=<test user A password>
TEMPO_STAGING_USER_B_EMAIL=<test user B email>
TEMPO_STAGING_USER_B_PASSWORD=<test user B password>
TEMPO_STAGING_CONFIRM=I_AM_USING_A_DISPOSABLE_PROJECT
```

Optionally set `NEXT_PUBLIC_SUPABASE_URL` to the current production app's Supabase URL: the harness refuses to connect if it matches the staging URL.

Run:

```bash
npm run test:budget:staging
```

The harness tests: duplicate operation retries, independent concurrent creates, same-record conflicts, stale revision refusal, user isolation under RLS, direct table DML denial, and tombstone safety. Test entries are tombstoned in cleanup.

### Expected evidence

- Staging integration checks report all passed.
- No test user can read another user's transaction.
- Concurrent writes to distinct transactions persist both entries.
- Concurrent writes to one transaction produce one success and one conflict.
- A repeated operation ID is acknowledged without inserting a second entry.
- Client direct UPDATE is forbidden; the CAS RPC remains the only mutation path.
- A deleted transaction cannot be restored by an old revision.

## Step 4 — Manual app checks in staging

Check Full Tempo, Mini and Recorder on Windows and browser, plus mobile browser:
- Record two expenses with different amounts at the same time on two devices; verify both survive.
- Edit the *same* transaction on two devices; resolve the conflict using each of the three choices.
- Disconnect internet, record an expense, close/reopen, then reconnect; verify one final record, no duplicates.
- Modify a transaction from an event and verify links/estimates are private, with no Calendar grid spending indicators.
- Confirm the existing Budget keypad, Account, Ledger, Card, Income and Transfer controls still behave as before.
- Simulate full local storage, sign-out and sign-in with a different test account; no financial data may leak.
- Verify keyboard navigation and Windows scaling/tray behaviour.

## Step 5 — Production deployment (NOT authorised yet)

Only after staging and your explicit release approval:
1. Export and verify a complete backup of `public.user_data`, especially every user's old Budget transactions, and any existing new-ledger records.
2. Plan simultaneous client/version transition and assess old PWA caches or desktops using the legacy snapshot format.
3. Apply the reviewed migration to production with a rollback plan.
4. Validate RLS and record counts for a test account.
5. Deploy approved app version.
6. Compare transaction counts, amounts and per-user IDs to backups; confirm no historical losses.
7. Monitor pending and conflict state before announcing readiness.

**Rollback warning:** New per-record writes may not be reflected in the old settings snapshot. Rolling back to legacy clients without reconciling those writes could hide or lose expenses. Do not uninstall the new schema or revert clients without an export/reconciliation step.
