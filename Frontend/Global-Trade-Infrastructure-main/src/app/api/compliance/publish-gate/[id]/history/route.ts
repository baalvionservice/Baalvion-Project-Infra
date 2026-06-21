/**
 * @file app/api/compliance/publish-gate/[id]/history/route.ts
 * @description The immutable forensic timeline of a publish gate (every
 * evaluation and operator decision from the audit trail).
 */
import { ok, toErrorResponse } from '@/server/http/api';
import { complianceRequest } from '@/server/compliance/http';
import { publishGateService } from '@/server/services/publish-gate-service';

export const runtime = 'nodejs';

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { ctx: actor } = complianceRequest(req);
    const { id } = await ctx.params;
    return ok(await publishGateService.getHistory(actor, id));
  } catch (err) {
    return toErrorResponse(err);
  }
}
