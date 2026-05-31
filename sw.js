/* EduUY · Service Worker (PWA)
   - Hace el sitio instalable y utilizable sin conexión (cachea el propio sitio).
   - NO toca las llamadas a Supabase (otro dominio) ni los envíos (POST): pasan directo.
*/
const CACHE = 'eduuy-v1';

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
  // Solo manejamos GET del MISMO origen (HTML, íconos, manifest).
  // Todo lo demás (Supabase, POST, etc.) pasa de largo sin tocarse.
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      })
      .catch(() => caches.match(req))
  );
});
