# Phase 12 reminder cron hotfix

## Problem

The GitHub Actions workflow `Tempo reminder check` was failing at the `call-reminder-endpoint` step with `Process completed with exit code 3`.

`curl` exit code 3 usually means the URL is malformed. In this workflow, the most likely cause is an empty or invalid `TEMPO_APP_URL` GitHub repository secret.

## Fix added

The workflow now validates required secrets before calling the reminder endpoint:

- `TEMPO_APP_URL` must exist.
- `TEMPO_APP_URL` must start with `https://` or `http://`.
- Any trailing slash is removed automatically.
- `CRON_SECRET` must exist.
- The request now sends a small `{}` JSON body.
- Failed endpoint responses now print the API response body for easier debugging.

## Required GitHub repository secrets

Add these under GitHub repository settings:

```txt
TEMPO_APP_URL=https://your-tempo-app.vercel.app
CRON_SECRET=the-same-secret-you-set-in-vercel
```

`CRON_SECRET` must also exist in Vercel as an environment variable with the exact same value.

## Manual test

In GitHub Actions, open `Tempo reminder check` and run `Run workflow` manually.
