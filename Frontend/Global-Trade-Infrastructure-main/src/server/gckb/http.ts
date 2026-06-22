/**
 * @file server/gckb/http.ts
 * @description Bridges a verified request principal to the GCKB actor context.
 * API callers are always tenant-scoped (organizationId from the signed principal);
 * the platform-global baseline (organizationId NULL) is provisioned by privileged
 * CLI tooling, never via these routes.
 */
import { principalFrom, type Principal } from '@/server/http/api';
import { NotFoundError } from '@/server/db/errors';
import { isKnownEntity } from '@/server/gckb/registry';
import type { KbActorContext } from '@/server/services/gckb-service';

function clientIp(req: Request): string | null {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0]?.trim() || null;
  return req.headers.get('x-real-ip');
}

export function kbRequest(req: Request): { principal: Principal; ctx: KbActorContext } {
  const principal = principalFrom(req);
  return {
    principal,
    ctx: {
      organizationId: principal.organizationId,
      actorId: principal.actorId,
      actorRole: principal.actorRole,
      ip: clientIp(req),
      source: 'api',
    },
  };
}

/** Reject an unknown entity-type path segment with a 404 (fail-closed). */
export function assertEntity(entityType: string): void {
  if (!isKnownEntity(entityType)) throw new NotFoundError('GckbEntity', entityType);
}
