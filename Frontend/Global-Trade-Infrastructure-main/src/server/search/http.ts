/**
 * @file server/search/http.ts
 * @description PROMPT 8 — bridges a verified request principal to the search
 * routes. Reads are tenant-scoped from the signed principal; the (re)index pass is
 * a privileged operation gated to platform/admin roles (fail-closed).
 */
import { principalFrom, type Principal, UnauthorizedError } from '@/server/http/api';

const REINDEX_ROLES = new Set(['PLATFORM_ADMIN', 'SUPER_ADMIN', 'ADMIN', 'OWNER']);

export function searchRequest(req: Request): { principal: Principal } {
  return { principal: principalFrom(req) };
}

/** Verify the principal and assert it may rebuild the search index. */
export function reindexPrincipal(req: Request): Principal {
  const principal = principalFrom(req);
  const role = (principal.actorRole ?? '').toUpperCase();
  if (!REINDEX_ROLES.has(role)) {
    throw new UnauthorizedError('Reindex requires a platform/admin role');
  }
  return principal;
}
