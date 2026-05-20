import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const DEFAULT_EVENT_REMINDER_MINUTES = 10;
const DEFAULT_LOOKBACK_MINUTES = 10;
const DEFAULT_LOOKAHEAD_MINUTES = 1;
const TASK_REMINDER_TIMES = { morning: '09:00', afternoon: '13:00', evening: '18:00' };

function json(data, status = 200) {
  return Response.json(data, { status });
}

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase server env vars');
  return createClient(url, key, { auth: { persistSession: false } });
}

function configureWebPush() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:hello@example.com';
  if (!publicKey || !privateKey) throw new Error('Missing VAPID keys');
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

function isAuthorized(request) {
  const auth = request.headers.get('authorization') || '';
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && auth === `Bearer ${cronSecret}`) return true;

  const pushSecret = request.headers.get('x-tempo-push-secret') || '';
  if (process.env.TEMPO_PUSH_SECRET && pushSecret === process.env.TEMPO_PUSH_SECRET) return true;

  return false;
}

function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const raw = value?.__d ?? value;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

function localDateKey(date, timeZone = 'Asia/Singapore') {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const lookup = Object.fromEntries(parts.map(p => [p.type, p.value]));
  return `${lookup.year}-${lookup.month}-${lookup.day}`;
}

function localTimeParts(date, timeZone = 'Asia/Singapore') {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const lookup = Object.fromEntries(parts.map(p => [p.type, p.value]));
  return {
    weekday: lookup.weekday,
    year: Number(lookup.year),
    month: Number(lookup.month),
    day: Number(lookup.day),
    hour: Number(lookup.hour === '24' ? '0' : lookup.hour),
    minute: Number(lookup.minute),
    dateKey: `${lookup.year}-${lookup.month}-${lookup.day}`,
  };
}

function addDays(date, days) {
  const d = new Date(date.getTime());
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function addMonths(date, months) {
  const d = new Date(date.getTime());
  d.setUTCMonth(d.getUTCMonth() + months);
  return d;
}

function normalizeRecurrence(rec) {
  if (!rec) return null;
  if (typeof rec === 'string') return { frequency: rec };
  return rec;
}


function normalizeEventReminder(reminder) {
  if (reminder === null) return { type: 'none', minutesBefore: null };
  if (typeof reminder === 'number') return reminder < 0 ? { type: 'none', minutesBefore: null } : { type: 'minutes', minutesBefore: reminder };
  if (!reminder) return { type: 'minutes', minutesBefore: DEFAULT_EVENT_REMINDER_MINUTES };
  const type = reminder.type || reminder.mode || reminder.id || 'minutes';
  if (type === 'none') return { type: 'none', minutesBefore: null };
  if (type === 'at') return { type: 'at', minutesBefore: 0 };
  const minutes = Number(reminder.minutesBefore ?? reminder.minutes ?? reminder.offsetMinutes ?? reminder.value ?? DEFAULT_EVENT_REMINDER_MINUTES);
  return { type: type === 'custom' ? 'custom' : 'minutes', minutesBefore: Math.max(0, Number.isFinite(minutes) ? minutes : DEFAULT_EVENT_REMINDER_MINUTES) };
}

function eventReminderMinutes(reminder) {
  const r = normalizeEventReminder(reminder);
  return r.type === 'none' ? null : Math.max(0, Number(r.minutesBefore) || 0);
}

function eventReminderLabel(minutes) {
  if (minutes === 0) return 'now';
  if (minutes === 60) return '1 hour';
  if (minutes === 1440) return '1 day';
  return `${minutes} minutes`;
}

function normalizeTaskReminder(reminder) {
  if (reminder === null) return { type: 'none', time: '' };
  if (typeof reminder === 'string') {
    if (reminder in TASK_REMINDER_TIMES) return { type: reminder, time: TASK_REMINDER_TIMES[reminder] };
    return reminder ? { type: 'custom', time: reminder } : { type: 'none', time: '' };
  }
  if (!reminder) return { type: 'none', time: '' };
  const type = reminder.type || reminder.mode || reminder.id || 'none';
  if (type === 'none') return { type: 'none', time: '' };
  return { type, time: reminder.time || TASK_REMINDER_TIMES[type] || '09:00' };
}

function parseClock(time) {
  const [h, m] = String(time || '').split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return { hour: Math.max(0, Math.min(23, h)), minute: Math.max(0, Math.min(59, m)) };
}

function localDateTimeMs(parts) {
  return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, 0, 0);
}

function isDueLocalClock(parts, time, lookbackMinutes, lookaheadMinutes) {
  const clock = parseClock(time);
  if (!clock) return false;
  const nowMs = localDateTimeMs(parts);
  const dueMs = Date.UTC(parts.year, parts.month - 1, parts.day, clock.hour, clock.minute, 0, 0);
  return dueMs >= nowMs - lookbackMinutes * 60000 && dueMs <= nowMs + lookaheadMinutes * 60000;
}

function recurrenceEndDate(rec) {
  return rec?.endDate || rec?.until || null;
}

function recurrenceSkippedDates(rec) {
  return new Set([...(rec?.skippedDates || []), ...(rec?.exceptions || [])]);
}

function stepRecurringDate(date, rec) {
  const r = normalizeRecurrence(rec) || {};
  const freq = r.frequency || r.type || rec;
  const interval = Math.max(1, Number(r.interval || 1));
  if (freq === 'daily') return addDays(date, interval);
  if (freq === 'weekly') {
    if (Array.isArray(r?.byWeekdays) && r.byWeekdays.length) return addDays(date, 1);
    return addDays(date, 7 * interval);
  }
  if (freq === 'weekdays') {
    let d = addDays(date, 1);
    while (d.getUTCDay() === 0 || d.getUTCDay() === 6) d = addDays(d, 1);
    return d;
  }
  if (freq === 'monthly') {
    const next = addMonths(date, interval);
    if (r.byMonthDay) {
      const max = new Date(Date.UTC(next.getUTCFullYear(), next.getUTCMonth() + 1, 0)).getUTCDate();
      next.setUTCDate(Math.min(Math.max(1, Number(r.byMonthDay) || date.getUTCDate()), max));
    }
    return next;
  }
  return null;
}

function dateOnlyKeyUTC(date) {
  return date.toISOString().slice(0, 10);
}

function weeksBetweenUTC(a, b) {
  const a0 = Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate());
  const b0 = Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate());
  return Math.floor((b0 - a0) / (7 * 86400000));
}

function shouldEmitOccurrence(baseStart, occurrenceDate, rec, index) {
  const key = dateOnlyKeyUTC(occurrenceDate);
  if (recurrenceSkippedDates(rec).has(key)) return false;
  const end = recurrenceEndDate(rec);
  if (end && occurrenceDate > new Date(`${end}T23:59:59.999Z`)) return false;
  if (rec?.count && index >= Number(rec.count)) return false;
  if (Array.isArray(rec?.byWeekdays) && rec.byWeekdays.length) {
    if (!rec.byWeekdays.map(Number).includes(occurrenceDate.getUTCDay())) return false;
    if (weeksBetweenUTC(baseStart, occurrenceDate) % Math.max(1, Number(rec.interval || 1)) !== 0) return false;
  }
  return true;
}

function eventReminderCandidates(events, now, lookbackMinutes, lookaheadMinutes) {
  const dueWindowStart = new Date(now.getTime() - lookbackMinutes * 60000);
  const dueWindowEnd = new Date(now.getTime() + lookaheadMinutes * 60000);
  const candidates = [];

  for (const ev of Array.isArray(events) ? events : []) {
    if (!ev || ev.allDay) continue;
    const minutesBefore = eventReminderMinutes(ev.reminder);
    if (minutesBefore === null) continue;
    const baseStart = toDate(ev.start);
    const baseEnd = toDate(ev.end);
    if (!baseStart || !baseEnd) continue;
    const latestEventStart = new Date(dueWindowEnd.getTime() + minutesBefore * 60000);
    const earliestEventStart = new Date(dueWindowStart.getTime() + minutesBefore * 60000);
    const durationMs = Math.max(0, baseEnd.getTime() - baseStart.getTime());
    const rec = normalizeRecurrence(ev.recurrence);

    const maybeAdd = (start, occurrenceKey = null) => {
      if (!start || start < earliestEventStart || start > latestEventStart) return;
      const dueAt = new Date(start.getTime() - minutesBefore * 60000);
      if (dueAt < dueWindowStart || dueAt > dueWindowEnd) return;
      const label = eventReminderLabel(minutesBefore);
      candidates.push({
        type: 'event',
        id: ev.id || ev.title || 'event',
        title: ev.title || 'Untitled event',
        start,
        end: new Date(start.getTime() + durationMs),
        minutesBefore,
        label,
        key: `event:${ev.id || ev.title || 'event'}:${occurrenceKey || start.toISOString()}:${minutesBefore}m`,
      });
    };

    maybeAdd(baseStart);

    if (!rec) continue;
    let cursor = new Date(baseStart.getTime());
    let index = 0;
    let safety = 0;
    while (cursor < earliestEventStart && safety++ < 500) {
      const next = stepRecurringDate(cursor, rec);
      if (!next) break;
      cursor = next;
      index += 1;
    }
    safety = 0;
    while (cursor <= latestEventStart && safety++ < 100) {
      if (cursor.getTime() !== baseStart.getTime() && shouldEmitOccurrence(baseStart, cursor, rec, index)) {
        maybeAdd(cursor, dateOnlyKeyUTC(cursor));
      }
      const next = stepRecurringDate(cursor, rec);
      if (!next) break;
      cursor = next;
      index += 1;
    }
  }

  return candidates;
}

function monthKeyFromDateKey(key) {
  return String(key || '').slice(0, 7);
}

function mondayDateKeyFromLocalDateKey(key) {
  const d = new Date(`${key}T00:00:00Z`);
  const dow = d.getUTCDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

function taskScopeOf(task) {
  return task?.scope === 'week' || task?.scope === 'month' ? task.scope : 'day';
}

function taskDayKey(task) {
  return task?.taskDate || task?.dayKey || task?.dateKey || task?.scheduled || task?.deadline || null;
}

function taskReminderCandidates(tasks, settings, now, lookbackMinutes, lookaheadMinutes) {
  const timeZone = settings?.timezone || 'Asia/Singapore';
  const parts = localTimeParts(now, timeZone);
  const todayKey = parts.dateKey;
  const thisWeekKey = mondayDateKeyFromLocalDateKey(todayKey);
  const thisMonthKey = monthKeyFromDateKey(todayKey);
  const open = (Array.isArray(tasks) ? tasks : []).filter(t => t && !t.done);
  const candidates = [];

  for (const task of open) {
    const reminder = normalizeTaskReminder(task.reminder);
    if (reminder.type === 'none') continue;
    if (!isDueLocalClock(parts, reminder.time, lookbackMinutes, lookaheadMinutes)) continue;

    const scope = taskScopeOf(task);
    let inPeriod = false;
    if (scope === 'day') inPeriod = taskDayKey(task) === todayKey;
    if (scope === 'week') inPeriod = (task.weekKey || '') === thisWeekKey;
    if (scope === 'month') inPeriod = (task.monthKey || '') === thisMonthKey;
    if (!inPeriod) continue;

    const label = reminder.type === 'custom' ? `at ${reminder.time}` : reminder.type;
    candidates.push({
      type: 'task',
      key: `task:${task.id || task.title}:${todayKey}:${reminder.time}`,
      title: 'Task reminder ✅',
      body: `${task.title || 'Untitled task'} · ${label}`,
      url: '/',
      start: now,
      count: 1,
    });
  }

  return candidates;
}

async function markReminderIfNew(admin, userId, reminder) {
  const { error } = await admin.from('push_reminder_log').insert({
    user_id: userId,
    reminder_key: `${userId}:${reminder.key}`,
    reminder_type: reminder.type,
    scheduled_for: reminder.start?.toISOString?.() || new Date().toISOString(),
    meta: reminder,
  });
  if (!error) return true;
  if (error.code === '23505') return false;
  throw error;
}

async function sendToUserSubscriptions(admin, subscriptions, payload) {
  const results = await Promise.allSettled(subscriptions.map(row => webpush.sendNotification(row.subscription, JSON.stringify(payload))));
  const invalidEndpoints = [];
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      const statusCode = result.reason?.statusCode;
      if (statusCode === 404 || statusCode === 410) invalidEndpoints.push(subscriptions[index].endpoint);
    }
  });
  if (invalidEndpoints.length) {
    await admin.from('push_subscriptions').delete().in('endpoint', invalidEndpoints);
  }
  return { sent: results.filter(r => r.status === 'fulfilled').length, failed: results.filter(r => r.status === 'rejected').length, cleaned: invalidEndpoints.length };
}

async function runReminderCheck(request) {
  try {
    if (!isAuthorized(request)) return json({ error: 'Unauthorized' }, 401);

    configureWebPush();
    const admin = getAdminClient();
    const url = new URL(request.url);
    const now = new Date(url.searchParams.get('now') || Date.now());
    const lookbackMinutes = Number(url.searchParams.get('lookbackMinutes') || DEFAULT_LOOKBACK_MINUTES);
    const lookaheadMinutes = Number(url.searchParams.get('lookaheadMinutes') || DEFAULT_LOOKAHEAD_MINUTES);
    const dryRun = url.searchParams.get('dryRun') === '1';

    const { data: subRows, error: subError } = await admin.from('push_subscriptions').select('user_id,endpoint,subscription');
    if (subError) throw subError;

    const byUser = new Map();
    for (const row of subRows || []) {
      if (!row.user_id || !row.subscription?.endpoint) continue;
      if (!byUser.has(row.user_id)) byUser.set(row.user_id, []);
      byUser.get(row.user_id).push(row);
    }

    const userIds = [...byUser.keys()];
    if (!userIds.length) return json({ ok: true, users: 0, candidates: 0, sent: 0, totalSubscriptions: 0 });

    const { data: userRows, error: userError } = await admin
      .from('user_data')
      .select('user_id,events,tasks,settings,updated_at')
      .in('user_id', userIds);
    if (userError) throw userError;

    let usersChecked = 0;
    let candidates = 0;
    let sent = 0;
    let failed = 0;
    let skippedDuplicates = 0;
    let cleaned = 0;

    for (const row of userRows || []) {
      const subscriptions = byUser.get(row.user_id) || [];
      if (!subscriptions.length) continue;
      const settings = row.settings || {};
      if (settings.pushEnabled === false) continue;
      usersChecked += 1;

      const eventCandidates = eventReminderCandidates(row.events || [], now, lookbackMinutes, lookaheadMinutes).map(reminder => ({
        ...reminder,
        title: 'Upcoming event ⏰',
        body: reminder.minutesBefore === 0 ? `${reminder.title} starts now.` : `${reminder.title} starts in ${reminder.label}.`,
        url: '/',
      }));
      const taskCandidates = taskReminderCandidates(row.tasks || [], settings, now, lookbackMinutes, lookaheadMinutes);
      const allCandidates = [...eventCandidates, ...taskCandidates];
      candidates += allCandidates.length;

      for (const reminder of allCandidates) {
        const isNew = dryRun ? true : await markReminderIfNew(admin, row.user_id, reminder);
        if (!isNew) {
          skippedDuplicates += 1;
          continue;
        }
        if (dryRun) continue;
        const result = await sendToUserSubscriptions(admin, subscriptions, {
          title: reminder.title,
          body: reminder.body,
          url: reminder.url || '/',
          tag: `${row.user_id}:${reminder.key}`,
        });
        sent += result.sent;
        failed += result.failed;
        cleaned += result.cleaned;
      }
    }

    return json({ ok: true, users: usersChecked, candidates, sent, failed, skippedDuplicates, cleaned, totalSubscriptions: subRows?.length || 0, dryRun });
  } catch (err) {
    console.error('Reminder check failed', err);
    return json({ error: err?.message || 'Reminder check failed' }, 500);
  }
}

export async function GET(request) {
  return runReminderCheck(request);
}

export async function POST(request) {
  return runReminderCheck(request);
}
