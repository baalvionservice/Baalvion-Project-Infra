/**
 * @file app/api/rules/route.ts
 * @description Rule sets collection — list (search/filter) and create.
 */
import { ok, toErrorResponse, parsePagination, rateLimit, clientKey } from '@/server/http/api';
import { ruleRequest } from '@/server/rules/http';
import { ruleService } from '@/server/services/rule-service';
import { createRuleSetSchema } from '@/server/rules/schemas';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const { ctx } = ruleRequest(req);
    const url = new URL(req.url);
    const { page, pageSize } = parsePagination(url);
    const result = await ruleService.listRuleSets(
      ctx,
      {
        category: url.searchParams.get('category') ?? undefined,
        status: url.searchParams.get('status') ?? undefined,
        search: url.searchParams.get('search') ?? undefined,
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
    const { principal, ctx } = ruleRequest(req);
    rateLimit(clientKey(principal, 'rules-write'), 60, 60_000);
    const body = createRuleSetSchema.parse(await req.json());
    const created = await ruleService.createRuleSet(ctx, body);
    return ok(created, 201);
  } catch (err) {
    return toErrorResponse(err);
  }
}
