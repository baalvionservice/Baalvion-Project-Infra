'use client';

import { useEffect } from 'react';
import { brandTokenStore } from '@/lib/api-client';

/**
 * Shared-auth SSO landing for Brand-Connector. Brand-Connector is on the same .baalvion.com apex, so
 * the refresh cookie set by the shared auth surface is available here. We exchange it for a fresh
 * access token via the same-origin auth BFF (`/auth-bff/refresh` → auth-service, see api-client.ts)
 * and seed the in-memory token store; if a short-lived access token arrives in the URL hash, we seed
 * it directly. Then we return the user to where they started.
 */
export default function SsoCallbackPage() {
  useEffect(() => {
    const next = new URLSearchParams(window.location.search).get('next');
    (async () => {
      try {
        const res = await fetch('/auth-bff/refresh', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
        if (res.ok) {
          const json = await res.json().catch(() => ({}));
          const raw = json?.data ?? json;
          const access: string = raw?.accessToken ?? raw?.token ?? '';
          if (access) brandTokenStore.set(access);
        }
      } catch {
        /* best-effort — fall through to the URL-hash token below */
      }

      // Fallback: capture an access token handed back in the URL hash.
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const hashToken = hash.get('token');
      if (hashToken && !brandTokenStore.getAccess()) {
        try {
          brandTokenStore.set(hashToken);
        } catch {
          /* storage blocked — the shared cookie still carries the session */
        }
      }

      window.location.replace(safeNext(next));
    })();
  }, []);

  return (
    <main style={{ minHeight: '60vh', display: 'grid', placeItems: 'center', fontFamily: 'Inter, sans-serif', color: '#666' }}>
      Signing you in…
    </main>
  );
}

/** Only allow same-origin redirects (no open redirect). */
function safeNext(next: string | null): string {
  if (!next) return '/';
  try {
    const u = new URL(next, window.location.origin);
    if (u.origin === window.location.origin) return u.pathname + u.search;
  } catch {
    /* invalid URL */
  }
  return '/';
}
