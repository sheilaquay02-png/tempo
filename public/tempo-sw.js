self.addEventListener('install', event => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

self.addEventListener('push', event => {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; } catch { payload = { title: 'Tempo reminder', body: event.data?.text?.() || 'You have a Tempo reminder.' }; }
  const title = payload.title || 'Tempo reminder 🌸';
  const options = {
    body: payload.body || 'Open Tempo to check your day.',
    icon: payload.icon || '/icon-192.png',
    badge: payload.badge || '/icon-192.png',
    data: { url: payload.url || '/' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification?.data?.url || '/';
  event.waitUntil((async () => {
    const allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of allClients) {
      if ('focus' in client) {
        client.navigate(url);
        return client.focus();
      }
    }
    if (clients.openWindow) return clients.openWindow(url);
  })());
});
