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

function todayKey() {
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

async function handleSnooze(admin, row, minutes) {
  const safeMinutes = Math.max(1, Math.min(24 * 60, Number(minutes) || 10));
  const meta = row.meta || {};
  const { data: userData, error: loadError } = await admin
    .from('user_data')
    .select('settings')
    .eq('user_id', row.user_id)
    .maybeSingle();
  if (loadError) throw loadError;

  const settings = userData?.settings || {};
  const snoozed = normalizeSnoozedReminders(settings);
  const dueAt = new Date(Date.now() + safeMinutes * 60000).toISOString();
  const item = {
    id: `snooze_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    actionToken: meta.actionToken,
    type: meta.type || meta.sourceType || 'task',
    sourceType: meta.sourceType || meta.type || 'task',
    sourceId: meta.sourceId || meta.taskId || meta.id || null,
    taskId: meta.taskId || meta.sourceId || null,
    title: meta.title || 'Tempo reminder 🌸',
    body: meta.body || 'Open Tempo to check this item.',
    url: meta.url || (meta.taskId ? `/?taskId=${encodeURIComponent(meta.taskId)}&page=tasks` : '/'),
    dueAt,
    createdAt: new Date().toISOString(),
  };

  const nextSettings = { ...settings, snoozedReminders: [...snoozed, item] };
  const { error: updateError } = await admin
    .from('user_data')
    .update({ settings: nextSettings, updated_at: new Date().toISOString() })
    .eq('user_id', row.user_id);
  if (updateError) throw updateError;
  return { ok: true, action: 'snooze', minutes: safeMinutes, dueAt };
}

async function handleCompleteTask(admin, row) {
  const meta = row.meta || {};
  const taskId = meta.taskId || meta.sourceId;
  if (!taskId) return { ok: false, error: 'No task id on reminder' };

  const { data: userData, error: loadError } = await admin
    .from('user_data')
    .select('events,tasks,settings')
    .eq('user_id', row.user_id)
    .maybeSingle();
  if (loadError) throw loadError;
  if (!userData) return { ok: false, error: 'User data not found' };

  const now = new Date().toISOString();
  let changed = false;
  const tasks = (Array.isArray(userData.tasks) ? userData.tasks : []).map(task => {
    if (task?.id !== taskId) return task;
    changed = true;
    return { ...task, done: true, completedAt: now, completedDate: task.completedDate || todayKey(), updatedAt: now };
  });

  if (!changed) return { ok: false, error: 'Task not found' };
  const settings = userData.settings || {};
  const snoozedReminders = normalizeSnoozedReminders(settings).filter(item => item.taskId !== taskId && item.sourceId !== taskId);

  const { error: updateError } = await admin
    .from('user_data')
    .update({ tasks, settings: { ...settings, snoozedReminders }, updated_at: now })
    .eq('user_id', row.user_id);
  if (updateError) throw updateError;
  return { ok: true, action: 'complete_task', taskId };
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
    return json({ ok: false, error: 'Unsupported action' }, 400);
  } catch (err) {
    console.error('Push action failed', err);
    return json({ ok: false, error: err?.message || 'Push action failed' }, 500);
  }
}
