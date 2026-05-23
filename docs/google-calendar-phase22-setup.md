# Tempo Phase 22 — Google Calendar OAuth setup

## 1. Google Cloud Console

Create an OAuth client for a Web application.

Authorized redirect URI:

```txt
https://YOUR-TEMPO-APP.vercel.app/api/google/auth/callback
```

Scopes used by Tempo:

```txt
https://www.googleapis.com/auth/calendar.readonly
```

## 2. Vercel environment variables

Add these to the Tempo Vercel project:

```txt
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_OAUTH_STATE_SECRET=
TEMPO_APP_URL=https://YOUR-TEMPO-APP.vercel.app
NEXT_PUBLIC_APP_URL=https://YOUR-TEMPO-APP.vercel.app
SUPABASE_SERVICE_ROLE_KEY=
```

`GOOGLE_REDIRECT_URI` is optional. If omitted, Tempo uses:

```txt
TEMPO_APP_URL/api/google/auth/callback
```

## 3. Supabase SQL

Run:

```txt
docs/supabase-google-calendar.sql
```

This creates `google_calendar_tokens`, a server-only token table.

## 4. Current sync behavior

Phase 22 is implemented as a safe import-first sync:

- User connects Google Calendar.
- Tempo stores tokens server-side only.
- User chooses visible/synced Google calendars.
- Google events import into Tempo.
- Deleted/cancelled Google events are marked deleted and do not reappear.
- Google events are shown inside Tempo as read-only reference events.
- Tempo does **not** export events, habits, or rituals into Google Calendar.

Webhook endpoint exists as a safe acknowledgement endpoint:

```txt
/api/google/webhook
```

Full incremental watch channel registration can be added after import/export behavior is verified in production.
