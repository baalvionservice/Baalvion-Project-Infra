'use client';

import { useSyncExternalStore } from 'react';

/**
 * Access-control version switch — lets the console run the NEW policy engine or fall back to
 * the ORIGINAL behaviour, live, without a redeploy.
 *
 * "old" is a genuine fallback, not a stub: nothing was deleted when the new layer landed, so
 * the original sidebar role lists (navigation.ts `roles: [...]`) and the legacy PermissionGuard
 * are still present and take over when this is set to "old".
 *
 * What actually differs:
 *   new → route policy (lib/authz/policy.ts) gates all 35 sections; sidebar mirrors it
 *   old → no route gating; sidebar hides links by the per-item `roles` list only
 *
 * The backend is unaffected either way — its guards are the real security boundary, and they
 * enforce identically in both modes. This only changes what the CONSOLE shows.
 */
export type AuthzVersion = 'new' | 'old';

const STORAGE_KEY = 'baalvion.authz.version';

const DEFAULT_VERSION: AuthzVersion =
  process.env.NEXT_PUBLIC_AUTHZ_VERSION === 'old' ? 'old' : 'new';

let current: AuthzVersion | null = null;
const listeners = new Set<() => void>();

function read(): AuthzVersion {
  if (current !== null) return current;
  // Private windows and blocked site-data make storage throw on access, not just return null.
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    current = stored === 'old' || stored === 'new' ? stored : DEFAULT_VERSION;
  } catch {
    current = DEFAULT_VERSION;
  }
  return current;
}

export function getAuthzVersion(): AuthzVersion {
  if (typeof window === 'undefined') return DEFAULT_VERSION;
  return read();
}

export function setAuthzVersion(v: AuthzVersion): void {
  current = v;
  try {
    window.localStorage.setItem(STORAGE_KEY, v);
  } catch {
    // Non-fatal: the switch still applies for this tab, it just won't survive a reload.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Server snapshot is the env default — the stored choice is per-browser and client-only. */
export function useAuthzVersion(): AuthzVersion {
  return useSyncExternalStore(subscribe, getAuthzVersion, () => DEFAULT_VERSION);
}

export const IS_LEGACY_DEFAULT = DEFAULT_VERSION === 'old';
