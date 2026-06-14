/**
 * Server-side auth forwarding for CTM reads.
 *
 * `api.ts` runs as `'use server'`, so the in-memory client access token is invisible to it. The
 * logged-in user's RS256 access JWT also lives in the httpOnly `baalvion_access` cookie the
 * auth-gateway sets at login; this module forwards that cookie value to ctm-service as a Bearer
 * token so server-side reads run AS the caller instead of anonymously. With no session, no header
 * is produced and the (now authMiddleware-gated) endpoints correctly reject with 401.
 *
 * `buildCtmAuthHeader` is pure + framework-free so the forwarding contract is unit-testable
 * without `next/headers`.
 */

/** Name of the httpOnly access-JWT cookie the auth-gateway sets at login (ctm-service reads the same). */
export const CTM_ACCESS_COOKIE = process.env.CTM_ACCESS_COOKIE_NAME ?? "baalvion_access";

/** Bearer header for a present session token; empty (anonymous) when there is none. */
export function buildCtmAuthHeader(token: string | null | undefined): Record<string, string> {
  const trimmed = token?.trim();
  return trimmed ? { Authorization: `Bearer ${trimmed}` } : {};
}
