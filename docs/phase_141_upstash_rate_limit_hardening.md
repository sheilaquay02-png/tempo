# Phase 141 — Upstash rate-limit verification hardening

## Scope

This phase hardens the existing rate limiter so production can be configured to require the distributed Upstash Redis backend instead of silently falling back to per-instance memory buckets.

## Changed files

- `lib/tempo/rateLimit.js`
- `.env.example`
- `tests/rate-limit-upstash-hardening.test.mjs`

## New environment variable

```txt
REQUIRE_UPSTASH_RATE_LIMIT=true
```

Use this in production after confirming these are also set:

```txt
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

Do not prefix the Upstash token with `NEXT_PUBLIC_`.

## Behaviour

- If `REQUIRE_UPSTASH_RATE_LIMIT` is not enabled, Tempo keeps the previous safe fallback behaviour: Upstash is used when available, otherwise the in-memory limiter is used.
- If `REQUIRE_UPSTASH_RATE_LIMIT=true`, Tempo returns a `503` backend configuration error when Upstash env vars are missing, the Redis REST call fails, or Upstash returns an invalid response.
- Normal over-limit requests still return `429`.

## Manual verification

After deployment, check one rate-limited route such as Google status, calendar sync, or push subscribe. In Upstash, confirm keys with this prefix are being created:

```txt
tempo:rate-limit:
```

Then intentionally remove or break one Upstash env var in a preview environment with `REQUIRE_UPSTASH_RATE_LIMIT=true` and confirm the affected API route fails loudly instead of silently using memory fallback.
