import test from 'node:test';
import assert from 'node:assert/strict';
import {
  memoryStoragePathsFromJournal,
  findRemovedMemoryPhotoPaths,
  buildJournalPhotoCleanupQueue,
  markJournalPhotoCleanupAttempt,
  MEMORY_PREVIEW_IMAGE_EDGE,
  MEMORY_UPLOAD_IMAGE_QUALITY,
} from '../lib/tempo/core.js';

test('journal media helpers collect and diff full/thumb storage paths', () => {
  const before = {
    '2026-05-01': { photos: [
      { id: 'p1', storagePath: 'u/2026-05-01/full/a.jpg', thumbStoragePath: 'u/2026-05-01/thumb/a.jpg' },
      { id: 'p2', storagePath: 'u/2026-05-01/full/b.jpg', thumbStoragePath: 'u/2026-05-01/thumb/b.jpg' },
    ] },
  };
  const after = {
    '2026-05-01': { photos: [
      { id: 'p2', storagePath: 'u/2026-05-01/full/b.jpg', thumbStoragePath: 'u/2026-05-01/thumb/b.jpg' },
    ] },
  };
  assert.deepEqual(memoryStoragePathsFromJournal(before).sort(), [
    'u/2026-05-01/full/a.jpg',
    'u/2026-05-01/full/b.jpg',
    'u/2026-05-01/thumb/a.jpg',
    'u/2026-05-01/thumb/b.jpg',
  ].sort());
  assert.deepEqual(findRemovedMemoryPhotoPaths(before, after).sort(), [
    'u/2026-05-01/full/a.jpg',
    'u/2026-05-01/thumb/a.jpg',
  ].sort());
});

test('journal media cleanup queue dedupes and preserves failed retry metadata', () => {
  const now = new Date('2026-05-01T10:00:00.000Z');
  const queue = buildJournalPhotoCleanupQueue([], ['a.jpg', 'a.jpg', 'b.jpg'], 'removed-photo', now);
  assert.equal(queue.length, 2);
  assert.equal(queue[0].reason, 'removed-photo');
  const retry = markJournalPhotoCleanupAttempt(queue, ['a.jpg', 'b.jpg'], ['a.jpg'], new Date('2026-05-01T10:05:00.000Z'));
  assert.equal(retry.length, 1);
  assert.equal(retry[0].path, 'b.jpg');
  assert.equal(retry[0].attempts, 1);
  assert.equal(retry[0].lastTriedAt, '2026-05-01T10:05:00.000Z');
});

test('journal image compression constants are bounded for local cache safety', () => {
  assert.ok(MEMORY_PREVIEW_IMAGE_EDGE <= 900);
  assert.ok(MEMORY_UPLOAD_IMAGE_QUALITY <= 0.9);
});
