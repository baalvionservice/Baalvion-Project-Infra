/**
 * @file app/api/compliance/publish-gate/[id]/decision/route.ts
 * @description Operator decision on a publish gate: approve | reject | publish |
 * suspend | resubmit.
 */
import { ok, toErrorResponse, rateLimit, clientKey } from '@/server/http/api';
import { complianceRequest } from '@/server/compliance/http';
import { publishGateService } from '@/server/services/publish-gate-service';
import { gateDecisionSchema } from '@/server/compliance/schemas';

export const runtime = 'nodejs';

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { principal, ctx: actor } = complianceRequest(req);
    rateLimit(clientKey(principal, 'compliance-decide'), 120, 60_000);
    const { id } = await ctx.params;
    const body = gateDecisionSchema.parse(await req.json());
    return ok(await publishGateService.decide(actor, id, body));
  } catch (err) {
    return toErrorResponse(err);
  }
}
