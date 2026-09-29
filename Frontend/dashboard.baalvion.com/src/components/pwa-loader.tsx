'use client';
import { useEffect } from 'react';

// Bumped whenever the SW caching strategy changes. Forces a one-time self-heal on existing clients
// that may still have an older, cache-first service worker trapping a stale or error page.
const HEAL_KEY = 'baalvion-sw-healed-v2';

export default function PwaLoader() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const isLocalhost = ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);

    // Tear down ALL existing service workers and ALL caches. A previous cache-first SW could
    // pin a broken/500 page (e.g. from a dev crash) and make login/navigation appear stuck.
    const teardown = async () => {
      try {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
        if (window.caches) {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        }
      } catch {
        /* best-effort */
      }
    };

    const run = async () => {
      // One-time self-heal for clients still carrying the old SW/cache.
      if (typeof localStorage !== 'undefined' && !localStorage.getItem(HEAL_KEY)) {
        await teardown();
        try { localStorage.setItem(HEAL_KEY, '1'); } catch { /* ignore */ }
      }

      // In local dev we keep the service worker OFF — it only causes stale-cache pain on localhost.
      if (isLocalhost) {
        await teardown();
        return;
      }

      // Production: register the current (network-first-for-pages) service worker.
      navigator.serviceWorker.register('/sw.js').catch(() => { /* ignore */ });
    };

    if (document.readyState === 'complete') run();
    else window.addEventListener('load', run, { once: true });
  }, []);

  return null;
}
