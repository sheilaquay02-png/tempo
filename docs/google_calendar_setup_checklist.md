# Google Calendar live OAuth sync setup checklist

## Google Cloud

1. Create or open a Google Cloud project.
2. Enable the Google Calendar API.
3. Configure the OAuth consent screen.
4. Create an OAuth Client ID with application type: Web application.
5. Add the production redirect URI:
   - `https://YOUR_DOMAIN/api/google/auth/callback`
6. Add the local redirect URI for development:
   - `http://localhost:3000/api/google/auth/callback`

## Vercel environment variables

Add these server-side variables:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`
- `GOOGLE_TOKEN_ENCRYPTION_KEY`
- `GOOGLE_WEBHOOK_TOKEN`

Optional client feature flag:

- `NEXT_PUBLIC_GOOGLE_CALENDAR_ENABLED=true`

Keep `GOOGLE_CLIENT_SECRET`, `GOOGLE_TOKEN_ENCRYPTION_KEY`, and `GOOGLE_WEBHOOK_TOKEN` server-only.

## Supabase

Run:

- `supabase/google_calendar_sync_setup.sql`

Also confirm the current app setup has:

- `user_data`
- `push_subscriptions`
- `push_reminder_log`
- Memory image bucket, if Journal is used

## Recommended first implementation scope

Start with primary calendar only.

Use scope:

- ``

This is enough to read/write events on the selected calendar. Add calendar-list selection later if needed.

## Routes to build next

- `GET /api/google/oauth/start`
- `GET /api/google/auth/callback`
- `GET /api/google/calendar/status`
- `POST /api/google/calendar/sync`
- `POST /api/google/calendar/disconnect`
- `POST /api/google/calendar/webhook`

## Client UI to add next

Settings → Integrations → Google Calendar

- Connect Google Calendar
- Connected account email
- Sync direction: Import only / Export only / Two-way
- Sync now
- Disconnect
- Last synced time
- Last sync error

## Hobby Vercel note

Do not rely on frequent Vercel Cron for Google sync on Hobby.

Use:

- manual Sync Now
- sync on app foreground/open
- Google push notification webhooks
- optional daily Vercel cron only for webhook-channel renewal
