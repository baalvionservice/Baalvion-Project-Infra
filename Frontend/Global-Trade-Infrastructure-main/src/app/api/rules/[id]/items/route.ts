/**
 * @file app/api/rules/[id]/items/route.ts
 * @description Rules within a rule set — list and create.
 */
import { ok, toErrorResponse, rateLimit, clientKey } from '@/server/http/api';
import { ruleRequest } from '@/server/rules/http';
import { ruleService } from '@/server/services/rule-service';
import { createRuleSchema } from '@/server/rules/schemas';

export const runtime = 'nodejs';

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { ctx: actor } = ruleRequest(req);
    const { id } = await ctx.params;
    const { rules } = await ruleService.getRuleSet(actor, id);
    return ok(rules);
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { principal, ctx: actor } = ruleRequest(req);
    rateLimit(clientKey(principal, 'rules-write'), 120, 60_000);
    const { id } = await ctx.params;
    const body = createRuleSchema.parse(await req.json());
    return ok(await ruleService.createRule(actor, id, body), 201);
  } catch (err) {
    return toErrorResponse(err);
  }
}
