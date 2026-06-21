/**
 * @file server/ledger/http.ts
 * @description Bridges a verified request principal to the ledger/settlement
 * ActorContext. Identity + tenant come solely from the gateway-signed principal
 * (CR-1/CR-3); the client IP is best-effort, for the audit trail only.
 */
import { principalFrom, type Principal } from '@/server/http/api';
import type { ActorContext } from '@/server/services/ledger-service';

function clientIp(req: Request): string | null {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0]?.trim() || null;
  return req.headers.get('x-real-ip');
}

/** Verify the principal and derive the ledger actor context + raw principal. */
export function ledgerRequest(req: Request): { principal: Principal; ctx: ActorContext } {
  const principal = principalFrom(req);
  return {
    principal,
    ctx: {
      organizationId: principal.organizationId,
      actorId: principal.actorId,
      actorRole: principal.actorRole,
      ip: clientIp(req),
    },
  };
}
