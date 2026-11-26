import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanCalendarColor, calendarEventReadOnly, calendarEventSource } from '../lib/tempo/client/calendarPresentation.js';
import { makeScrapbookItem, normalizeScrapbookBlocksForSave, scrapbookItemLayout, scrapbookItemType } from '../lib/tempo/client/journalDecorationModel.js';

test('calendar presentation helpers preserve Tempo/Google/Habit source behavior', () => {
  assert.equal(cleanCalendarColor('#ff7bac'), '#FF7BAC');
  assert.equal(cleanCalendarColor('pink'), '#FF7BAC');
  assert.equal(calendarEventSource({ source: 'habit' }), 'habit');
  assert.equal(calendarEventSource({ source: 'google' }), 'google');
  assert.equal(calendarEventSource({}, { source: 'google' }), 'google');
  assert.equal(calendarEventSource({}, {}), 'tempo');
  assert.equal(calendarEventReadOnly({ source: 'google' }), true);
  assert.equal(calendarEventReadOnly({ source: 'tempo' }), false);
});

test('journal decoration helpers normalize stickers and legacy text blocks safely', () => {
  const sticker = makeScrapbookItem('sticker', 0);
  assert.equal(sticker.type, 'sticker');
  assert.equal(scrapbookItemType({ type: 'quote' }), 'tape');
  const normalized = normalizeScrapbookBlocksForSave([
    { id: 'legacy-text', type: 'text', text: 'Remember this', x: 500, y: -50, w: 1, h: 1, rotate: 999 },
    { id: 'ignored', type: 'photo' },
  ]);
  assert.equal(normalized.length, 1);
  assert.equal(normalized[0].type, 'tape');
  const layout = scrapbookItemLayout(normalized[0], 0);
  assert.equal(layout.rotate <= 180, true);
  assert.equal(layout.x <= 112, true);
});
