'use client';

import { useEffect } from 'react';

/**
 * Shared-auth SSO landing for ControlTheMarket. The user verified on auth.baalvion.com,
 * which redirects back here as `/auth/sso-callback?next=<path>#token=<accessToken>`.
 *
 * CROSS-APEX CAVEAT: CTM lives on controlthemarket.com, NOT a *.baalvion.com host, so the shared
 * `baalvion_refresh` cookie set on `.baalvion.com` does NOT reach this origin. We stash the
 * short-lived access token from the URL hash so the just-completed sign-in is usable on the next
 * page. The app's own auth client holds its access token IN MEMORY only (src/lib/ctm-api-client.ts
 * storeToken), which a hard redirect cannot reach, so we fall back to sessionStorage under the
 * shared 'baalvion_access' key. This is a single-session bridge only — durable cross-apex SSO needs
 * a backend token-exchange follow-up (e.g. a same-origin /auth-bff exchange that mints a
 * controlthemarket.com refresh cookie); without it the session will not survive a full reload.
 */
export default function SsoCallbackPage() {
  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const token = hash.get('token');
    if (token) {
      try {
        sessionStorage.setItem('baalvion_access', token);
      } catch {
        /* storage blocked — nothing we can do on a cross-apex origin */
      }
    }
    const next = new URLSearchParams(window.location.search).get('next');
    window.location.replace(safeNext(next));
  }, []);

  return (
    <main
      style={{
        minHeight: '60vh',
        display: 'grid',
        placeItems: 'center',
        fontFamily: 'var(--font-body, Inter, sans-serif)',
        color: '#374151',
        fontWeight: 500,
      }}
    >
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
