// KILL-SWITCH service worker.
//
// A previous cache-first service worker could serve STALE JS chunks / a trapped error page,
// which breaks React hydration (the page falls back to native form submits — login appears to
// just "refresh"). This worker removes itself, clears every cache, and reloads any controlled
// tab so the app runs straight from the network with no SW interference.
//
// There is intentionally NO fetch handler — the browser handles all requests normally.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    } catch (_e) {
      /* ignore */
    }
    try {
      await self.registration.unregister();
    } catch (_e) {
      /* ignore */
    }
    // Reload every open tab once so it re-fetches fresh, consistent assets.
    try {
      const clients = await self.clients.matchAll({ type: 'window' });
      for (const client of clients) {
        client.navigate(client.url);
      }
    } catch (_e) {
      /* ignore */
    }
  })());
});
