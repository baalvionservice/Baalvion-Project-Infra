'use client';

import { useEffect } from 'react';

/**
 * Shared-auth SSO landing for the Jobs Portal. Jobs is cookie-based and on the same .baalvion.com
 * apex, so the refresh cookie set by the shared auth surface is available here. We exchange it for a
 * fresh Jobs session via the same-origin auth BFF (`/api/auth/*` → auth-service, see authClient.ts),
 * then land the user where they started (the app rehydrates from the cookie).
 */
export default function SsoCallbackPage() {
  useEffect(() => {
    const next = new URLSearchParams(window.location.search).get('next');
    (async () => {
      try {
        await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' });
      } catch {
        /* best-effort — the app resolves session state via its own auth provider */
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
