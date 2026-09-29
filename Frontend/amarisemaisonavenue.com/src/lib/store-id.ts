/**
 * Server-safe store-id resolution primitives (NO auth / token dependency), shared by both
 * the public storefront client (catalog.ts, runs in Server Components) and the authed client
 * (store-context.ts, which layers the in-memory JWT `store_id` claim on top).
 *
 * Keeping the env/subdomain resolution here — free of the 'use client' auth module — means
 * catalog.ts and api-client.ts derive their storeId from ONE source instead of two divergent
 * copies, without forcing a client boundary on Server Components.
 */
import { COUNTRIES_CONFIG } from './mock-global-config';

/** Amarisé is multi-store: each `/[country]/...` route serves that country's own real store. */
export function storeIdFromCountry(country?: string | null): string | null {
  if (!country) return null;
  return COUNTRIES_CONFIG.find((c) => c.code === country)?.storeId ?? null;
}

// Mirrors middleware.ts's COUNTRY_COOKIE — kept as a literal (not imported) because
// middleware.ts is edge-runtime-only and not safe to pull into client/server-component code.
const COUNTRY_COOKIE = 'maison_country';

/**
 * Ambient country → storeId, read from the cookie middleware.ts sets on every request
 * (non-httpOnly by design — it's a market preference, not a secret). This lets every authed
 * call in api-client.ts (cart/checkout/orders/account — ~30 call sites, none of which pass a
 * country today) resolve the right per-country store with NO signature changes: the cookie
 * updates the instant a visitor is on a `/[country]/...` route, so the very next authed call
 * already targets the correct store.
 */
export function storeIdFromCountryCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${COUNTRY_COOKIE}=([^;]+)`));
  const country = match ? decodeURIComponent(match[1]) : null;
  return storeIdFromCountry(country);
}

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

/**
 * Country → env/subdomain resolution (no JWT) — the part safe to call from a Server Component.
 * An explicit `country` (from a `/[country]/...` route param, the most authoritative source)
 * wins; otherwise falls back to the ambient cookie (client-side authed calls, which don't have
 * a route param in scope), then subdomain/env config.
 */
export function resolveConfiguredStoreId(country?: string | null): string | null {
  return storeIdFromCountry(country) ?? storeIdFromCountryCookie() ?? storeIdFromSubdomain() ?? storeIdFromConfig();
}
