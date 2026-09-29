/**
 * Minimal, dependency-free JWT *payload* decoder.
 *
 * This decodes (does NOT verify) the claims segment of a JWT. Signature verification
 * happens server-side; the client only reads claims to hydrate authz-relevant UI state
 * (role, permissions, org) when a separate profile endpoint omits them.
 */
export interface JwtClaims {
  sub?: string;
  email?: string;
  org_id?: string | null;
  sid?: string;
  jti?: string;
  role?: string;
  roles?: string[];
  permissions?: string[];
  exp?: number;
  iat?: number;
  [key: string]: unknown;
}

/** Decode the payload of a JWT. Returns null on any malformed input. */
export function decodeJwtClaims(token: string | null | undefined): JwtClaims | null {
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;

    // base64url → base64 + padding
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');

    const binary =
      typeof atob === 'function'
        ? atob(padded)
        : Buffer.from(padded, 'base64').toString('binary');

    // Recover UTF-8 (claims may contain non-ASCII names).
    const json = decodeURIComponent(
      Array.prototype.map
        .call(binary, (c: string) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );

    return JSON.parse(json) as JwtClaims;
  } catch {
    return null;
  }
}
