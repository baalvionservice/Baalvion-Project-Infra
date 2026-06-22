/**
 * @file app/api/compliance/publish-gate/[id]/route.ts
 * @description A single publish gate (tenant-scoped).
 */
import { ok, toErrorResponse } from '@/server/http/api';
import { complianceRequest } from '@/server/compliance/http';
import { publishGateService } from '@/server/services/publish-gate-service';

export const runtime = 'nodejs';

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { ctx: actor } = complianceRequest(req);
    const { id } = await ctx.params;
    return ok(await publishGateService.getGate(actor, id));
  } catch (err) {
    return toErrorResponse(err);
  }
}
