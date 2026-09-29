'use client';

import { useEffect } from 'react';

/**
 * Shared-auth SSO landing. The user verified on auth.baalvion.com; the shared refresh cookie is set
 * on .baalvion.com. We stash the short-lived access token (from the URL hash) for any client API
 * calls, then return the user to where they started.
 */
export default function SsoCallbackPage() {
  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const token = hash.get('token');
    if (token) {
      try {
        sessionStorage.setItem('baalvion_access', token);
      } catch {
        /* storage blocked — the shared cookie still carries the session */
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
