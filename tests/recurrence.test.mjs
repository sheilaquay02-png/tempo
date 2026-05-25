import test from 'node:test';
import assert from 'node:assert/strict';
import {
  expandRecurring,
  dateKey,
  withTaskPeriod,
  taskBelongsToPeriod,
  taskPeriodIdentity,
  taskSamePeriod,
  ensureRecurringTasksForPeriod,
} from '../lib/tempo/core.js';

const at = iso => new Date(iso);

test('daily recurrence emits only the configured count inside a visible window', () => {
  const base = {
    id: 'daily-focus',
    title: 'Daily focus',
    start: at('2026-01-01T09:00:00+08:00'),
    end: at('2026-01-01T10:00:00+08:00'),
    recurrence: { frequency: 'daily', interval: 1, count: 3 },
  };
  const out = expandRecurring([base], at('2026-01-01T00:00:00+08:00'), at('2026-01-07T23:59:00+08:00'));
  assert.equal(out.length, 3);
  assert.deepEqual(out.map(ev => dateKey(ev.start)), ['2026-01-01', '2026-01-02', '2026-01-03']);
});

test('weekly by-weekday recurrence respects count across emitted weekdays', () => {
  const base = {
    id: 'mwf-review',
    title: 'MWF review',
    start: at('2026-01-05T09:00:00+08:00'), // Monday
    end: at('2026-01-05T09:30:00+08:00'),
    recurrence: { frequency: 'weekly', byWeekdays: [1, 3, 5], count: 4 },
  };
  const out = expandRecurring([base], at('2026-01-05T00:00:00+08:00'), at('2026-01-20T23:59:00+08:00'));
  assert.equal(out.length, 4);
  assert.deepEqual(out.map(ev => dateKey(ev.start)), ['2026-01-05', '2026-01-07', '2026-01-09', '2026-01-12']);
});

test('task period identity is strict across day, week, and month scopes', () => {
  const dayTask = withTaskPeriod({ id: 't1', title: 'Today', scope: 'day' }, at('2026-02-03T10:00:00+08:00'));
  const weekTask = withTaskPeriod({ id: 't2', title: 'Week', scope: 'week' }, at('2026-02-05T10:00:00+08:00'));
  const monthTask = withTaskPeriod({ id: 't3', title: 'Month', scope: 'month' }, at('2026-02-20T10:00:00+08:00'));
  assert.equal(taskPeriodIdentity(dayTask), 'day:2026-02-03');
  assert.equal(taskPeriodIdentity(weekTask), 'week:2026-02-02');
  assert.equal(taskPeriodIdentity(monthTask), 'month:2026-02');
  assert.equal(taskBelongsToPeriod(dayTask, 'day', at('2026-02-03T18:00:00+08:00')), true);
  assert.equal(taskBelongsToPeriod(weekTask, 'week', at('2026-02-08T18:00:00+08:00')), true);
  assert.equal(taskBelongsToPeriod(monthTask, 'month', at('2026-02-01T18:00:00+08:00')), true);
  assert.equal(taskSamePeriod(dayTask, weekTask), false);
});

test('recurring weekly task is generated only once for the target week', () => {
  const root = withTaskPeriod({ id: 'task-root', title: 'Weekly admin', scope: 'week', recurrence: { frequency: 'weekly' } }, at('2026-02-02T10:00:00+08:00'));
  const out = ensureRecurringTasksForPeriod([root], 'week', at('2026-02-09T12:00:00+08:00'));
  const generated = out.filter(task => task.parentTaskId === 'task-root');
  assert.equal(generated.length, 1);
  assert.equal(taskPeriodIdentity(generated[0]), 'week:2026-02-09');
});
