self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

function payloadFromEvent(event) {
  try { return event.data ? event.data.json() : {}; }
  catch {
    return { title: 'Tempo reminder', body: event.data?.text?.() || 'You have a Tempo reminder.' };
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
      url: data.url || payload.url || '/',
      actionToken: data.actionToken || payload.actionToken || null,
      taskId: data.taskId || payload.taskId || null,
      sourceType: data.sourceType || payload.sourceType || null,
      sourceId: data.sourceId || payload.sourceId || null,
    },
  };
}

self.addEventListener('push', event => {
  const payload = payloadFromEvent(event);
  const title = payload.title || 'Tempo reminder 🌸';
  event.waitUntil(self.registration.showNotification(title, notificationOptions(payload)));
});

async function postReminderAction(data, body) {
  const res = await fetch('/api/push/action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, actionToken: data?.actionToken || null }),
  });
  return res.ok ? res.json().catch(() => ({})) : null;
}

async function openTempoWindow(url) {
  const allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
  for (const client of allClients) {
    if ('focus' in client) {
      try { await client.navigate(url); } catch {}
      return client.focus();
    }
  }
  if (clients.openWindow) return clients.openWindow(url);
}

self.addEventListener('notificationclick', event => {
  const data = event.notification?.data || {};
  const action = event.action || 'open';
  const url = data.url || '/';
  event.notification.close();

  event.waitUntil((async () => {
    if (action === 'snooze_5' || action === 'snooze_10' || action === 'snooze_30') {
      const minutes = Number(action.split('_')[1] || 10);
      await postReminderAction(data, { action: 'snooze', minutes });
      await self.registration.showNotification('Snoozed 🌸', {
        body: `Reminder will come back in ${minutes} minutes.`,
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
