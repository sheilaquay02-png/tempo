import test from 'node:test';
import assert from 'node:assert/strict';
import { enforceRateLimit, isUpstashRateLimitRequired } from '../lib/tempo/rateLimit.js';

const originalEnv = { ...process.env };
const originalFetch = globalThis.fetch;

function resetEnv() {
  process.env = { ...originalEnv };
  globalThis.fetch = originalFetch;
}

function request() {
  return new Request('https://tempo.test/api/check', {
    headers: { 'x-forwarded-for': '203.0.113.10' },
  });
}

test('rate limiter falls back to memory when Upstash is optional and unset', async (t) => {
  t.after(resetEnv);
  delete process.env.REQUIRE_UPSTASH_RATE_LIMIT;
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;

  const result = await enforceRateLimit(request(), {
    key: `phase141-optional-${Date.now()}`,
    identity: 'optional-user',
    limit: 2,
    windowMs: 60_000,
  });

  assert.equal(result.backend, 'memory');
  assert.equal(result.ok, true);
});

test('REQUIRE_UPSTASH_RATE_LIMIT=true requires Upstash env variables', async (t) => {
  t.after(resetEnv);
  process.env.REQUIRE_UPSTASH_RATE_LIMIT = 'true';
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;

  assert.equal(isUpstashRateLimitRequired(), true);
  await assert.rejects(
    () => enforceRateLimit(request(), {
      key: `phase141-missing-${Date.now()}`,
      identity: 'strict-user',
      limit: 2,
      windowMs: 60_000,
    }),
    (err) => {
      assert.equal(err.status, 503);
      assert.equal(err.code, 'RATE_LIMIT_BACKEND_UNAVAILABLE');
      assert.match(err.message, /UPSTASH_REDIS_REST_URL/);
      assert.match(err.message, /UPSTASH_REDIS_REST_TOKEN/);
      return true;
    },
  );
});

test('strict Upstash mode fails loudly on invalid Redis REST response', async (t) => {
  t.after(resetEnv);
  process.env.REQUIRE_UPSTASH_RATE_LIMIT = 'true';
  process.env.UPSTASH_REDIS_REST_URL = 'https://example-upstash.test';
  process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return {
      ok: false,
      status: 401,
      async json() {
        return { error: 'unauthorized' };
      },
    };
  };

  await assert.rejects(
    () => enforceRateLimit(request(), {
      key: `phase141-http-${Date.now()}`,
      identity: 'strict-user',
      limit: 2,
      windowMs: 60_000,
    }),
    (err) => {
      assert.equal(err.status, 503);
      assert.equal(err.code, 'RATE_LIMIT_BACKEND_UNAVAILABLE');
      assert.match(err.message, /HTTP 401/);
      return true;
    },
  );
  assert.equal(calls, 1);
});

test('strict Upstash mode uses Redis REST when configured correctly', async (t) => {
  t.after(resetEnv);
  process.env.REQUIRE_UPSTASH_RATE_LIMIT = 'true';
  process.env.UPSTASH_REDIS_REST_URL = 'https://example-upstash.test/';
  process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
  globalThis.fetch = async (url, options) => {
    assert.equal(url, 'https://example-upstash.test/pipeline');
    assert.equal(options.method, 'POST');
    assert.equal(options.headers.authorization, 'Bearer test-token');
    const commands = JSON.parse(options.body);
    assert.equal(commands[0][0], 'INCR');
    assert.equal(commands[1][0], 'EXPIRE');
    assert.match(commands[0][1], /^tempo:rate-limit:phase141-ok/);
    return {
      ok: true,
      status: 200,
      async json() {
        return [{ result: 1 }, { result: 1 }];
      },
    };
  };

  const result = await enforceRateLimit(request(), {
    key: `phase141-ok-${Date.now()}`,
    identity: 'strict-user',
    limit: 3,
    windowMs: 60_000,
  });

  assert.equal(result.backend, 'upstash');
  assert.equal(result.remaining, 2);
});

test('Upstash over-limit responses still return 429', async (t) => {
  t.after(resetEnv);
  process.env.REQUIRE_UPSTASH_RATE_LIMIT = 'true';
  process.env.UPSTASH_REDIS_REST_URL = 'https://example-upstash.test';
  process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    async json() {
      return [{ result: 5 }, { result: 1 }];
    },
  });

  await assert.rejects(
    () => enforceRateLimit(request(), {
      key: `phase141-over-${Date.now()}`,
      identity: 'strict-user',
      limit: 2,
      windowMs: 60_000,
    }),
    (err) => {
      assert.equal(err.status, 429);
      assert.match(err.message, /Too many requests/);
      return true;
    },
  );
});
