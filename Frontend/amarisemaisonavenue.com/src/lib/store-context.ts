/**
 * STORE_CONTEXT_RESOLVER — the SINGLE store-resolution path for AmariseMaison.
 *
 * Resolution order (first hit wins), per canonical store-scoped contract:
 *   1. JWT `store_id` claim   (read from the IN-MEMORY access token that lib/auth exposes)
 *   2. Subdomain → store map  (only if NEXT_PUBLIC_STORE_DOMAINS JSON is configured)
 *   3. NEXT_PUBLIC_STORE_ID   (config fallback — the realistic source for a single-brand store)
 *
 * Returns null when nothing resolves — callers MUST surface a config error; there is
 * NO implicit default store. Client-side resolution is advisory only: the backend
 * independently enforces store membership via commerce-service `commerceAccess`.
 *
 * Both catalog.ts and api-client.ts resolve storeId through THIS helper (getStoreId).
 */
import { getAccessToken } from './auth';
import { resolveConfiguredStoreId } from './store-id';

/** Decode the JWT payload WITHOUT verifying (verification is the backend's job). */
function storeIdFromJwt(): string | null {
  // lib/auth holds the access token in memory only (never localStorage/cookie), so read it
  // from the source that actually exists — this makes the JWT branch reachable.
  const token = getAccessToken();
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

let _warnedFallback = false;

export function getStoreId(): string | null {
  // 1. In-memory JWT store_id (reachable now that we read auth's actual token source).
  const fromJwt = storeIdFromJwt();
  if (fromJwt) return fromJwt;

  // 2 & 3. Shared env/subdomain resolution (same source catalog.ts uses for the public storefront).
  const fromConfig = resolveConfiguredStoreId();
  if (fromConfig) {
    if (!_warnedFallback) {
      // eslint-disable-next-line no-console -- deliberate startup diagnostic: store resolved via config fallback (once)
      console.warn('[STORE_CONTEXT] resolved via subdomain / NEXT_PUBLIC_STORE_ID (no JWT store_id claim)');
      _warnedFallback = true;
    }
    return fromConfig;
  }

  // eslint-disable-next-line no-console -- deliberate operator diagnostic: store context unresolved (misconfiguration)
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
