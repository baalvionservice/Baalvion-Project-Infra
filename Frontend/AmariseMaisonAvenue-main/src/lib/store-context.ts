/**
 * STORE_CONTEXT_RESOLVER — resolves the active commerce storeId for AmariseMaison.
 *
 * Resolution order (first hit wins), per canonical store-scoped contract:
 *   1. JWT `store_id` claim   (preferred — set by auth-service once Phase-5 lands; absent today)
 *   2. Subdomain → store map  (only if NEXT_PUBLIC_STORE_DOMAINS JSON is configured)
 *   3. NEXT_PUBLIC_STORE_ID   (config fallback — the realistic source for a single-brand store)
 *
 * Returns null when nothing resolves — callers MUST surface a config error; there is
 * NO implicit default store. Client-side resolution is advisory only: the backend
 * independently enforces store membership via commerce-service `commerceAccess`.
 */

function readToken(): string | null {
  if (typeof document !== 'undefined') {
    const m = document.cookie.match(/(?:^|;\s*)authToken=([^;]+)/);
    if (m) return decodeURIComponent(m[1]);
  }
  if (typeof window !== 'undefined') return window.localStorage.getItem('authToken');
  return null;
}

/** Decode the JWT payload WITHOUT verifying (verification is the backend's job). */
function storeIdFromJwt(): string | null {
  const token = readToken();
  const payload = token?.split('.')[1];
  if (!payload) return null;
  try {
    const b64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = typeof atob === 'function' ? atob(b64) : Buffer.from(b64, 'base64').toString('utf8');
    const claims = JSON.parse(json) as { store_id?: string; storeId?: string };
    return claims.store_id ?? claims.storeId ?? null;
  } catch {
    return null;
  }
}

/** Map the leftmost host label to a storeId via NEXT_PUBLIC_STORE_DOMAINS = {"<sub>":"<storeId>"}. */
function storeIdFromSubdomain(): string | null {
  if (typeof window === 'undefined') return null;
  const map = process.env.NEXT_PUBLIC_STORE_DOMAINS;
  if (!map) return null;
  try {
    const label = window.location.hostname.split('.')[0];
    return (JSON.parse(map) as Record<string, string>)[label] ?? null;
  } catch {
    return null;
  }
}

function storeIdFromConfig(): string | null {
  return process.env.NEXT_PUBLIC_STORE_ID || null;
}

let _warnedFallback = false;

export function getStoreId(): string | null {
  const fromJwt = storeIdFromJwt();
  if (fromJwt) return fromJwt;

  const fromSubdomain = storeIdFromSubdomain();
  if (fromSubdomain) return fromSubdomain;

  const fromConfig = storeIdFromConfig();
  if (fromConfig) {
    if (!_warnedFallback) {
      // eslint-disable-next-line no-console
      console.warn('[STORE_CONTEXT] resolved via NEXT_PUBLIC_STORE_ID fallback (no JWT store_id / subdomain match)');
      _warnedFallback = true;
    }
    return fromConfig;
  }

  // eslint-disable-next-line no-console
  console.warn('[STORE_CONTEXT] STORE_CONTEXT_MISSING — no storeId from JWT, subdomain, or NEXT_PUBLIC_STORE_ID');
  return null;
}

export class StoreContextError extends Error {
  code = 'STORE_CONTEXT_MISSING';
  constructor() {
    super('STORE_CONTEXT_MISSING: no storeId from JWT (store_id), subdomain map, or NEXT_PUBLIC_STORE_ID');
    this.name = 'StoreContextError';
  }
}

export function requireStoreId(): string {
  const id = getStoreId();
  if (!id) throw new StoreContextError();
  return id;
}
