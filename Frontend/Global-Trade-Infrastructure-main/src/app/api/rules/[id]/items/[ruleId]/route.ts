/**
 * @file app/api/rules/[id]/items/[ruleId]/route.ts
 * @description A single rule within a set — update and (soft) delete.
 */
import { ok, toErrorResponse, rateLimit, clientKey } from '@/server/http/api';
import { ruleRequest } from '@/server/rules/http';
import { ruleService } from '@/server/services/rule-service';
import { updateRuleSchema } from '@/server/rules/schemas';

export const runtime = 'nodejs';

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string; ruleId: string }> }) {
  try {
    const { principal, ctx: actor } = ruleRequest(req);
    rateLimit(clientKey(principal, 'rules-write'), 120, 60_000);
    const { id, ruleId } = await ctx.params;
    const body = updateRuleSchema.parse(await req.json());
    return ok(await ruleService.updateRule(actor, id, ruleId, body));
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string; ruleId: string }> }) {
  try {
    const { principal, ctx: actor } = ruleRequest(req);
    rateLimit(clientKey(principal, 'rules-write'), 120, 60_000);
    const { id, ruleId } = await ctx.params;
    const url = new URL(req.url);
    const reason = url.searchParams.get('reason') ?? undefined;
    await ruleService.deleteRule(actor, id, ruleId, reason);
    return ok({ deleted: true });
  } catch (err) {
    return toErrorResponse(err);
  }
}
