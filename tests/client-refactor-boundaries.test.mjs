import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanCalendarColor, calendarEventReadOnly, calendarEventSource } from '../lib/tempo/client/calendarPresentation.js';
import { countImportedGoogleEvents, deriveGoogleCalendarPayloadState, formatGoogleImportToast, googleDisconnectWarning, mergeGoogleCalendarsLocal } from '../lib/tempo/client/googleCalendarClient.js';
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

test('Google client helpers merge Google calendars without deleting Tempo calendars', () => {
  const merged = mergeGoogleCalendarsLocal(
    [{ id: 'google-work', source: 'google', name: 'Work' }],
    [{ id: 'home', source: 'tempo', name: 'Home' }, { id: 'old-google', source: 'google', name: 'Old' }]
  );
  assert.deepEqual(merged.map(cal => cal.id), ['home', 'google-work']);
});

test('Google payload derivation exposes state changes without mutating React state directly', () => {
  const result = deriveGoogleCalendarPayloadState({
    ok: true,
    connected: true,
    calendars: [{ id: 'google-main', source: 'google', name: 'Main' }],
    hiddenCals: ['google-private'],
    events: [{ id: 'g1', title: 'Google event', source: 'google', start: '2026-05-25T01:00:00.000Z', end: '2026-05-25T02:00:00.000Z' }],
    googleCalendarSync: { lastImportAt: '2026-05-25T00:00:00.000Z' },
  }, { calendars: [{ id: 'tempo', source: 'tempo', name: 'Tempo' }], prevGoogleSync: { connected: false } });
  assert.equal(result.shouldUpdateCalendars, true);
  assert.equal(result.googleSync.connected, true);
  assert.deepEqual(result.hiddenCals, ['google-private']);
  assert.equal(result.events[0].start instanceof Date, true);
  assert.deepEqual(result.nextCalendars.map(cal => cal.id), ['tempo', 'google-main']);
});

test('Google import and disconnect text remains stable', () => {
  assert.equal(countImportedGoogleEvents([{ source: 'google' }, { externalSource: 'google_calendar' }, { source: 'tempo' }]), 2);
  assert.match(formatGoogleImportToast({ imported: 1, skipped: 2 }), /Imported 1 Google event · skipped 2 unsupported/);
  assert.match(googleDisconnectWarning(2), /This removes 2 imported Google reference events/);
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
