# Tempo security fixes 1-20

Implemented in this handoff:

1. Removed `.env.local` from the shared zip.
2. Removed `.git`, `.next`, `.npm-cache`, and `node_modules` from the shared zip.
3. Hardened Google Calendar routes so they no longer trust `userId` from query/body.
4. Added server-side Supabase auth verification for Google status, calendars, sync, disconnect, and OAuth start.
5. Changed Google OAuth start to use an authenticated POST flow from the client.
6. Sanitized OAuth `returnTo` to block external/open redirects.
7. Fixed OAuth state signature comparison to avoid malformed-state crashes.
8. Added encrypted Google access/refresh token storage using `GOOGLE_TOKEN_ENCRYPTION_KEY`.
9. Kept backward-compatible decryption for older plaintext Google tokens during reads.
10. Added sync window validation for Google imports.
11. Added calendar preference ownership checks before updating visibility/sync.
12. Improved Google disconnect cleanup so only actual Google calendar IDs are removed from hidden calendars.
13. Added lightweight server-side rate limits for Google API routes, push send, and assistant route.
14. Sanitized production API error responses so raw details are not exposed.
15. Added push action token hashing in `push_reminder_log` metadata.
16. Added push action token expiry metadata.
17. Added single-use push action behavior by marking successful action tokens as used.
18. Removed raw action tokens from newly stored reminder log metadata.
19. Updated Supabase SQL for server-only push reminder logs and token-hash indexing.
20. Added a Google calendar token setup SQL file with RLS enabled and no browser-facing policies.

Required after deploying:

- Rotate any keys that may have been inside `.env.local`.
- Set `GOOGLE_TOKEN_ENCRYPTION_KEY` in production before connecting Google Calendar again.
- Run updated SQL in `supabase/google_calendar_tokens_setup.sql` and `supabase/push_reminder_log_setup.sql`.
- Existing plaintext Google tokens are readable for migration, but new/refresh tokens are encrypted.
