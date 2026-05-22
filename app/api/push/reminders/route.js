import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const DEFAULT_EVENT_REMINDER_MINUTES = 10;
const DEFAULT_LOOKBACK_MINUTES = 10;
const DEFAULT_LOOKAHEAD_MINUTES = 1;
const TASK_REMINDER_TIMES = { morning: '09:00', afternoon: '13:00', evening: '18:00' };
const SNOOZE_ACTIONS = [
  { action: 'snooze_5', title: 'Snooze 5m' },
  { action: 'snooze_10', title: 'Snooze 10m' },
  { action: 'snooze_30', title: 'Snooze 30m' },
];
const DEFAULT_NOTIFICATION_PREFERENCES = {
  events: true,
  tasks: true,
  rituals: false,
  habits: true,
  journal: { enabled: false, time: '21:30' },
  tomorrowReset: { enabled: false, time: '21:45' },
  weeklyReset: { enabled: false, day: 0, time: '18:00' },
  affirmations: { enabled: false, time: '08:30' },
};

function createActionToken() {
  return crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
}

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

function validTime(value, fallback = '09:00') {
  return /^\d{2}:\d{2}$/.test(String(value || '')) ? String(value) : fallback;
}

function normalizeNotificationPreferences(settings = {}) {
  const source = settings.notificationPreferences || {};
  const affirmationSettings = settings.affirmationSettings || {};
  const journal = typeof source.journal === 'object' ? source.journal : { enabled: Boolean(source.journal), time: DEFAULT_NOTIFICATION_PREFERENCES.journal.time };
  const tomorrowReset = typeof source.tomorrowReset === 'object' ? source.tomorrowReset : { enabled: Boolean(source.tomorrowReset), time: DEFAULT_NOTIFICATION_PREFERENCES.tomorrowReset.time };
  const weeklyReset = typeof source.weeklyReset === 'object' ? source.weeklyReset : { enabled: Boolean(source.weeklyReset), day: DEFAULT_NOTIFICATION_PREFERENCES.weeklyReset.day, time: DEFAULT_NOTIFICATION_PREFERENCES.weeklyReset.time };
  const affirmations = typeof source.affirmations === 'object'
    ? source.affirmations
    : { enabled: Boolean(source.affirmations ?? affirmationSettings.reminderEnabled), time: affirmationSettings.reminderTime || DEFAULT_NOTIFICATION_PREFERENCES.affirmations.time };
  return {
    events: source.events === undefined ? true : Boolean(source.events),
    tasks: source.tasks === undefined ? true : Boolean(source.tasks),
    rituals: false,
    habits: source.habits === undefined ? true : Boolean(source.habits),
    journal: { enabled: Boolean(journal.enabled), time: validTime(journal.time, DEFAULT_NOTIFICATION_PREFERENCES.journal.time) },
    tomorrowReset: { enabled: Boolean(tomorrowReset.enabled), time: validTime(tomorrowReset.time, DEFAULT_NOTIFICATION_PREFERENCES.tomorrowReset.time) },
    weeklyReset: { enabled: Boolean(weeklyReset.enabled), day: Math.max(0, Math.min(6, Number(weeklyReset.day ?? 0) || 0)), time: validTime(weeklyReset.time, DEFAULT_NOTIFICATION_PREFERENCES.weeklyReset.time) },
    affirmations: { enabled: Boolean(affirmations.enabled), time: validTime(affirmations.time, DEFAULT_NOTIFICATION_PREFERENCES.affirmations.time) },
  };
}

function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const raw = value?.__d ?? value;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
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

function localDateForParts(parts) {
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day, 0, 0, 0, 0));
}

function localDateTimeMs(parts) {
  return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, 0, 0);
}

function parseClock(time) {
  const [h, m] = String(time || '').split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return { hour: Math.max(0, Math.min(23, h)), minute: Math.max(0, Math.min(59, m)) };
}

function isDueLocalClock(parts, time, lookbackMinutes, lookaheadMinutes) {
  const clock = parseClock(time);
  if (!clock) return false;
  const nowMs = localDateTimeMs(parts);
  const dueMs = Date.UTC(parts.year, parts.month - 1, parts.day, clock.hour, clock.minute, 0, 0);
  return dueMs >= nowMs - lookbackMinutes * 60000 && dueMs <= nowMs + lookaheadMinutes * 60000;
}

function dueDateForLocalClock(parts, time) {
  const clock = parseClock(time);
  if (!clock) return new Date();
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day, clock.hour, clock.minute, 0, 0));
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
    return /^\d{2}:\d{2}$/.test(reminder) ? { type: 'custom', time: reminder } : { type: 'none', time: '' };
  }
  if (!reminder) return { type: 'none', time: '' };
  const type = reminder.type || reminder.mode || reminder.id || 'none';
  if (type === 'none') return { type: 'none', time: '' };
  return { type, time: validTime(reminder.time || TASK_REMINDER_TIMES[type] || '09:00', TASK_REMINDER_TIMES[type] || '09:00') };
}

function normalizeHabitReminder(reminder) {
  if (reminder === null) return { type: 'none', time: '' };
  if (typeof reminder === 'string') {
    if (reminder in TASK_REMINDER_TIMES) return { type: reminder, time: TASK_REMINDER_TIMES[reminder] };
    return /^\d{2}:\d{2}$/.test(reminder) ? { type: 'custom', time: reminder } : { type: 'none', time: '' };
  }
  if (!reminder) return { type: 'none', time: '' };
  const type = reminder.type || reminder.mode || reminder.id || 'none';
  if (type === 'none') return { type: 'none', time: '' };
  return { type, time: validTime(reminder.time || TASK_REMINDER_TIMES[type] || '09:00', TASK_REMINDER_TIMES[type] || '09:00') };
}

function habitRunsOnLocalDate(habit, parts) {
  if (!habit || habit.archived || habit.deletedAt) return false;
  const days = Array.isArray(habit.repeatDays) && habit.repeatDays.length ? habit.repeatDays.map(Number) : [0, 1, 2, 3, 4, 5, 6];
  const d = localDateForParts(parts);
  return days.includes(d.getUTCDay());
}

function habitCompletionFor(settings, habitId, dateKey) {
  const list = Array.isArray(settings?.habitCompletions) ? settings.habitCompletions : [];
  return list.find(c => c.habitId === habitId && c.date === dateKey) || null;
}

function habitReminderCandidates(settings, now, lookbackMinutes, lookaheadMinutes) {
  const prefs = normalizeNotificationPreferences(settings);
  if (!prefs.habits) return [];
  const timeZone = settings?.timezone || 'Asia/Singapore';
  const parts = localTimeParts(now, timeZone);
  const habits = Array.isArray(settings?.habits) ? settings.habits : [];
  const candidates = [];
  for (const habit of habits) {
    if (!habitRunsOnLocalDate(habit, parts)) continue;
    const reminder = normalizeHabitReminder(habit.reminder);
    if (reminder.type === 'none') continue;
    if (!isDueLocalClock(parts, reminder.time, lookbackMinutes, lookaheadMinutes)) continue;
    const target = Math.max(1, Number(habit.targetCount || 1));
    const completion = habitCompletionFor(settings, habit.id, parts.dateKey);
    if (Number(completion?.count || 0) >= target) continue;
    candidates.push({
      type: 'habit',
      key: `habit:${habit.id || habit.name}:${parts.dateKey}:${reminder.time}`,
      title: `${habit.emoji || '🌱'} ${habit.name || 'Your habit'}`,
      body: 'A gentle reminder to keep your rhythm going.',
      url: '/?page=habits',
      start: dueDateForLocalClock(parts, reminder.time),
      count: 1,
      sourceId: habit.id || null,
      sourceType: 'habit',
      habitId: habit.id || null,
      date: parts.dateKey,
    });
  }
  return candidates;
}

function journalEntryExists(settings, dateKey) {
  const journal = settings?.journal || {};
  const entry = journal[dateKey];
  if (!entry) return false;
  return Boolean(entry.note || entry.gratitude?.some?.(Boolean) || entry.blocks?.length || entry.tomorrowIntention || entry.weeklyReflection);
}

function scheduledLifestyleReminderCandidates(settings, now, lookbackMinutes, lookaheadMinutes) {
  const prefs = normalizeNotificationPreferences(settings);
  const timeZone = settings?.timezone || 'Asia/Singapore';
  const parts = localTimeParts(now, timeZone);
  const candidates = [];

  if (prefs.journal.enabled && isDueLocalClock(parts, prefs.journal.time, lookbackMinutes, lookaheadMinutes) && !journalEntryExists(settings, parts.dateKey)) {
    candidates.push({
      type: 'journal',
      key: `journal:${parts.dateKey}:${prefs.journal.time}`,
      title: 'Want to do a quick journal check-in?',
      body: 'A few lines are enough to close the day gently.',
      url: '/?page=journal',
      start: dueDateForLocalClock(parts, prefs.journal.time),
      sourceType: 'journal',
      sourceId: parts.dateKey,
      date: parts.dateKey,
    });
  }

  if (prefs.tomorrowReset.enabled && isDueLocalClock(parts, prefs.tomorrowReset.time, lookbackMinutes, lookaheadMinutes)) {
    candidates.push({
      type: 'tomorrow_reset',
      key: `tomorrow-reset:${parts.dateKey}:${prefs.tomorrowReset.time}`,
      title: 'A gentle reminder to plan tomorrow',
      body: 'Move unfinished tasks and choose tomorrow’s main thing.',
      url: '/?page=tomorrow-reset',
      start: dueDateForLocalClock(parts, prefs.tomorrowReset.time),
      sourceType: 'tomorrow_reset',
      sourceId: parts.dateKey,
      date: parts.dateKey,
    });
  }

  const localWeekday = localDateForParts(parts).getUTCDay();
  if (prefs.weeklyReset.enabled && localWeekday === Number(prefs.weeklyReset.day) && isDueLocalClock(parts, prefs.weeklyReset.time, lookbackMinutes, lookaheadMinutes)) {
    candidates.push({
      type: 'weekly_reset',
      key: `weekly-reset:${parts.dateKey}:${prefs.weeklyReset.time}`,
      title: 'Your Weekly Reset is ready',
      body: 'Review the week and set a softer rhythm for the next one.',
      url: '/?page=weekly-reset',
      start: dueDateForLocalClock(parts, prefs.weeklyReset.time),
      sourceType: 'weekly_reset',
      sourceId: parts.dateKey,
      date: parts.dateKey,
    });
  }

  if (prefs.affirmations.enabled && isDueLocalClock(parts, prefs.affirmations.time, lookbackMinutes, lookaheadMinutes)) {
    candidates.push({
      type: 'affirmation',
      key: `affirmation:${parts.dateKey}:${prefs.affirmations.time}`,
      title: 'Time for one gentle thought 💌',
      body: 'Open Tempo to read today’s affirmation.',
      url: '/?page=affirmations',
      start: dueDateForLocalClock(parts, prefs.affirmations.time),
      sourceType: 'affirmation',
      sourceId: parts.dateKey,
      date: parts.dateKey,
    });
  }

  return candidates;
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

function eventReminderCandidates(events, settings, now, lookbackMinutes, lookaheadMinutes) {
  const prefs = normalizeNotificationPreferences(settings);
  if (!prefs.events) return [];
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
        title: 'Upcoming event ⏰',
        body: minutesBefore === 0 ? `${ev.title || 'Untitled event'} starts now.` : `${ev.title || 'Untitled event'} starts in ${label}.`,
        url: '/',
        start: dueAt,
        eventStart: start,
        end: new Date(start.getTime() + durationMs),
        minutesBefore,
        label,
        sourceType: 'event',
        sourceId: ev.id || null,
        key: `event:${ev.id || ev.title || 'event'}:${occurrenceKey || start.toISOString()}:${minutesBefore}m`,
      });
    };

    maybeAdd(baseStart);

    if (!rec) continue;
    if (rec?.frequency === 'weekly' && Array.isArray(rec.byWeekdays) && rec.byWeekdays.length) {
      let cursor = new Date(baseStart.getTime());
      let emitted = 0;
      let safety = 0;
      const recWithoutCount = { ...rec, count: undefined };
      while (cursor <= latestEventStart && safety++ < 500) {
        const emits = shouldEmitOccurrence(baseStart, cursor, recWithoutCount, emitted);
        if (emits) {
          if (rec.count && emitted >= Number(rec.count)) break;
          if (cursor.getTime() !== baseStart.getTime()) maybeAdd(cursor, dateOnlyKeyUTC(cursor));
          emitted += 1;
        }
        cursor = addDays(cursor, 1);
      }
    } else {
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
  const prefs = normalizeNotificationPreferences(settings);
  if (!prefs.tasks) return [];
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

    candidates.push({
      type: 'task',
      key: `task:${task.id || task.title}:${todayKey}:${reminder.time}`,
      title: 'A gentle task reminder ✅',
      body: `${task.title || 'Untitled task'} is ready when you are.`,
      url: `/?taskId=${encodeURIComponent(task.id || '')}&page=tasks`,
      start: dueDateForLocalClock(parts, reminder.time),
      count: 1,
      taskId: task.id || null,
      sourceId: task.id || null,
      sourceType: 'task',
    });
  }

  return candidates;
}

function snoozedReminderCandidates(settings, now, lookbackMinutes, lookaheadMinutes) {
  const list = Array.isArray(settings?.snoozedReminders) ? settings.snoozedReminders : [];
  const windowStart = new Date(now.getTime() - lookbackMinutes * 60000);
  const windowEnd = new Date(now.getTime() + lookaheadMinutes * 60000);
  return list
    .map(item => ({ ...item, dueAtDate: toDate(item.dueAt) }))
    .filter(item => item.dueAtDate && item.dueAtDate >= windowStart && item.dueAtDate <= windowEnd)
    .map(item => ({
      type: item.type || 'task',
      key: `snooze:${item.id || item.actionToken || item.taskId}:${item.dueAt}`,
      title: item.title || 'Tempo reminder 🌸',
      body: item.body || 'Open Tempo to check this item.',
      url: item.url || (item.taskId ? `/?taskId=${encodeURIComponent(item.taskId)}&page=tasks` : '/'),
      start: item.dueAtDate,
      count: 1,
      taskId: item.taskId || null,
      habitId: item.habitId || null,
      date: item.date || null,
      sourceId: item.sourceId || item.taskId || item.habitId || null,
      sourceType: item.sourceType || item.type || 'task',
      snoozeId: item.id || null,
      originalActionToken: item.actionToken || null,
    }));
}

function removeDueSnoozedReminders(settings, sentSnoozeIds = []) {
  if (!sentSnoozeIds.length) return settings;
  const ids = new Set(sentSnoozeIds.filter(Boolean));
  const existing = Array.isArray(settings?.snoozedReminders) ? settings.snoozedReminders : [];
  return { ...settings, snoozedReminders: existing.filter(item => !ids.has(item.id)) };
}

async function markReminderIfNew(admin, userId, reminder) {
  const actionToken = reminder.actionToken || createActionToken();
  const meta = { ...reminder, actionToken };
  const { error } = await admin.from('push_reminder_log').insert({
    user_id: userId,
    reminder_key: `${userId}:${reminder.key}`,
    reminder_type: reminder.type,
    scheduled_for: reminder.start?.toISOString?.() || new Date().toISOString(),
    meta,
  });
  if (!error) return { isNew: true, actionToken, meta };
  if (error.code === '23505') return { isNew: false, actionToken: null, meta: reminder };
  throw error;
}

function notificationActionsFor(reminder) {
  const actions = [...SNOOZE_ACTIONS];
  if (reminder.type === 'task' && reminder.taskId) actions.push({ action: 'mark_done', title: 'Mark done' });
  if (reminder.type === 'habit' && reminder.habitId) actions.push({ action: 'complete_habit', title: 'Complete habit' });
  if (reminder.type === 'journal') actions.push({ action: 'open_journal', title: 'Open journal' });
  if (reminder.type === 'tomorrow_reset') actions.push({ action: 'start_reset', title: 'Start reset' });
  if (reminder.type === 'weekly_reset') actions.push({ action: 'start_reset', title: 'Start reset' });
  actions.push({ action: 'open', title: 'Open' });
  return actions;
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

      const allCandidates = [
        ...snoozedReminderCandidates(settings, now, lookbackMinutes, lookaheadMinutes),
        ...eventReminderCandidates(row.events || [], settings, now, lookbackMinutes, lookaheadMinutes),
        ...taskReminderCandidates(row.tasks || [], settings, now, lookbackMinutes, lookaheadMinutes),
        ...habitReminderCandidates(settings, now, lookbackMinutes, lookaheadMinutes),
        ...scheduledLifestyleReminderCandidates(settings, now, lookbackMinutes, lookaheadMinutes),
      ];
      candidates += allCandidates.length;

      const sentSnoozeIds = [];
      for (const reminder of allCandidates) {
        const marked = dryRun ? { isNew: true, actionToken: createActionToken(), meta: reminder } : await markReminderIfNew(admin, row.user_id, reminder);
        if (!marked.isNew) {
          skippedDuplicates += 1;
          continue;
        }
        if (reminder.snoozeId) sentSnoozeIds.push(reminder.snoozeId);
        if (dryRun) continue;
        const result = await sendToUserSubscriptions(admin, subscriptions, {
          title: reminder.title,
          body: reminder.body,
          url: reminder.url || '/',
          tag: `${row.user_id}:${reminder.key}`,
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          actions: notificationActionsFor(reminder),
          data: {
            url: reminder.url || '/',
            actionToken: marked.actionToken,
            taskId: reminder.taskId || null,
            habitId: reminder.habitId || null,
            date: reminder.date || null,
            sourceType: reminder.sourceType || reminder.type,
            sourceId: reminder.sourceId || reminder.id || null,
          },
        });
        sent += result.sent;
        failed += result.failed;
        cleaned += result.cleaned;
      }
      if (!dryRun && sentSnoozeIds.length) {
        const nextSettings = removeDueSnoozedReminders(settings, sentSnoozeIds);
        await admin.from('user_data').update({ settings: nextSettings, updated_at: new Date().toISOString() }).eq('user_id', row.user_id);
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
