import test from 'node:test';
import assert from 'node:assert/strict';
import {
  dateKeyInTimeZone,
  googleAllDayRangeToUtc,
  localClockDue,
  getLocalDateTimeParts,
  normalizeClockTime,
  normalizeDateKey,
  weekStartKeyFromDateKey,
  monthKeyFromDateKey,
} from '../lib/tempo/dateTime.js';
import { sanitizeTaskRecord, sanitizeSettingsRecord } from '../lib/tempo/validation.js';
import { taskCompletionTargetKey, withTaskPeriod } from '../lib/tempo/core.js';

const at = iso => new Date(iso);

test('date keys use the requested Tempo timezone instead of server UTC', () => {
  const instant = at('2026-05-24T17:30:00Z'); // 01:30 on May 25 in Singapore
  assert.equal(dateKeyInTimeZone(instant, 'Asia/Singapore'), '2026-05-25');
  assert.equal(dateKeyInTimeZone(instant, 'UTC'), '2026-05-24');
});

test('Google all-day ranges preserve exclusive end date and timezone boundary', () => {
  const range = googleAllDayRangeToUtc('2026-03-10', '2026-03-12', 'Asia/Singapore');
  assert.equal(range.startKey, '2026-03-10');
  assert.equal(range.endExclusiveKey, '2026-03-12');
  assert.equal(range.start.toISOString(), '2026-03-09T16:00:00.000Z');
  assert.equal(range.end.toISOString(), '2026-03-11T16:00:00.000Z');
});

test('local clock due checks handle timezone midnight boundaries', () => {
  const parts = getLocalDateTimeParts(at('2026-05-24T17:30:00Z'), 'Asia/Singapore');
  assert.equal(parts.dateKey, '2026-05-25');
  assert.equal(localClockDue(parts, '01:30', 0, 0), true);
  assert.equal(localClockDue(parts, '99:99', 10, 10), false);
});

test('task date keys and period keys are normalized safely', () => {
  assert.equal(normalizeDateKey('2026-5-4'), '2026-05-04');
  assert.equal(normalizeClockTime('9:05'), '09:05');
  assert.equal(weekStartKeyFromDateKey('2026-05-10'), '2026-05-04');
  assert.equal(monthKeyFromDateKey('2026-05-10'), '2026-05');
  const clean = sanitizeTaskRecord({ id: 't', title: 'Task', taskDate: '2026-5-4', weekKey: '2026-5-4', monthKey: '2026-5' });
  assert.equal(clean.taskDate, '2026-05-04');
  assert.equal(clean.weekKey, '2026-05-04');
  assert.equal(clean.monthKey, '2026-05');
});

test('task completion target key follows the task period', () => {
  const weekTask = withTaskPeriod({ id: 'w', title: 'Weekly', scope: 'week' }, at('2026-02-05T10:00:00+08:00'));
  const monthTask = withTaskPeriod({ id: 'm', title: 'Monthly', scope: 'month' }, at('2026-02-20T10:00:00+08:00'));
  assert.equal(taskCompletionTargetKey(weekTask), '2026-02-02');
  assert.equal(taskCompletionTargetKey(monthTask), '2026-02');
});

test('settings timezone is normalized through API sanitization', () => {
  assert.equal(sanitizeSettingsRecord({ timezone: 'Not/A_Zone' }).timezone, 'Asia/Singapore');
  assert.equal(sanitizeSettingsRecord({ timezone: 'Australia/Sydney' }).timezone, 'Australia/Sydney');
});
