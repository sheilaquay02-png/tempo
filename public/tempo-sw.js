const TEMPO_SW_VERSION = 'retired-lifestyle-v2';
const SAFE_PATHS = new Set(['/', '/?page=today', '/?page=calendar', '/?page=tasks', '/?page=affirmations']);

self.addEventListener('install', event => {
  // Do not force-claim immediately. New service workers activate after the page naturally reloads,
  // which avoids surprising users while they are editing a journal, task, or day plan.
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    if (self.registration?.navigationPreload) {
      try { await self.registration.navigationPreload.enable(); } catch {}
    }
  })());
});

function payloadFromEvent(event) {
  try { return event.data ? event.data.json() : {}; }
  catch {
    return { title: 'Tempo reminder', body: event.data?.text?.() || 'You have a Tempo reminder.' };
  }
}

function safeTempoUrl(input) {
  try {
    const raw = String(input || '/');
    const url = new URL(raw, self.location.origin);
    if (url.origin !== self.location.origin) return '/';
    const page = url.searchParams.get('page');
    if (page && !['today','calendar','tasks','affirmations'].includes(page)) {
      url.searchParams.set('page', 'today');
    }
    // Removed/legacy routes should simply open Tempo instead of a blank/old page.
    if (url.pathname !== '/') return '/';
    return `${url.pathname}${url.search}${url.hash}` || '/';
  } catch {
    return '/';
  }
}

function notificationOptions(payload) {
  const data = payload.data || {};
  const actions = Array.isArray(payload.actions) ? payload.actions : [];
  return {
    body: payload.body || 'Open Tempo to check your day.',
    icon: payload.icon || '/icon-192.png',
    badge: payload.badge || '/icon-192.png',
    tag: payload.tag,
    renotify: Boolean(payload.tag),
    actions,
    data: {
      url: safeTempoUrl(data.url || payload.url || '/'),
      actionToken: data.actionToken || payload.actionToken || null,
      taskId: data.taskId || payload.taskId || null,
      habitId: data.habitId || payload.habitId || null,
      date: data.date || payload.date || null,
      sourceType: data.sourceType || payload.sourceType || null,
      sourceId: data.sourceId || payload.sourceId || null,
      swVersion: TEMPO_SW_VERSION,
    },
  };
}

self.addEventListener('push', event => {
  const payload = payloadFromEvent(event);
  const title = payload.title || 'Tempo reminder 🌸';
  event.waitUntil(self.registration.showNotification(title, notificationOptions(payload)));
});

async function postReminderAction(data, body) {
  try {
    const res = await fetch('/api/push/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, actionToken: data?.actionToken || null }),
    });
    const parsed = await res.json().catch(() => ({}));
    return res.ok && parsed?.ok !== false ? { ok: true, ...parsed } : { ok: false, ...parsed };
  } catch {
    return { ok: false };
  }
}

async function openTempoWindow(url) {
  const safeUrl = safeTempoUrl(url);
  const allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
  for (const client of allClients) {
    if ('focus' in client) {
      try { await client.navigate(safeUrl); } catch {}
      return client.focus();
    }
  }
  if (clients.openWindow) return clients.openWindow(safeUrl);
}

self.addEventListener('notificationclick', event => {
  const data = event.notification?.data || {};
  const action = event.action || 'open';
  const url = safeTempoUrl(data.url || '/');
  event.notification.close();

  event.waitUntil((async () => {
    if (action === 'snooze_5' || action === 'snooze_10' || action === 'snooze_30') {
      const minutes = Number(action.split('_')[1] || 10);
      const result = await postReminderAction(data, { action: 'snooze', minutes });
      await self.registration.showNotification(result?.ok ? 'Snoozed 🌸' : 'Could not snooze', {
        body: result?.ok ? `Reminder will come back in ${minutes} minutes.` : 'Open Tempo to check this reminder.',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        data: { url },
      });
      return;
    }

    if (action === 'mark_done') {
      const result = await postReminderAction(data, { action: 'complete_task' });
      await self.registration.showNotification(result?.ok ? 'Task marked done ✅' : 'Could not mark task done', {
        body: result?.ok ? 'Tempo updated this task.' : 'Open Tempo to check the task.',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        data: { url },
      });
      return;
    }

    return openTempoWindow(url);
  })());
});
