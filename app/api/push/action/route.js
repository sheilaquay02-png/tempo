import { createClient } from '@supabase/supabase-js';

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

function fallbackDateKey() {
  return new Date().toISOString().slice(0, 10);
}

async function findReminderByToken(admin, actionToken) {
  if (!actionToken) return null;
  const { data, error } = await admin
    .from('push_reminder_log')
    .select('user_id, meta, sent_at')
    .contains('meta', { actionToken })
    .order('sent_at', { ascending: false })
    .limit(1);
  if (error) throw error;
  return data?.[0] || null;
}

function normalizeSnoozedReminders(settings) {
  return Array.isArray(settings?.snoozedReminders) ? settings.snoozedReminders : [];
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
    actionToken: meta.actionToken,
    type: meta.type || meta.sourceType || 'task',
    sourceType: meta.sourceType || meta.type || 'task',
    sourceId: meta.sourceId || meta.taskId || meta.habitId || meta.ritualId || meta.id || null,
    taskId: meta.taskId || (meta.sourceType === 'task' ? meta.sourceId : null),
    habitId: meta.habitId || (meta.sourceType === 'habit' ? meta.sourceId : null),
    ritualId: meta.ritualId || (meta.sourceType === 'ritual' ? meta.sourceId : null),
    date: meta.date || null,
    title: meta.title || 'Tempo reminder 🌸',
    body: meta.body || 'Open Tempo to check this item.',
    url: meta.url || '/',
    dueAt,
    createdAt: new Date().toISOString(),
  };

  await saveUserData(admin, row.user_id, { settings: { ...settings, snoozedReminders: [...snoozed, item] } });
  return { ok: true, action: 'snooze', minutes: safeMinutes, dueAt };
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
    changed = true;
    return { ...task, done: true, completedAt: now, completedDate: task.completedDate || meta.date || fallbackDateKey(), updatedAt: now };
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
  const date = meta.date || fallbackDateKey();
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
  const nextCompletion = {
    ...(existing || { id: `${habitId}:${date}`, habitId, date, createdAt: now }),
    completedAt: existing?.completedAt || now,
    count: Math.max(target, Number(existing?.count || 0)),
    note: existing?.note || '',
    updatedAt: now,
  };
  const habitCompletions = existing ? current.map(c => c.id === existing.id ? nextCompletion : c) : [...current, nextCompletion];
  const snoozedReminders = normalizeSnoozedReminders(settings).filter(item => item.habitId !== habitId && item.sourceId !== habitId);
  await saveUserData(admin, row.user_id, { settings: { ...settings, habitCompletions, snoozedReminders } });
  return { ok: true, action: 'complete_habit', habitId, date };
}

async function handleCompleteRitual(admin, row) {
  const meta = row.meta || {};
  const ritualId = meta.ritualId || (meta.sourceType === 'ritual' ? meta.sourceId : null);
  if (!ritualId) return { ok: false, error: 'No ritual id on reminder' };
  const date = meta.date || fallbackDateKey();
  const userData = await loadUserData(admin, row.user_id, 'settings');
  if (!userData) return { ok: false, error: 'User data not found' };
  const settings = userData.settings || {};
  const rituals = Array.isArray(settings.rituals) ? settings.rituals : [];
  const ritual = rituals.find(r => r.id === ritualId);
  if (!ritual) return { ok: false, error: 'Ritual not found' };
  const now = new Date().toISOString();
  const stepIds = Array.isArray(ritual.steps) ? ritual.steps.map(s => s.id) : [];
  const current = Array.isArray(settings.ritualCompletions) ? settings.ritualCompletions : [];
  const existing = current.find(c => c.ritualId === ritualId && c.date === date);
  const nextCompletion = {
    ...(existing || { id: `${ritualId}:${date}`, ritualId, date, createdAt: now }),
    completedSteps: stepIds,
    completedAt: existing?.completedAt || now,
    skippedAt: null,
    note: existing?.note || '',
    updatedAt: now,
  };
  const ritualCompletions = existing ? current.map(c => c.id === existing.id ? nextCompletion : c) : [...current, nextCompletion];
  const snoozedReminders = normalizeSnoozedReminders(settings).filter(item => item.ritualId !== ritualId && item.sourceId !== ritualId);
  await saveUserData(admin, row.user_id, { settings: { ...settings, ritualCompletions, snoozedReminders } });
  return { ok: true, action: 'complete_ritual', ritualId, date };
}

async function handleSkipRitual(admin, row) {
  const meta = row.meta || {};
  const ritualId = meta.ritualId || (meta.sourceType === 'ritual' ? meta.sourceId : null);
  if (!ritualId) return { ok: false, error: 'No ritual id on reminder' };
  const date = meta.date || fallbackDateKey();
  const userData = await loadUserData(admin, row.user_id, 'settings');
  if (!userData) return { ok: false, error: 'User data not found' };
  const settings = userData.settings || {};
  const now = new Date().toISOString();
  const current = Array.isArray(settings.ritualCompletions) ? settings.ritualCompletions : [];
  const existing = current.find(c => c.ritualId === ritualId && c.date === date);
  const nextCompletion = {
    ...(existing || { id: `${ritualId}:${date}`, ritualId, date, createdAt: now }),
    completedSteps: [],
    completedAt: null,
    skippedAt: now,
    note: existing?.note || '',
    updatedAt: now,
  };
  const ritualCompletions = existing ? current.map(c => c.id === existing.id ? nextCompletion : c) : [...current, nextCompletion];
  const snoozedReminders = normalizeSnoozedReminders(settings).filter(item => item.ritualId !== ritualId && item.sourceId !== ritualId);
  await saveUserData(admin, row.user_id, { settings: { ...settings, ritualCompletions, snoozedReminders } });
  return { ok: true, action: 'skip_ritual', ritualId, date };
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const action = body.action;
    const actionToken = body.actionToken;
    const admin = getAdminClient();
    const row = await findReminderByToken(admin, actionToken);
    if (!row) return json({ ok: false, error: 'Invalid or expired action token' }, 401);

    if (action === 'snooze') return json(await handleSnooze(admin, row, body.minutes));
    if (action === 'complete_task') return json(await handleCompleteTask(admin, row));
    if (action === 'complete_habit') return json(await handleCompleteHabit(admin, row));
    if (action === 'complete_ritual') return json(await handleCompleteRitual(admin, row));
    if (action === 'skip_ritual') return json(await handleSkipRitual(admin, row));
    return json({ ok: false, error: 'Unsupported action' }, 400);
  } catch (err) {
    console.error('Push action failed', err);
    return json({ ok: false, error: err?.message || 'Push action failed' }, 500);
  }
}
