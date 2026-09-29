'use client';

import { useEffect } from 'react';

/**
 * Shared-auth SSO landing. The user verified on auth.baalvion.com; the auth surface redirects back here
 * with the short-lived access token in the URL hash.
 *
 * CROSS-APEX CAVEAT: Law Elite Network lives on its own apex (lawelitenetwork.com), so the shared
 * `.baalvion.com` refresh cookie does NOT reach this origin. We therefore stash the access token
 * (token-stash variant) and continue. The app's primary token store is in-memory (src/lib/api/client.ts
 * `setToken`) and is empty on this fresh page load, so we stash under the shared key the Baalvion sites
 * agree on. This gives a working session for the current visit only — durable cross-apex SSO needs a
 * backend token-exchange follow-up (mint a lawelitenetwork.com refresh cookie from the shared token),
 * which is not yet wired.
 */
export default function SsoCallbackPage() {
  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const token = hash.get('token');
    if (token) {
      try {
        sessionStorage.setItem('baalvion_access', token);
      } catch {
        /* storage blocked — degrade gracefully; the user can still sign in via /login */
      }
    }
    const next = new URLSearchParams(window.location.search).get('next');
    window.location.replace(safeNext(next));
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
