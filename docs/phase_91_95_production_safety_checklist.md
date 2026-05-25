# Phase 91–95 Production Safety Checklist

This phase is intentionally conservative. It does not redesign Tempo and does not change core mechanics such as the local Tempo Assistant.

## What changed

1. Added optional distributed rate limiting support through `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.
2. Kept an in-memory rate-limit fallback for local development and preview deploys.
3. Added rate limiting to the push subscribe route and Google webhook route.
4. Tightened push subscription validation: authenticated user IDs must be Supabase UUIDs and subscription endpoints must be HTTPS.
5. Added database-level reminder dedupe indexes and action-token-hash uniqueness.
6. Added `supabase/production_safety_hardening.sql` as one safe SQL file to verify/apply RLS and reminder indexes.

## Vercel environment variables

Required variables remain the same as before. Optional but recommended for production:

```env
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

If those are not set, Tempo still works, but rate limiting is only per serverless instance and may be weaker under high traffic.

## Supabase SQL to run/check

Run this file once in the Supabase SQL Editor:

```text
supabase/production_safety_hardening.sql
```

It is written to be safe to run more than once.

## RLS expectations

- `user_data`: users can access only their own row.
- `push_subscriptions`: users can manage only their own subscriptions.
- `google_calendar_tokens`: server-only; no browser policies.
- `push_reminder_log`: server-only; no browser policies.

Server-only tables are accessed through Next.js routes using `SUPABASE_SERVICE_ROLE_KEY` after request validation.

## Manual deploy checks

After deploy:

1. Log in and confirm the app loads normally.
2. Confirm the local Tempo Assistant button and panel still work.
3. Save a small journal entry.
4. Confirm push subscription/notification permission still works.
5. Trigger reminders normally through your cron flow.
6. Confirm duplicate cron runs do not send repeated reminders for the same reminder key.
7. Confirm Google Calendar status/sync still works if connected.

## Non-goals in this phase

- No Google incremental sync/token work.
- No large `TempoApp.jsx` refactor.
- No local assistant redesign/removal.
- No journal decorator redesign.
