import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { readJsonBody, sanitizePushActionPayload } from '../../../../lib/tempo/validation.js';
import { rateLimit } from '../../../../lib/tempo/google/server';

export const dynamic = 'force-dynamic';

function json(data, status = 200) {
  return Response.json(data, { status });
}

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase server env vars');
  return createClient(url, key, { auth: { persistSession: false } });
}

function normalizeTimeZone(value) {
  const fallback = 'Asia/Singapore';
  const tz = String(value || fallback);
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz }).format(new Date());
    return tz;
  } catch {
    return fallback;
  }
}

function fallbackDateKey(timeZone = 'Asia/Singapore') {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: normalizeTimeZone(timeZone),
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const lookup = Object.fromEntries(parts.map(p => [p.type, p.value]));
  return `${lookup.year}-${lookup.month}-${lookup.day}`;
}

function safeServerError(message = 'Push action failed') {
  return process.env.NODE_ENV === 'production' ? 'Push action failed' : message;
}

function pruneSnoozedReminders(list = []) {
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  return (Array.isArray(list) ? list : [])
    .filter(item => {
      const due = new Date(item?.dueAt || item?.createdAt || 0).getTime();
      return Number.isFinite(due) && due >= cutoff;
    })
    .slice(-50);
}

function sameReminderTarget(a = {}, b = {}) {
  const aType = a.sourceType || a.type || 'task';
  const bType = b.sourceType || b.type || 'task';
  const aId = a.sourceId || a.taskId || a.habitId || null;
  const bId = b.sourceId || b.taskId || b.habitId || null;
  return aType === bType && aId && bId && aId === bId;
}

function hashActionToken(token) {
  return crypto.createHash('sha256').update(String(token || '')).digest('hex');
}

async function findReminderByToken(admin, actionToken) {
  if (!actionToken) return null;
  const actionTokenHash = hashActionToken(actionToken);
  const { data, error } = await admin
    .from('push_reminder_log')
    .select('id,user_id,meta,sent_at')
    .filter('meta->>actionTokenHash', 'eq', actionTokenHash)
    .order('sent_at', { ascending: false })
    .limit(1);
  if (error) throw error;
  const row = data?.[0] || null;
  if (row) return row;

  // Backward compatibility for existing reminders created before token hashing.
  const { data: legacy, error: legacyError } = await admin
    .from('push_reminder_log')
    .select('id,user_id,meta,sent_at')
    .contains('meta', { actionToken })
    .order('sent_at', { ascending: false })
    .limit(1);
  if (legacyError) throw legacyError;
  return legacy?.[0] || null;
}

function assertActionTokenUsable(row) {
  const meta = row?.meta || {};
  if (meta.actionTokenUsedAt) return false;
  if (meta.actionTokenExpiresAt && new Date(meta.actionTokenExpiresAt).getTime() < Date.now()) return false;
  return true;
}

async function markActionTokenUsed(admin, row) {
  if (!row?.id) return;
  const meta = { ...(row.meta || {}), actionTokenUsedAt: new Date().toISOString() };
  delete meta.actionToken;
  await admin.from('push_reminder_log').update({ meta }).eq('id', row.id);
}

function normalizeSnoozedReminders(settings) {
  return pruneSnoozedReminders(settings?.snoozedReminders || []);
}

async function loadUserData(admin, userId, select = 'events,tasks,settings') {
  const { data, error } = await admin
    .from('user_data')
    .select(select)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

async function saveUserData(admin, userId, patch) {
  const { error } = await admin
    .from('user_data')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('user_id', userId);
  if (error) throw error;
}

async function handleSnooze(admin, row, minutes) {
  const safeMinutes = Math.max(1, Math.min(24 * 60, Number(minutes) || 10));
  const meta = row.meta || {};
  const userData = await loadUserData(admin, row.user_id, 'settings');
  const settings = userData?.settings || {};
  const snoozed = normalizeSnoozedReminders(settings);
  const dueAt = new Date(Date.now() + safeMinutes * 60000).toISOString();
  const item = {
    id: `snooze_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    actionTokenHash: meta.actionTokenHash || null,
    type: meta.type || meta.sourceType || 'task',
    sourceType: meta.sourceType || meta.type || 'task',
    sourceId: meta.sourceId || meta.taskId || meta.habitId || meta.id || null,
    taskId: meta.taskId || (meta.sourceType === 'task' ? meta.sourceId : null),
    habitId: meta.habitId || (meta.sourceType === 'habit' ? meta.sourceId : null),
    date: meta.date || null,
    title: meta.title || 'Tempo reminder 🌸',
    body: meta.body || 'Open Tempo to check this item.',
    url: meta.url || '/',
    dueAt,
    timeZone: meta.timeZone || meta.timezone || null,
    createdAt: new Date().toISOString(),
  };

  const deduped = snoozed.filter(existing => !sameReminderTarget(existing, item));
  await saveUserData(admin, row.user_id, { settings: { ...settings, snoozedReminders: pruneSnoozedReminders([...deduped, item]) } });
  return { ok: true, action: 'snooze', minutes: safeMinutes, dueAt };
}

function taskMatchesReminderPeriod(task = {}, meta = {}) {
  const scope = meta.taskScope || task.scope || 'day';
  if (scope === 'day') {
    const taskKey = task.taskDate || task.dayKey || task.dateKey || task.scheduled || task.deadline || null;
    return !meta.taskDayKey || !taskKey || taskKey === meta.taskDayKey || taskKey === meta.date;
  }
  if (scope === 'week') return !meta.taskWeekKey || !task.weekKey || task.weekKey === meta.taskWeekKey;
  if (scope === 'month') return !meta.taskMonthKey || !task.monthKey || task.monthKey === meta.taskMonthKey;
  return true;
}

async function handleCompleteTask(admin, row) {
  const meta = row.meta || {};
  const taskId = meta.taskId || (meta.sourceType === 'task' ? meta.sourceId : null);
  if (!taskId) return { ok: false, error: 'No task id on reminder' };

  const userData = await loadUserData(admin, row.user_id);
  if (!userData) return { ok: false, error: 'User data not found' };

  const now = new Date().toISOString();
  let changed = false;
  const tasks = (Array.isArray(userData.tasks) ? userData.tasks : []).map(task => {
    if (task?.id !== taskId) return task;
    if (!taskMatchesReminderPeriod(task, meta)) return task;
    changed = true;
    return { ...task, done: true, completedAt: now, completedDate: meta.date || task.completedDate || fallbackDateKey(meta.timeZone || meta.timezone), updatedAt: now };
  });

  if (!changed) return { ok: false, error: 'Task not found' };
  const settings = userData.settings || {};
  const snoozedReminders = normalizeSnoozedReminders(settings).filter(item => item.taskId !== taskId && item.sourceId !== taskId);

  await saveUserData(admin, row.user_id, { tasks, settings: { ...settings, snoozedReminders } });
  return { ok: true, action: 'complete_task', taskId };
}

async function handleCompleteHabit(admin, row) {
  const meta = row.meta || {};
  const habitId = meta.habitId || (meta.sourceType === 'habit' ? meta.sourceId : null);
  if (!habitId) return { ok: false, error: 'No habit id on reminder' };
  const date = meta.date || fallbackDateKey(meta.timeZone || meta.timezone);
  const userData = await loadUserData(admin, row.user_id, 'settings');
  if (!userData) return { ok: false, error: 'User data not found' };
  const settings = userData.settings || {};
  const habits = Array.isArray(settings.habits) ? settings.habits : [];
  const habit = habits.find(h => h.id === habitId);
  if (!habit) return { ok: false, error: 'Habit not found' };
  const target = Math.max(1, Number(habit.targetCount || 1));
  const now = new Date().toISOString();
  const current = Array.isArray(settings.habitCompletions) ? settings.habitCompletions : [];
  const existing = current.find(c => c.habitId === habitId && c.date === date);
  const nextCount = Math.min(target, Number(existing?.count || 0) + 1);
  const nextCompletion = {
    ...(existing || { id: `${habitId}:${date}`, habitId, date, createdAt: now }),
    completedAt: nextCount >= target ? (existing?.completedAt || now) : existing?.completedAt || null,
    count: nextCount,
    note: existing?.note || '',
    updatedAt: now,
  };
  const habitCompletions = existing ? current.map(c => c.id === existing.id ? nextCompletion : c) : [...current, nextCompletion];
  const snoozedReminders = normalizeSnoozedReminders(settings).filter(item => item.habitId !== habitId && item.sourceId !== habitId);
  await saveUserData(admin, row.user_id, { settings: { ...settings, habitCompletions, snoozedReminders } });
  return { ok: true, action: 'complete_habit', habitId, date };
}

export async function POST(request) {
  try {
    const body = sanitizePushActionPayload(await readJsonBody(request));
    const action = body.action;
    const actionToken = body.actionToken;
    await rateLimit(request, { key: 'push-action', limit: 30, windowMs: 60_000, identity: actionToken || null });
    const admin = getAdminClient();
    const row = await findReminderByToken(admin, actionToken);
    if (!row || !assertActionTokenUsable(row)) return json({ ok: false, error: 'Invalid or expired action token' }, 401);

    let result;
    if (action === 'snooze') result = await handleSnooze(admin, row, body.minutes);
    else if (action === 'complete_task') result = await handleCompleteTask(admin, row);
    else if (action === 'complete_habit') result = await handleCompleteHabit(admin, row);
    else return json({ ok: false, error: 'Unsupported action' }, 400);

    if (result?.ok) await markActionTokenUsed(admin, row);
    return json(result);
  } catch (err) {
    console.error('Push action failed', err);
    return json({ ok: false, error: safeServerError(err?.message || 'Push action failed') }, err?.status || 500);
  }
}
