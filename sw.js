/* EduUY · Service Worker (PWA + Push)
   - Hace el sitio instalable y utilizable sin conexión (cachea el propio sitio).
   - NO toca las llamadas a Supabase (otro dominio) ni los envíos (POST): pasan directo.
   - Recibe y muestra las notificaciones push.
*/
const CACHE = 'eduuy-v2';

self.addEventListener('install', (e) => { self.skipWaiting(); });

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(req)
      .then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return res; })
      .catch(() => caches.match(req))
  );
});

/* ---- Push ---- */
self.addEventListener('push', (e) => {
  let data = {};
  try { data = e.data ? e.data.json() : {}; }
  catch (_) { data = { title: 'EduUY', body: e.data ? e.data.text() : '' }; }
  const title = data.title || 'EduUY';
  const opts = {
    body: data.body || '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { url: data.url || '/eduuy-demo.html' }
  };
  e.waitUntil(self.registration.showNotification(title, opts));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || '/eduuy-demo.html';
  e.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((wins) => {
      for (const w of wins) { if (w.url.includes(url) && 'focus' in w) return w.focus(); }
      return self.clients.openWindow(url);
    })
  );
});
