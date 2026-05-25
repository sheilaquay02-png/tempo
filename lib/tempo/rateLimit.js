// Tempo production-aware rate limiting.
//
// Uses Upstash Redis REST when UPSTASH_REDIS_REST_URL and
// UPSTASH_REDIS_REST_TOKEN are configured. Falls back to a small in-memory
// limiter for local/dev/preview builds. The in-memory fallback is not shared
// across serverless instances, so production should configure Upstash/Vercel KV.

const MEMORY_BUCKETS = new Map();
const MAX_MEMORY_BUCKETS = 2000;

function makeRateLimitError(message = 'Too many requests') {
  const err = new Error(message);
  err.status = 429;
  return err;
}

function clientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for') || '';
  return forwarded.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || request.headers.get('cf-connecting-ip')
    || 'unknown';
}

function cleanKeyPart(value, fallback = 'default') {
  return String(value || fallback).replace(/[^a-zA-Z0-9:_-]+/g, '_').slice(0, 160) || fallback;
}

function memoryRateLimit(bucketKey, { limit, windowMs }) {
  const now = Date.now();
  const bucket = MEMORY_BUCKETS.get(bucketKey) || { count: 0, resetAt: now + windowMs };
  if (bucket.resetAt <= now) {
    bucket.count = 0;
    bucket.resetAt = now + windowMs;
  }
  bucket.count += 1;
  MEMORY_BUCKETS.set(bucketKey, bucket);

  if (MEMORY_BUCKETS.size > MAX_MEMORY_BUCKETS) {
    for (const [key, value] of MEMORY_BUCKETS.entries()) {
      if (value.resetAt <= now) MEMORY_BUCKETS.delete(key);
      if (MEMORY_BUCKETS.size <= MAX_MEMORY_BUCKETS) break;
    }
  }

  if (bucket.count > limit) throw makeRateLimitError();
  return { ok: true, remaining: Math.max(0, limit - bucket.count), resetAt: bucket.resetAt, backend: 'memory' };
}

async function redisRateLimit(bucketKey, { limit, windowMs }) {
  const baseUrl = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!baseUrl || !token) return null;

  const windowSeconds = Math.max(1, Math.ceil(windowMs / 1000));
  const redisKey = `tempo:rate-limit:${bucketKey}`;
  const response = await fetch(`${baseUrl.replace(/\/+$/, '')}/pipeline`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify([
      ['INCR', redisKey],
      ['EXPIRE', redisKey, windowSeconds],
    ]),
    cache: 'no-store',
  });

  if (!response.ok) return null;
  const payload = await response.json().catch(() => null);
  const count = Number(Array.isArray(payload) ? payload[0]?.result : payload?.result);
  if (!Number.isFinite(count)) return null;
  if (count > limit) throw makeRateLimitError();
  return { ok: true, remaining: Math.max(0, limit - count), resetAt: Date.now() + windowMs, backend: 'upstash' };
}

export async function enforceRateLimit(request, { key = 'default', limit = 60, windowMs = 60_000, identity = null } = {}) {
  const safeLimit = Math.max(1, Math.min(10_000, Number(limit) || 60));
  const safeWindowMs = Math.max(1_000, Math.min(24 * 60 * 60 * 1000, Number(windowMs) || 60_000));
  const subject = cleanKeyPart(identity || clientIp(request), 'unknown');
  const bucketKey = `${cleanKeyPart(key)}:${subject}:${Math.floor(Date.now() / safeWindowMs)}`;

  try {
    const redisResult = await redisRateLimit(bucketKey, { limit: safeLimit, windowMs: safeWindowMs });
    if (redisResult) return redisResult;
  } catch (err) {
    if (err?.status === 429) throw err;
    // Redis/Upstash outages should not take Tempo offline; use fallback limiter.
  }

  return memoryRateLimit(bucketKey, { limit: safeLimit, windowMs: safeWindowMs });
}
