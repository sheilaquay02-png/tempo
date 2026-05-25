import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const route = path => readFileSync(path, 'utf8');

test('Google routes remain authenticated, rate-limited, and sanitized', () => {
  for (const path of [
    'app/api/google/auth/start/route.js',
    'app/api/google/status/route.js',
    'app/api/google/calendars/route.js',
    'app/api/google/sync/route.js',
    'app/api/google/disconnect/route.js',
  ]) {
    const source = route(path);
    assert.match(source, /rateLimit\(/, `${path} should be rate-limited`);
    assert.match(source, /requireAuthenticatedUser\(/, `${path} should derive user identity server-side`);
    assert.doesNotMatch(source, /searchParams\.get\(["']userId["']\)|body\.userId/, `${path} should not trust client userId`);
  }
});

test('OAuth callback keeps state, redirect, and error guards', () => {
  const source = route('app/api/google/auth/callback/route.js');
  assert.match(source, /verifyOAuthState/, 'callback should verify OAuth state');
  assert.match(source, /safeReturnPath/, 'callback should sanitize return paths');
  assert.match(source, /handleRouteError/, 'callback should use safe route error handling');
});

test('push mutation routes keep validation and throttling guards', () => {
  const send = route('app/api/push/send/route.js');
  assert.match(send, /sanitizePushSendPayload/, 'push send should sanitize payload');
  assert.match(send, /rateLimit\(/, 'push send should be rate-limited');
  assert.match(send, /TEMPO_PUSH_SECRET/, 'push send should require server push secret');

  const subscribe = route('app/api/push/subscribe/route.js');
  assert.match(subscribe, /sanitizePushSubscriptionPayload/, 'push subscribe should sanitize payload');
  assert.match(subscribe, /admin\.auth\.getUser\(token\)/, 'push subscribe should verify Supabase auth token');
  assert.match(subscribe, /rateLimit\(/, 'push subscribe should be rate-limited');

  const action = route('app/api/push/action/route.js');
  assert.match(action, /sanitizePushActionPayload/, 'push action should sanitize payload');
  assert.match(action, /actionTokenHash/, 'push action should use hashed action tokens');
  assert.match(action, /rateLimit\(/, 'push action should be rate-limited');
});
