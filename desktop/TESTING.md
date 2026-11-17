# Phase 3 — Mini Tempo Windows test checklist

This is a **manual Windows acceptance plan**, not an installer or a production release. The GitHub desktop test uses an Electron main-process mock and does not confirm Windows rendering. Use a disposable **local Supabase** instance with test data. No paid cloud resources are required.

## Setup (Windows)

1. Install Node.js 24, [Docker Desktop](https://www.docker.com/products/docker-desktop/) with WSL 2, and the local Supabase CLI (`npx supabase@2.122.1 --help`).
2. Check out `feature/mini-tempo-v1-desktop-companion`, not `main`. In the repository root, run `npm ci`.
3. Start the disposable Supabase stack using `npx supabase@2.122.1 start`. See `docs/tempo_budget_phase2_staging_checklist.md` for test schema setup and fixtures. Do **not** run `supabase link` or `db push`.
4. Populate the repository-root `.env.local` using **local** Supabase credentials from `npx supabase@2.122.1 status -o json`. Use `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321` and your local API key. Never paste production API keys in chat or a committed file.
5. In PowerShell terminal 1 run `npm run dev` from the repository root. In PowerShell terminal 2 run `./desktop/start-local-test.ps1`.
6. The launcher refuses to run if your `.env.local` contains the live Supabase domain. All test expenses must use synthetic data.

### Test cases

Check each item only after validating it in the real Windows app:

- [ ] Mini opens at a comfortable default size (~360×520), remains resizable to its minimum (~330×420), and remembers its size/position.
- [ ] Mini close hides to the tray; reopen from tray and second-instance launch do not create duplicates.
- [ ] Pin Mini on top, restart, and confirm the pin icon and preference restore correctly.
- [ ] Open the recorder while Mini is pinned: recorder stays in front. Hide Mini: recorder remains visible.
- [ ] Open Full Tempo and Recorder repeatedly: at most one instance of each exists.
- [ ] On desktop and mobile, verify the four primary tabs Today, Calendar, Tasks, Budget. Budget still exposes its existing Home, Account, Transactions, Budget and Settings sections.
- [ ] Mini's top three tasks and next event correspond to the same fake account in Full Tempo, including an event scheduled tomorrow or later.
- [ ] Mark a task complete. It must remain visible with an **Undo** control. Undo, add a task, and check the same data in Full Tempo and after restart.
- [ ] Record Expense opens the original **Budget keypad** with its unchanged 4×4 layout, currency key and ✓ key.
- [ ] Press ✓ or Ctrl+Enter: one expense persists locally, recorder closes, and Mini spent-today refreshes.
- [ ] Press Save & Add Another: one transaction persists, recorder remains open, amount/description/tags/notes clear, account/ledger/card/date and event association remain, and amount field receives focus.
- [ ] Rapidly click Save repeatedly: no duplicate transactions are created.
- [ ] Change amount, note, tags, date or card; closing the recorder requests confirmation. Cancel keeps the draft open.
- [ ] Use tray Quit with an unsaved recorder: can keep editing or discard deliberately.
- [ ] With Mini open and financial sync initialised, disconnect internet, enter an expense in the **inline Budget recorder**, verify local queued status, reconnect and confirm exactly one cloud record.
- [ ] Cold-start with the app web server unavailable: the non-financial offline page appears. Restart the server and press **Retry connection**; the correct Mini route should return.
- [ ] Create conflicting changes from two windows; verify warning/review and all three resolution choices.
- [ ] Test a second dummy user: records never carry over between logins.
- [ ] Test the standalone recorder at 100%, 125%, 150% Windows scaling; keypad/Save & Add Another remains visible.
- [ ] Navigate with keyboard only and check the amount input, keypad and close confirmation.
- [ ] Check Account, Ledger, Card, Income and Transfer in original Budget, confirming no regressions.
- [ ] Sign out/in from Mini and Full; ensure both windows never display another user's finance data.

## Automated coverage before manual QA

Run `npm test`, `npm run lint`, `npm run build` at the root. The Node test `tests/mini-tempo-desktop-shell-phase3.test.mjs` mocks Electron to exercise singleton windows, tray, pin, navigation restrictions, recorder close, OS quit and sync-refresh hooks. `tests/mini-tempo-recorder-phase3.test.mjs` tests draft protection and Save & Add Another reset semantics.

These checks do **not** replace a human Windows GUI test or verify a packaged installer, Microsoft code signing, browser OAuth, or online app deployment. **Cold offline starts still cannot record expenses**; an already-running, authenticated Mini can queue offline records until connectivity returns.

## Release boundary

**Do not merge PR #3, publish a Windows installer, run production SQL, or deploy** until all critical manual checks are complete and the owner explicitly approves. Local Docker use and existing GitHub Actions minutes incur no new Supabase charge; check GitHub's included minutes if repeated tests are needed.
