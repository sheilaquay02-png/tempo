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
