# Tempo split — feature modules pass

This package performs the next safe split after the initial route/component split.

## Structure

```txt
app/page.js
components/TempoApp.jsx
components/auth/LoginScreen.jsx
components/calendar/CalendarViews.jsx
components/bloom/BloomRoom.jsx
components/tasks/Tasks.jsx
lib/tempo/core.js
lib/tempo/schema.js
styles/tempoStyles.js
docs/tempo_pre_split_test_checklist.md
supabase/memory_images_storage_setup.sql
```

## What changed

- Main orchestration/state remains in `components/TempoApp.jsx`.
- Constants, helpers, recurrence, storage, auth hook, date helpers, persistence, encryption, Journal helpers, and gamification calculations moved to `lib/tempo/core.js`.
- Calendar views moved to `components/calendar/CalendarViews.jsx`.
- Task board/modals moved to `components/tasks/Tasks.jsx`.
- Bloom Room cards moved to `components/bloom/BloomRoom.jsx`.
- Login screen moved to `components/auth/LoginScreen.jsx`.
- Large CSS function moved to `styles/tempoStyles.js`.

This split is conservative: Journal screens, settings, modals, sync queue, and root state orchestration remain in `TempoApp.jsx` to avoid breaking cross-feature state.

## Next recommended split

After testing this package, split in this order:

1. Journal screen and memory storage service.
2. Event/Search/Shortcut modals.
3. Settings panel.
4. Sync/auth hooks.
5. Final utility cleanup into date/recurrence/gamification/storage modules.

## Added after split

- Fixed mobile Journal entry backgrounds so selected page backgrounds remain visible on mobile.
- Added Web Push scaffolding for closed-app notifications:
  - `public/tempo-sw.js`
  - `app/api/push/subscribe/route.js`
  - `app/api/push/send/route.js`
  - `supabase/push_subscriptions_setup.sql`
- Added Capacitor wrapper scaffolding:
  - `capacitor.config.ts`
  - `native/README.md`
- Added conservative cross-device merge helpers for events, tasks, Journal entries, activities, templates and tags.
- Added drag reordering for Journal activities.
- Added sticker drag-positioning inside scrapbook sticker blocks.

## External setup for closed-app push

Closed-app push needs more than frontend code. Set these environment variables:

```txt
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:you@example.com
SUPABASE_SERVICE_ROLE_KEY=
TEMPO_PUSH_SECRET=
```

Install dependencies from `package.json`, then run the SQL in:

```txt
supabase/push_subscriptions_setup.sql
```

Your scheduler/cron can call:

```txt
POST /api/push/send
Header: x-tempo-push-secret: TEMPO_PUSH_SECRET
Body: { "userId":"...", "title":"Tempo reminder 🌸", "body":"Your event starts soon.", "url":"/" }
```

For a native wrapper, start with the PWA/web app, then use the Capacitor notes in `native/README.md`.

## Automatic reminder checker

This package includes the reminder route:

```txt
GET /api/push/reminders
```

Vercel Hobby accounts cannot run frequent cron jobs, so `vercel.json` intentionally does **not** schedule this route. Use GitHub Actions or another external cron service for frequent reminder checks. See:

```txt
docs/external_cron_setup.md
```

Required additional environment variable:

```txt
CRON_SECRET=your_long_random_secret
```

External cron should call the route with:

```txt
Authorization: Bearer <CRON_SECRET>
```

Run this Supabase SQL once:

```txt
supabase/push_reminder_log_setup.sql
```

Manual test after deployment:

```bash
curl "https://YOUR-APP.vercel.app/api/push/reminders?dryRun=1" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Real test:

```bash
curl "https://YOUR-APP.vercel.app/api/push/reminders" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Notes:
- Event reminders are sent around 10 minutes before timed events.
- All-day events are skipped.
- Day task reminders are sent around the user's work-start hour, defaulting to 9am.
- Week task reminders are sent Monday morning.
- Month task reminders are sent on the 1st morning.
- Duplicate reminders are prevented using `push_reminder_log`.
- Invalid/expired push subscriptions are cleaned automatically.


## Tempo rebrand Phase 2

This build starts the daily-rhythm rebrand. Navigation now centers on Today, Calendar, Tasks, Rituals, Habits and Journal, with Planning and Personal sections for Plan Today, Tomorrow Reset, Weekly Reset, Bloom Room, Affirmations, Rhythm Stats and Settings. Rituals, Habits, Weekly Reset and Affirmations are placeholder pages in this phase; their data models and full functionality come later.

## Tempo rebrand Phase 3

This build completes the terminology rebrand foundation.

Canonical category IDs are now:

```txt
important
main
light
meeting
personal
wellness
```

Legacy category IDs are migrated on load and during sync merge:

```txt
deep -> important
boss -> main
admin -> light
health -> wellness
```

This keeps existing user events/tasks safe while moving the app to the softer daily-rhythm language.


## Phase 4: Rituals Foundation

Tempo now includes Rituals as the soft routine layer for Morning Reset, Night Wind Down, and other repeatable checklist routines. Rituals are stored in Supabase under user settings and include completion history, repeat days, reminders, and sync-safe deletion tombstones.
