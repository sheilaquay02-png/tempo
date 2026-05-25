import test from 'node:test';
import assert from 'node:assert/strict';
import { mapGoogleEvent, mergeGoogleImport, tempoGoogleEventId } from '../lib/tempo/google/mapping.js';

const calendar = { id: 'google-primary', googleCalendarId: 'primary@example.com', color: '#FF7BAC' };

test('Google all-day events keep exclusive end metadata and read-only source fields', () => {
  const ev = mapGoogleEvent({
    id: 'g1',
    summary: 'All day trip',
    start: { date: '2026-03-10' },
    end: { date: '2026-03-11' },
    status: 'confirmed',
    updated: '2026-03-01T00:00:00Z',
  }, calendar, { timeZone: 'Asia/Singapore' });
  assert.equal(ev.id, tempoGoogleEventId(calendar.googleCalendarId, 'g1'));
  assert.equal(ev.source, 'google');
  assert.equal(ev.externalSource, 'google_calendar');
  assert.equal(ev.readOnly, true);
  assert.equal(ev.allDay, true);
  assert.equal(ev.googleAllDayEndExclusive, '2026-03-11');
});

test('cancelled Google events without dates map to tombstones', () => {
  const ev = mapGoogleEvent({ id: 'g-cancel', status: 'cancelled', updated: '2026-03-01T00:00:00Z' }, calendar);
  assert.equal(ev.googleStatus, 'cancelled');
  assert.equal(ev.deletedAt, '2026-03-01T00:00:00Z');
});

test('Google import never overwrites local Tempo events with the same id', () => {
  const local = { id: 'same', title: 'Local event', source: 'tempo' };
  const google = { id: 'same', title: 'Imported event', source: 'google', googleCalendarId: calendar.googleCalendarId };
  const out = mergeGoogleImport({ existingEvents: [local], googleEvents: [google] });
  assert.equal(out.find(ev => ev.id === 'same').title, 'Local event');
});

test('recurring Google instances use original start as stable Tempo id', () => {
  const a = mapGoogleEvent({
    id: 'instance-a',
    recurringEventId: 'series-1',
    originalStartTime: { dateTime: '2026-03-10T09:00:00+08:00' },
    summary: 'Recurring standup',
    start: { dateTime: '2026-03-10T09:00:00+08:00' },
    end: { dateTime: '2026-03-10T09:30:00+08:00' },
    status: 'confirmed',
  }, calendar);
  const b = mapGoogleEvent({
    id: 'instance-b',
    recurringEventId: 'series-1',
    originalStartTime: { dateTime: '2026-03-10T09:00:00+08:00' },
    summary: 'Recurring standup moved',
    start: { dateTime: '2026-03-10T10:00:00+08:00' },
    end: { dateTime: '2026-03-10T10:30:00+08:00' },
    status: 'confirmed',
  }, calendar);
  assert.equal(a.id, b.id);
  assert.equal(a.googleStableKey, 'series-1:2026-03-10T09:00:00+08:00');
});

test('incremental imports do not mark unseen Google events missing', () => {
  const existing = { id: 'old-google', title: 'Existing Google event', source: 'google', googleCalendarId: calendar.googleCalendarId, start: new Date('2026-03-10T01:00:00Z'), end: new Date('2026-03-10T02:00:00Z') };
  const changed = { id: 'changed-google', title: 'Changed Google event', source: 'google', googleCalendarId: calendar.googleCalendarId, start: new Date('2026-03-10T03:00:00Z'), end: new Date('2026-03-10T04:00:00Z') };
  const out = mergeGoogleImport({ existingEvents: [existing], googleEvents: [changed], syncedCalendarIds: new Set(), seenIds: new Set(), syncWindow: null });
  assert.equal(out.find(ev => ev.id === 'old-google').googleStatus, undefined);
  assert.equal(out.find(ev => ev.id === 'changed-google').title, 'Changed Google event');
});
