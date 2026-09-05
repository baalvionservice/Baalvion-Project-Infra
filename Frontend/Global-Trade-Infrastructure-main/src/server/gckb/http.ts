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
import { tradeService } from '@/server/services/trade-service';
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

// Organizations are owned by auth-service; this database only learns of one when a
// member of it first writes here. Every write is audited, and the audit row carries an
// FK to `organizations` — so without this a tenant's first write fails on a foreign-key
// violation that reads like a bug in the write itself.
const provisioned = new Set<string>();

/**
 * Ensure the caller's organization exists in this database before an audited write.
 * Idempotent, and memoised per process so it costs one query per org per instance.
 */
export async function ensureOrganizationProvisioned(principal: Principal): Promise<void> {
  const organizationId = principal.organizationId;
  if (!organizationId || provisioned.has(organizationId)) return;
  await tradeService.ensureOrganization({
    id: organizationId,
    name: `Organization ${organizationId.slice(0, 8)}`,
    slug: `org-${organizationId}`,
  });
  provisioned.add(organizationId);
}

/** Reject an unknown entity-type path segment with a 404 (fail-closed). */
export function assertEntity(entityType: string): void {
  if (!isKnownEntity(entityType)) throw new NotFoundError('GckbEntity', entityType);
}
