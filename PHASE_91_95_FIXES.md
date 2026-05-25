# Phase 91–95 Fix Summary

Production-safety only. Core Tempo UX and the restored local Tempo Assistant were preserved.

## Completed

- Added production-aware rate limiting helper with optional Upstash Redis REST support.
- Kept local/dev in-memory fallback rate limiting.
- Converted Google/push rate-limit calls to async so distributed rate limiting can work.
- Added rate limiting to push subscribe and Google webhook endpoints.
- Strengthened push subscription payload validation.
- Required Supabase UUID format for push user IDs.
- Required HTTPS push subscription endpoints and required push subscription keys.
- Improved push action lookup to use `meta->>actionTokenHash`, matching the new DB index.
- Added DB-level reminder dedupe/index hardening in `supabase/push_reminder_log_setup.sql`.
- Added `supabase/production_safety_hardening.sql` to verify/apply RLS and indexes safely.
- Added deployment checklist at `docs/phase_91_95_production_safety_checklist.md`.
- Added optional Upstash env vars to `.env.example`.

## Preserved

- Local Tempo Assistant/chatbot.
- Existing journal, tasks, calendar, habits, reminders, sync, and decoration mechanics.
- No OpenAI/API assistant route was added.
