# Tempo Google Calendar live OAuth sync plan

## Readiness verdict

Tempo is ready to begin the Google Calendar OAuth sprint after the included SQL setup and environment variables are added.

The app already has the important foundations:

- Supabase Auth identity
- server API routes using the service role key
- conflict-safe Tempo cloud merge
- delete tombstones
- field-level settings timestamps
- cross-device Realtime pull
- PWA and desktop force sync
- event recurrence, all-day, multi-day, reminders, and linked task metadata

## Key design decision

Do not store Google OAuth refresh tokens in `user_data.settings`.

`user_data` is readable by the signed-in browser via RLS, which is fine for events/tasks/settings, but not ideal for long-lived Google refresh tokens.

Use the server-only table:

- `google_calendar_connections`

Store encrypted token payloads there and access them only through Next.js API routes using `SUPABASE_SERVICE_ROLE_KEY`.

## Authentication between browser and Next.js API routes

The current app uses Supabase Auth in the browser. Google routes should receive the Supabase access token from the client:

```js
const { data } = await sb.auth.getSession();
fetch('/api/google/calendar/sync', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${data.session.access_token}`,
    'Content-Type': 'application/json'
  }
});
```

On the server, validate it with Supabase before doing any Google action:

```js
const token = request.headers.get('authorization')?.replace('Bearer ', '');
const { data: { user }, error } = await supabase.auth.getUser(token);
if (error || !user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
```

## OAuth flow

1. User clicks Connect Google Calendar.
2. Client calls `/api/google/oauth/start` with Supabase bearer token.
3. Server validates the user and creates a signed `state` payload.
4. Server redirects to Google OAuth with:
   - `access_type=offline`
   - `prompt=consent` on first connect
   - `include_granted_scopes=true`
   - scope `https://www.googleapis.com/auth/calendar.events`
5. Google redirects to `/api/google/oauth/callback`.
6. Callback validates `state`, exchanges code for tokens, encrypts tokens, stores connection.
7. Run initial full sync.
8. Return user to Settings → Integrations.

## Sync model

Use Google incremental sync.

Initial sync:

- call `events.list` for primary calendar
- paginate until no `nextPageToken`
- store `nextSyncToken`
- map Google events into Tempo events
- create rows in `google_calendar_event_links`

Incremental sync:

- call `events.list` with stored `syncToken`
- process changed and cancelled events
- store the new `nextSyncToken`
- if Google returns 410, clear the sync token and run full sync again

## Event mapping

Tempo → Google:

- `title` → `summary`
- `notes` → `description`
- `start/end` → `start.dateTime` / `end.dateTime`
- `allDay` → `start.date` / `end.date`
- `timezone` → event time zone
- `recurrence` → `RRULE`
- `reminder` → Google event reminders when possible
- `id` → `extendedProperties.private.tempoEventId`

Google → Tempo:

- `summary` → `title`
- `description` → `notes`
- `start.dateTime/end.dateTime` → timed event
- `start.date/end.date` → all-day event
- `recurrence[]` → Tempo recurrence where supported
- `id` → stored in `google_calendar_event_links`
- `etag` and `updated` → conflict detection

## Conflict rule for first version

Use clear deterministic rules first:

1. If only Google changed since last sync, Google wins.
2. If only Tempo changed since last sync, Tempo wins.
3. If both changed, keep Tempo version and mark the link as `needs_review`.
4. Deleted Google events become Tempo tombstones.
5. Deleted Tempo events delete the linked Google event.

This prevents silent overwrites while keeping the first implementation understandable.

## Push/webhook model

For true live sync, add Google Calendar event watch.

- `/api/google/calendar/webhook` receives Google change notifications.
- The webhook should not trust body content as the source of truth.
- It should verify the channel token, then run incremental sync for that user/calendar.
- Channels expire, so store expiration and renew ahead of time.

On Vercel Hobby, do not use frequent Vercel Cron. Daily cron is acceptable for renewing channels early, while actual changes can come through Google webhooks and manual/foreground sync.

## Safe rollout sequence

### Phase 1 — Connect and status

- Add OAuth start/callback routes
- Store encrypted tokens
- Show connection status in Settings
- Add disconnect

### Phase 2 — Import Google events

- Initial full sync from Google → Tempo
- Store event link rows
- Read-only external event flag first

### Phase 3 — Two-way sync

- Tempo create/update/delete pushes to Google
- Google incremental sync pulls changes back
- Conflict handling

### Phase 4 — Live push

- Create Google watch channel
- Add webhook route
- Renew channel daily

### Phase 5 — Polish

- Calendar selector
- Import-only/export-only/two-way setting
- Conflict review UI
- Sync activity log
