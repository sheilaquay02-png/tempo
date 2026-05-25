import test from 'node:test';
import assert from 'node:assert/strict';
import { readJsonBody, normalizeUrlPath } from '../lib/tempo/validation.js';

test('URL path sanitizer blocks external notification or return URLs', () => {
  assert.equal(normalizeUrlPath('https://evil.example/callback', '/?page=calendar'), '/?page=calendar');
  assert.equal(normalizeUrlPath('//evil.example/callback', '/?page=calendar'), '/?page=calendar');
  assert.equal(normalizeUrlPath('/?page=calendar', '/'), '/?page=calendar');
});

test('readJsonBody rejects malformed JSON', async () => {
  const request = new Request('https://tempo.example/api/test', { method: 'POST', body: '{bad', headers: { 'content-type': 'application/json' } });
  await assert.rejects(() => readJsonBody(request), err => err.status === 400);
});
