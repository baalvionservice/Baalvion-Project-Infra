'use client';

import { useEffect } from 'react';

/**
 * Shared-auth SSO landing. The user verified on auth.baalvion.com; the auth surface redirects back here
 * with the short-lived access token in the URL hash.
 *
 * CROSS-APEX CAVEAT: Imperialpedia lives on its own apex (imperialpedia.com), so the shared
 * `.baalvion.com` refresh cookie does NOT reach this origin. We therefore stash the access token
 * (token-stash variant) and continue. This gives a working session for the current visit only —
 * durable cross-apex SSO needs a backend token-exchange follow-up (mint an imperialpedia.com refresh
 * cookie from the shared token) which is not yet wired.
 */
export default function SsoCallbackPage() {
  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const token = hash.get('token');
    if (token) {
      try {
        // The app holds its access token in-memory (src/lib/auth-client.ts) with no persistent store,
        // so on this fresh page load we stash it under the shared key the Baalvion sites agree on.
        sessionStorage.setItem('baalvion_access', token);
      } catch {
        /* storage blocked — degrade gracefully; the user can still sign in via /auth/sign-in */
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
