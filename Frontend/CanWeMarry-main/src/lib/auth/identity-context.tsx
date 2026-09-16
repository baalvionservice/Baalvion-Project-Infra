'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { identity as identityApi } from '@/lib/api';
import type { Identity } from '@/lib/api/types';
import '@/lib/auth/session';

interface IdentityState {
  identity: Identity | null;
  loading: boolean;
  refresh: () => Promise<void>;
  can: (permission: string) => boolean;
  hasRole: (...roles: string[]) => boolean;
}

const IdentityContext = createContext<IdentityState | null>(null);

/**
 * The signed-in caller, held once for the whole app.
 *
 * This decides which NAVIGATION to render and nothing else. `can()` mirrors the server's
 * permission table so a person is not shown a link that will 403 — but every route
 * re-checks server-side, so a client that lies to itself here gains nothing. Treating this
 * as authorization would be the classic mistake; it is presentation.
 *
 * A 401 resolves to `identity: null` rather than an error: being signed out is a normal
 * state on a site whose whole front half is readable by visitors.
 */
export function IdentityProvider({ initial, children }: { initial: Identity | null; children: ReactNode }) {
  // Seeded from the server render, so the shell knows who it is drawing for on the first
  // paint. Two things follow: the navigation never flashes signed-out and then corrects
  // itself, and an anonymous visitor makes no client request at all — the gateway guards
  // /api with a session and would answer 401, which is a fault-shaped response to the
  // ordinary state of not being signed in.
  const [identity, setIdentity] = useState<Identity | null>(initial);
  const [loading, setLoading] = useState(false);

  /** Re-read after something changes who the caller is: login, logout, a new role. */
  const refresh = useCallback(async () => {
    setLoading(true);
    const result = await identityApi.me();
    setIdentity(result.ok && result.data.authenticated ? result.data : null);
    setLoading(false);
  }, []);

  const can = useCallback(
    (permission: string) => Boolean(identity?.permissions.includes(permission)),
    [identity],
  );

  const hasRole = useCallback(
    (...roles: string[]) => Boolean(identity && roles.some((r) => identity.roles.includes(r as Identity['roles'][number]))),
    [identity],
  );

  return (
    <IdentityContext.Provider value={{ identity, loading, refresh, can, hasRole }}>
      {children}
    </IdentityContext.Provider>
  );
}

export function useIdentity(): IdentityState {
  const ctx = useContext(IdentityContext);
  if (!ctx) throw new Error('useIdentity must be used inside <IdentityProvider>');
  return ctx;
}
