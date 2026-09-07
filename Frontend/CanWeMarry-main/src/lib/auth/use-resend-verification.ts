'use client';

import { useCallback, useState } from 'react';

const BFF = '/auth-bff';

/** Where to send somebody back to once their address is confirmed. */
const RETURN_KEY = 'cwm:after-verify';

export type ResendState = 'idle' | 'sending' | 'sent' | 'failed';

/**
 * Ask for a fresh confirmation link.
 *
 * The endpoint answers the same way for an address that has no account, one already
 * confirmed, and one genuinely waiting — so this hook cannot report "we sent it" as a fact
 * about the account, only as a fact about the request. The wording it drives says exactly
 * that, and says it identically in every case.
 *
 * No page passes an address in. The caller is signed in, so their own address is read from
 * the session first — letting a component name an arbitrary one would turn a convenience
 * into a way to mail a stranger. CanWeMarry's own /me deliberately holds no email; the
 * identity service is where that belongs, and it is the only thing asked.
 */
export function useResendVerification() {
  const [state, setState] = useState<ResendState>('idle');

  const resend = useCallback(async () => {
    setState('sending');
    try {
      const session = await fetch(`${BFF}/auth/me`, { credentials: 'include' });
      if (!session.ok) { setState('failed'); return; }
      const email = (await session.json())?.user?.email;
      if (!email) { setState('failed'); return; }

      const response = await fetch(`${BFF}/auth/resend-verification`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setState(response.ok ? 'sent' : 'failed');
    } catch {
      setState('failed');
    }
  }, []);

  return { state, resend };
}

/**
 * Remember the page somebody was on when they were asked to confirm, so the confirmation
 * screen can offer to put them back there.
 *
 * sessionStorage, and deliberately nothing more: it holds a path, never an identity or a
 * token, and it is gone when the tab closes. A link opened on a different device simply
 * finds nothing here and falls back to the ordinary destinations.
 */
export function rememberReturnPath(path: string) {
  try {
    // Same-origin paths only. A stored absolute URL would make the "continue" button an
    // open redirect for anyone who could write this key.
    if (!path.startsWith('/') || path.startsWith('//')) return;
    window.sessionStorage.setItem(RETURN_KEY, path);
  } catch {
    /* private mode, or storage disabled — the fallback destinations still work */
  }
}

export function takeReturnPath(): string | null {
  try {
    const path = window.sessionStorage.getItem(RETURN_KEY);
    window.sessionStorage.removeItem(RETURN_KEY);
    return path && path.startsWith('/') && !path.startsWith('//') ? path : null;
  } catch {
    return null;
  }
}
