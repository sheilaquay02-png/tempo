# Tempo reminder cron setup

Vercel Hobby only allows cron jobs that run once per day. Do **not** configure `/api/push/reminders` as a 5-minute Vercel Cron on Hobby, or deployment will fail.

This build keeps `vercel.json` cron-free so it deploys safely on Hobby. Use one of these options for practical reminders:

## Option A — GitHub Actions

The repo includes `.github/workflows/tempo-reminders.yml`.

Add these GitHub repository secrets:

- `TEMPO_APP_URL` — for example, `https://your-tempo-app.vercel.app`
- `CRON_SECRET` — must match the `CRON_SECRET` environment variable in Vercel

The workflow calls:

```
POST /api/push/reminders
Authorization: Bearer <CRON_SECRET>
```

## Option B — External cron service

Use any external scheduler that can call the endpoint every 5 minutes.

Request:

```
POST https://your-tempo-app.vercel.app/api/push/reminders
Authorization: Bearer <CRON_SECRET>
```

Alternative header supported:

```
x-tempo-push-secret: <TEMPO_PUSH_SECRET>
```

## Why not Vercel Cron on Hobby?

Reminders need frequent checks. Vercel Hobby only supports daily cron runs, so a 5-minute reminder cron belongs outside Vercel unless the project is upgraded to Pro.
