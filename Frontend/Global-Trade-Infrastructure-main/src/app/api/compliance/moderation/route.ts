/**
 * @file app/api/compliance/moderation/route.ts
 * @description AI content moderation for a listing/lot subject.
 */
import { ok, toErrorResponse, rateLimit, clientKey } from '@/server/http/api';
import { complianceRequest } from '@/server/compliance/http';
import { publishGateService } from '@/server/services/publish-gate-service';
import { moderateSchema } from '@/server/compliance/schemas';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { principal, ctx } = complianceRequest(req);
    rateLimit(clientKey(principal, 'compliance-moderate'), 120, 60_000);
    const body = moderateSchema.parse(await req.json());
    const result = await publishGateService.moderate(ctx, body);
    return ok(result, 201);
  } catch (err) {
    return toErrorResponse(err);
  }
}
