# Tempo desktop app (macOS and Windows)

Mini Tempo is an Electron shell displaying Tempo's task and calendar interface. It shares an authenticated web session with the Full Tempo window.

- Mini Tempo: `/mini` (tasks, next event, task quick add, completion)
- Full Tempo: `/` (all existing Tempo features, including Budget)

The former separate expense recorder window and tray action have been removed **from the desktop companion only**. Full Tempo retains its Budget features and transaction storage.

The shell does not bundle a Next.js server or Supabase database. It uses context isolation, sandboxing, disabled Node integration, restricted navigation and narrowly scoped IPC. Cold offline startup displays an explanatory Retry screen.

## Personal Mac app

Build on the Mac you will use it on (Apple Silicon or Intel). The result is a normal `Tempo.app` that shows your hosted Tempo site, with a small menu-bar icon (Open Mini Tempo, Open Full Tempo, Launch at login, Quit).

```bash
cd desktop
npm install --no-audit --no-fund
TEMPO_PERSONAL_PACKAGE_APPROVED=YES TEMPO_PERSONAL_ORIGIN=https://temposchedule.vercel.app npm run package:mac:personal
```

Output: `desktop/out/Tempo-darwin-<arch>/Tempo.app`. Install it:

```bash
ditto --norsrc --noextattr --noqtn desktop/out/Tempo-darwin-*/Tempo.app /Applications/Tempo.app
xattr -cr /Applications/Tempo.app
codesign --force --deep --sign - /Applications/Tempo.app
```

Sign again in `/Applications` because iCloud-synced folders (such as Desktop) add file attributes that break the signature. Then delete `desktop/out` so the 250 MB build is not synced to iCloud.

The app is **ad-hoc signed for this Mac only** and not notarized: `spctl` reports it as rejected, which is expected, and it opens normally because it was built locally. Giving copies to other people needs an Apple Developer ID and notarization. The website must be reachable (no offline mode); website updates appear in the app automatically.

## Local-only QA (safe disposable test environment)

Use `start-local-test.ps1` with disposable Supabase and a localhost Next.js server using `TEMPO_QA_LOCAL_ONLY=1`. The QA wrapper explicitly refuses hosted resources. To build the QA folder on Windows:

```powershell
cd desktop
npm install --no-audit --no-fund
npm run package:windows:qa
```

Output: `desktop/out/MiniTempo-LocalQA-win32-x64/`. This **requires localhost and the disposable test stack**; it is not a personal release. Do not use real accounts with QA.

## Personal portable package (pre-release, gated)

The personal build is a separate, **unsigned and portable**, Windows executable. It reads an HTTPS origin pinned into the packaged entrypoint. It does not upload anything to Vercel, change Supabase settings, or include production credentials.

**Do not build or use with your real account yet.** First confirm the updated `/mini` route is on an approved HTTPS deployment, production authentication and the task/calendar sync are tested, and the release is approved. Packaging alone does not publish the updated web interface.

After those release checks, on Windows:

```powershell
cd Z:\Documents\GitHub\tempo\desktop
npm install --no-audit --no-fund
$env:TEMPO_PERSONAL_ORIGIN = "https://YOUR_APPROVED_TEMPO_DOMAIN"
$env:TEMPO_PERSONAL_PACKAGE_APPROVED = "YES"
npm run package:windows:personal
```

Output: `desktop/out/MiniTempo-Personal-win32-x64/MiniTempo-Personal.exe`. Keep the whole output directory together. It is **not a signed installer**; Windows may display SmartScreen warnings. The app still needs an internet connection on cold start, although already-loaded web sessions may have browser caching. Do not assume task edits can be queued offline without separately verifying that behavior.

## App behavior and safeguards

- Single Mini instance, plus an optional Full Tempo window
- Close hides Mini to tray; tray Quit exits
- Optional launch at Windows login
- Local window position and pin setting
- No Mini budgeting surface or expense recorder IPC
- No production release should occur without explicit approval and verification of HTTPS route, auth, and syncing
- Existing Full Tempo Budget and Supabase transaction data are not removed by desktop packaging

## Remaining release work

Verify the Windows executable on the target PC, account login/sign-out, two-window task sync, compact layout, task quick-add and undo, offline recovery, and controlled promotion of the updated web interface. Configure code signing if distributing to other users.
