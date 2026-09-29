/**
 * @fileOverview Admin authorization guard for write-side API route handlers.
 *
 * PLACEHOLDER AUTH — this is a deliberately simple bearer-token gate, NOT a
 * production auth system. It exists so the admin/CMS write contract can be
 * expressed and locked down today, before the real persistence + session layer
 * is wired.
 *
 * TODO(platform): replace this with real session / RBAC auth (signed session
 * cookie or central Baalvion auth-service JWT + role check). See
 * docs/PLATFORM_ARCHITECTURE.md. Until then:
 *   - Set ADMIN_API_TOKEN in the environment (never commit it).
 *   - Callers must send `Authorization: Bearer <ADMIN_API_TOKEN>`.
 *   - If the env var is unset, every write request is rejected (fail closed).
 */

import { fail } from "./respond";

/**
 * Length-independent constant-time-ish string comparison.
 *
 * Avoids the early-exit timing leak of `a === b`. Not cryptographically perfect
 * (lengths can differ in timing) but adequate for a placeholder bearer check;
 * the real session/RBAC layer will supersede this entirely.
 */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

/**
 * Authorizes an admin/write request.
 *
 * @returns a 401 `Response` when the request is NOT authorized, or `null` when
 *          it IS authorized (so callers can `const denied = requireAdmin(req);
 *          if (denied) return denied;`).
 */
export function requireAdmin(req: Request): Response | null {
  const expected = process.env.ADMIN_API_TOKEN;

  // Fail closed: with no configured token there is no way to be authorized.
  if (!expected || expected.length === 0) {
    return fail("Unauthorized", 401);
  }

  const header = req.headers.get("authorization");
  if (!header) {
    return fail("Unauthorized", 401);
  }

  const prefix = "Bearer ";
  if (!header.startsWith(prefix)) {
    return fail("Unauthorized", 401);
  }

  const token = header.slice(prefix.length).trim();
  if (!token || !safeEqual(token, expected)) {
    return fail("Unauthorized", 401);
  }

  return null;
}
