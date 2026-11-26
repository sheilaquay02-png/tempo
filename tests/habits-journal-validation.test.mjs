import test from 'node:test';
import assert from 'node:assert/strict';
import { incrementHabitCompletion, habitIsCompleteForDate } from '../lib/tempo/habits.js';
import { encryptMemoryJournalForStorage, decryptMemoryJournalFromStorage, isEncryptedMemoryJournal } from '../lib/tempo/client/journalMemory.js';
import { sanitizeUserDataPayload, normalizeUrlPath } from '../lib/tempo/validation.js';

test('habit completion increments by one and caps at target', () => {
  const habit = { id: 'water', targetCount: 2 };
  const date = '2026-04-01';
  const once = incrementHabitCompletion(habit, [], date, new Date('2026-04-01T09:00:00Z'));
  assert.equal(once[0].count, 1);
  assert.equal(habitIsCompleteForDate(habit, once, date), false);
  const twice = incrementHabitCompletion(habit, once, date, new Date('2026-04-01T10:00:00Z'));
  assert.equal(twice[0].count, 2);
  assert.equal(habitIsCompleteForDate(habit, twice, date), true);
  const third = incrementHabitCompletion(habit, twice, date, new Date('2026-04-01T11:00:00Z'));
  assert.equal(third[0].count, 2);
});

test('journal encryption round-trips when Web Crypto is available', async (t) => {
  if (!globalThis.crypto?.subtle) t.skip('Web Crypto unavailable in this Node runtime');
  const journal = { '2026-05-01': { mood: 'good', note: 'Private note', gratitude: ['A', 'B', 'C'], blocks: [] } };
  const encrypted = await encryptMemoryJournalForStorage('user-123', journal);
  assert.equal(isEncryptedMemoryJournal(encrypted), true);
  assert.equal(JSON.stringify(encrypted).includes('Private note'), false);
  const decrypted = await decryptMemoryJournalFromStorage('user-123', encrypted);
  assert.equal(decrypted['2026-05-01'].note, 'Private note');
});

test('validation helpers preserve safe data and reject unsafe shapes', () => {
  const clean = sanitizeUserDataPayload({
    events: [{ id: 'e1', title: 'x'.repeat(300) }],
    tasks: [{ id: 't1', title: 'Task' }],
    settings: { theme: 'tempo', __proto__: { polluted: true } },
  });
  assert.equal(clean.events[0].title.length, 240);
  assert.equal(clean.tasks[0].title, 'Task');
  assert.equal(Object.prototype.polluted, undefined);
  assert.equal(normalizeUrlPath('https://evil.example/path', '/'), '/');
});
