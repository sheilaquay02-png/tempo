# Mini Tempo Windows QA launcher. Only connects to local Next.js and local Supabase.
# Run from Windows PowerShell after starting a disposable local Supabase stack
# and the Next.js dev server. Does not connect to or modify the live Tempo app.
$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$EnvFile = Join-Path $Root ".env.local"

if (-not (Test-Path $EnvFile)) {
  throw "Create root .env.local using only LOCAL Supabase credentials before desktop testing. Never copy production API keys."
}
$Values = Get-Content $EnvFile -Raw
if ($Values -match 'zyrxfrmkvqwtxffzgvtj' -or $Values -match 'https://[^\s#]+\.supabase\.co') {
  throw "Refusing to start: .env.local appears to reference hosted Supabase. This test must use localhost only."
}
if ($Values -notmatch '(?m)^\s*NEXT_PUBLIC_SUPABASE_URL\s*=\s*["'']?http://(127\.0\.0\.1|localhost):54321/?["'']?\s*$') {
  throw "Set NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 in root .env.local."
}
try {
  $Api = Invoke-WebRequest -Uri "http://127.0.0.1:54321/auth/v1/health" -TimeoutSec 4 -UseBasicParsing
} catch {
  throw "Local Supabase Auth is not running at 127.0.0.1:54321. Start the disposable stack first."
}
try {
  $Probe = Invoke-RestMethod -Uri "http://127.0.0.1:3000/api/tempo-qa-status" -TimeoutSec 5
  if ($Probe.localQa -ne $true) { throw "The local Tempo test-only endpoint was not verified." }
} catch {
  throw "Local Next.js must be running in QA mode with a disposable Supabase. In a separate terminal: `$env:TEMPO_QA_LOCAL_ONLY='1'; npm run dev`."
}
$env:TEMPO_QA_LOCAL_ONLY = "1"
$env:TEMPO_DEV = "1"
$env:TEMPO_DESKTOP_URL = "http://127.0.0.1:3000"
Write-Host "Opening Mini Tempo against local-only servers." -ForegroundColor Green
Push-Location $PSScriptRoot
try {
  npm install --no-audit --no-fund
  if ($LASTEXITCODE -ne 0) { throw "Electron dependency installation failed." }
  npm start
  if ($LASTEXITCODE -ne 0) { throw "Mini Tempo process ended with an error." }
} finally {
  Pop-Location
}
