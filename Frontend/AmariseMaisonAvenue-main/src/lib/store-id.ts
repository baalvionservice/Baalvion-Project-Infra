/**
 * Server-safe store-id resolution primitives (NO auth / token dependency), shared by both
 * the public storefront client (catalog.ts, runs in Server Components) and the authed client
 * (store-context.ts, which layers the in-memory JWT `store_id` claim on top).
 *
 * Keeping the env/subdomain resolution here — free of the 'use client' auth module — means
 * catalog.ts and api-client.ts derive their storeId from ONE source instead of two divergent
 * copies, without forcing a client boundary on Server Components.
 */

/** NEXT_PUBLIC_STORE_ID — the realistic source for a single-brand store. */
export function storeIdFromConfig(): string | null {
  return process.env.NEXT_PUBLIC_STORE_ID || null;
}

/** Map the leftmost host label to a storeId via NEXT_PUBLIC_STORE_DOMAINS = {"<sub>":"<storeId>"}. */
export function storeIdFromSubdomain(): string | null {
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

/** Env/subdomain resolution (no JWT) — the part safe to call from a Server Component. */
export function resolveConfiguredStoreId(): string | null {
  return storeIdFromSubdomain() ?? storeIdFromConfig();
}
