/**
 * @file server/logistics/http.ts
 * @description Bridges a verified request principal to the logistics ActorContext.
 */
import { principalFrom, type Principal } from '@/server/http/api';
import type { ActorContext } from '@/server/services/ledger-service';

function clientIp(req: Request): string | null {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0]?.trim() || null;
  return req.headers.get('x-real-ip');
}

export function logisticsRequest(req: Request): { principal: Principal; ctx: ActorContext } {
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
