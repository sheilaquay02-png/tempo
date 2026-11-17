# Mini Tempo Phase 2 — Free testing and protected release checklist

**Owner approval:** Development in a separate GitHub branch only. No merge, deployment, new paid infrastructure, or changes to the live Supabase database are authorised.

## Verified on disposable local Supabase

The free GitHub Actions workflow `Tempo Budget local Supabase checks (disposable)` runs a *local Docker-based Supabase stack* with actual local Auth, REST/PostgREST, PostgreSQL and Realtime services. It neither links to nor downloads from the production Supabase project.

**Result: 11 of 11 local integration checks passed.** The workflow tested:

1. Two fake users and a second signed-in window for one user
2. Idempotent import of fake legacy Budget transactions
3. Identical operation IDs replay without duplicate transactions
4. Concurrent creates with distinct transaction IDs both persist
5. Two simultaneous edits of one transaction yield a conflict
6. User B cannot read or change user A's financial records
7. Anonymous migration RPC and direct client UPDATE are denied
8. Tombstones stop a stale client resurrecting deleted transactions
9. The offline operation journal replays through real local REST/RPC
10. Authenticated Supabase Realtime receives a per-record update
11. Sign-out removes read access to the previous user's expenses

[Successful end-to-end local test run](https://github.com/sheilaquay02-png/tempo/actions/runs/44055781996)

The separate `Tempo Budget PostgreSQL migration checks` workflow also runs the actual SQL migration twice on an isolated PostgreSQL service and tests revisions, access control, safe deletion and idempotent operations.

## Local-only source files

- `supabase/config.toml` — isolated Supabase CLI project named `tempo-phase2-disposable`
- `scripts/sql/phase2-supabase-local-bootstrap.sql` — blank test-only `user_data` table
- `supabase/tempo_budget_records_phase2.sql` — proposed (not deployed) financial migration
- `scripts/verify-budget-phase2-local.mjs` — real local Auth, REST, Realtime and RLS integration tests
- `.github/workflows/budget-local-supabase.yml` — reproducible disposable GitHub runner

The local test has explicit hard stops: `http://127.0.0.1:54321` (or localhost), exact loopback port, a local-only confirmation variable, and locally generated synthetic accounts. It will not accept `*.supabase.co` URLs.

### Reproducing locally (optional)

The GitHub Action already performs these steps automatically. For manual development, install Node.js 24, Docker Desktop (or a Docker-compatible runtime), and the PostgreSQL command-line client, then run the same workflow commands with the exact pinned Supabase CLI version:

```bash
npm ci
npx --yes supabase@2.122.1 --help
npx --yes supabase@2.122.1 start --help
npx --yes supabase@2.122.1 start

PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -X -v ON_ERROR_STOP=1 -f scripts/sql/phase2-supabase-local-bootstrap.sql
PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -X -v ON_ERROR_STOP=1 -f supabase/tempo_budget_records_phase2.sql
```

Then set `TEMPO_LOCAL_SUPABASE_URL=http://127.0.0.1:54321`, `TEMPO_LOCAL_ANON_KEY` from `npx --yes supabase@2.122.1 status -o json`, and `TEMPO_LOCAL_TEST_CONFIRM=DISPOSABLE_LOCAL_ONLY` in your terminal. Execute:

```bash
npm run test:budget:local
npx --yes supabase@2.122.1 stop --no-backup
```

Never link the local environment to production, run `db push`, or copy real Tempo financial records to it. These scripts assume a disposable database and `stop --no-backup` removes local test data.

## What this does NOT validate

- Windows Electron windows and native installer behaviour on an actual Windows computer
- Entire Tempo interface interaction, keypad tapping, focus, accessibility and screen scaling
- Multi-device offline edits using real separate browsers/phones and intermittent connectivity
- Full existing Budget regression testing for all account/card/transfer variations
- A production transition where older deployed Tempo clients still use the legacy snapshot
- Real production account backups and migration reconciliation

**Hosted Supabase staging is not required for this free development phase.** No paid Supabase branch or second hosted project will be created. GitHub Actions uses included runner minutes; costs could apply if the account's free usage allowance is exceeded, so keep the heavy local workflow scoped to the files that affect it.

## Remaining release gates — no production approval yet

1. Manual Windows and browser acceptance tests with fake data, particularly existing Budget keypad and popout Save & Close / Save & Add Another
2. Full offline/online, app restart and two-device duplicate/conflict tests
3. Security review of the auth-scoped `SECURITY DEFINER` RPCs and row-level security in the target Supabase configuration
4. Export and verify a complete production backup and all historical Budget transaction IDs and totals
5. Prevent old clients from writing authoritative financial snapshots during the transition
6. Verify a tested rollback/reconciliation plan so new per-record expenses are not lost on an old-client rollback
7. Obtain the owner's **separate explicit approval** before any production SQL migration, merge or deployment

Your existing Budget UI and keypad are unchanged on the live app. This plan leaves Draft Pull Request #3 open and unmerged.
