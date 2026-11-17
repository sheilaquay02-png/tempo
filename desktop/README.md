# Tempo Windows companion (implementation branch)

Mini Tempo is an Electron desktop shell that displays the same hosted Tempo web app in three window modes:

- Full Tempo: `/`
- Mini Tempo: `/mini`
- Expense: `/recorder`

The shell uses a shared Electron partition for auth, locked navigation, sandboxed renderers, no Node integration, and an allowlisted IPC bridge. It does **not** embed credentials or deploy the web app.

## Local development

Install the root app separately using `npm ci` and start it using `npm run dev`.

In another terminal:

```powershell
cd desktop
npm install
$env:TEMPO_DEV="1"
$env:TEMPO_DESKTOP_URL="http://localhost:3000"
npm start
```

On production the `TEMPO_DESKTOP_URL` value must be an approved HTTPS Tempo origin. A release package and signing process are **not** configured yet; don't distribute a Windows installer or merge the feature branch until tested and explicitly approved.

## Safeguards

- Only one Mini/Full/Recorder window per process.
- Mini close hides to system tray, Quit exits.
- Window bounds and pin preference are stored on the Windows device, never in the cloud.
- The existing Budget form/keypad is rendered by the web app in recorder mode.
- Expense submission must commit to Tempo's real transaction store; this desktop wrapper alone does not guarantee multi-device conflict safety.
- Sign-out, offline sync, OAuth redirects, display scaling and Windows installer signing require manual acceptance testing.
