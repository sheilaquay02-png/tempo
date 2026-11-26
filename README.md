# Tempo

Tempo is a soft daily-rhythm planner: one place for your calendar, tasks, a gentle daily plan and a simple budget. It is a Next.js web app (installable as a PWA) backed by Supabase, with Capacitor scaffolding for iOS/Android.

## What's in the app

The sidebar switches between three modes.

**Schedule**
- **Today**: greeting, mood/energy check-in, Top 3 tasks, today's calendar, a daily affirmation and a Plan Today shortcut.
- **Calendar**: Day / Week / Month views, multiple colour-coded calendars, recurring events with single-occurrence edits, drag to reschedule, conflict warnings, day templates, search (`/` or ⌘K) and keyboard shortcuts (`?`).
- **Tasks**: day, week and month tasks with priority, category, duration and recurrence. Unfinished tasks can be carried over.
- **Plan Today**: fits open tasks into free time between your work hours, around events and meal breaks, and adapts to your energy check-in.
- **Rhythm Stats**: streaks and task/calendar insights.

**Budget**: Home, Accounts, Transactions, Budget buckets and Settings.

**Overall**: a combined summary of budget and schedule.

Tempo has no reminders or notifications, no Google Calendar connection and no assistant. These were removed in November 2026 (see [docs/legacy_feature_status.md](docs/legacy_feature_status.md)).

## How it works

- `app/page.js` renders `components/TempoApp.jsx`, which owns app state and page routing. Feature UIs live in `components/<feature>/`.
- Shared logic (dates, recurrence, task periods, categories, sync merge, migrations, encryption) lives in `lib/tempo/core.js`, with helpers in `lib/tempo/` and `utils/`.
- **Storage**: every change is saved to `localStorage` under a per-user key, then queued to Supabase (`hooks/useTempoCloudSync.js`).
- **Cloud sync**: one row per user in `public.user_data` (`events`, `tasks`, `settings` JSON), protected by row-level security. Other devices pick up changes through Supabase Realtime and on focus/online. Conflicts are merged per record by `updatedAt`, with delete tombstones kept for 90 days.
- There are no server API routes. The browser talks to Supabase directly with the public anon key.

## Setup

Requirements: Node 24 and npm 11.

1. Create a Supabase project and run these files once in the SQL Editor:
   - `supabase/user_data_setup.sql`, then enable Realtime for `public.user_data`
   - `supabase/production_safety_hardening.sql`
   - `supabase/memory_images_storage_setup.sql` (storage bucket used by archived Journal data)
2. Create `.env.local`:
   ```txt
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   ```
3. Install and run:
   ```bash
   npm install
   npm run dev
   ```

Deploys go to Vercel (`vercel.json`) with the same two environment variables.

### Upgrading an existing deployment

If your deployment used Google Calendar or push reminders before they were removed:
- Revoke Tempo in your Google Account (Security → Third-party apps with account access).
- Once you no longer need it, run `supabase/remove_google_calendar_and_push_tables.sql`. It drops the token, sync-state, push-subscription and reminder-log tables, and leaves `user_data` alone.
- Delete these now-unused Vercel environment variables: `SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `GOOGLE_OAUTH_STATE_SECRET`, `GOOGLE_WEBHOOK_TOKEN`, `TEMPO_GOOGLE_WEBHOOK_TOKEN`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `TEMPO_PUSH_SECRET`, `CRON_SECRET`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `REQUIRE_UPSTASH_RATE_LIMIT`, `TEMPO_DEFAULT_TIMEZONE`.
- Delete the GitHub repository secrets `TEMPO_APP_URL` and `CRON_SECRET`.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm test` | Run the test suite (`tests/*.test.mjs`, Node's built-in runner) |
| `npm run lint` | ESLint |
| `npm run validate:release` | Release safety checks (`scripts/validate-release.mjs`) |
| `npm run check` | Validate, test and lint |
| `npm run build` | Production build (first removes legacy files) |

GitHub Actions (`.github/workflows/tempo-ci.yml`) runs validation, tests, lint and build on every push and pull request.

## Native wrapper

`capacitor.config.ts` and [native/README.md](native/README.md) describe wrapping Tempo for iOS/Android.

## History

Tempo was built in numbered phases. The `PHASE_*.md` files and `docs/phase*` notes are a build log and describe features that may no longer exist. [docs/legacy_feature_status.md](docs/legacy_feature_status.md) lists what is active, retired and removed. Retired data (habits, journal, resets) stays in `user_data` until a migration is approved. Do not delete those fields.
