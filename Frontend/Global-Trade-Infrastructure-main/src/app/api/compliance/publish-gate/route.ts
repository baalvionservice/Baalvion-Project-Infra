/**
 * @file app/api/compliance/publish-gate/route.ts
 * @description Publish gate collection: list (filtered) and evaluate (run the
 * restricted-goods + sanctions + country + moderation screens into a decision).
 */
import { ok, toErrorResponse, parsePagination, rateLimit, clientKey } from '@/server/http/api';
import { complianceRequest } from '@/server/compliance/http';
import { publishGateService } from '@/server/services/publish-gate-service';
import { evaluateGateSchema } from '@/server/compliance/schemas';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const { ctx } = complianceRequest(req);
    const url = new URL(req.url);
    const { page, pageSize } = parsePagination(url);
    const result = await publishGateService.listGates(
      ctx,
      {
        status: url.searchParams.get('status') ?? undefined,
        subjectType: url.searchParams.get('subjectType') ?? undefined,
        subjectId: url.searchParams.get('subjectId') ?? undefined,
        decision: url.searchParams.get('decision') ?? undefined,
        tradeId: url.searchParams.get('tradeId') ?? undefined,
      },
      { page, pageSize },
    );
    return ok(result);
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function POST(req: Request) {
  try {
    const { principal, ctx } = complianceRequest(req);
    rateLimit(clientKey(principal, 'compliance-gate'), 120, 60_000);
    const body = evaluateGateSchema.parse(await req.json());
    const result = await publishGateService.evaluate(ctx, body);
    return ok(result, 201);
  } catch (err) {
    return toErrorResponse(err);
  }
}
