/**
 * @file app/api/rules/[id]/route.ts
 * @description A single rule set — read (with its rules), update, archive.
 */
import { ok, toErrorResponse, rateLimit, clientKey } from '@/server/http/api';
import { ruleRequest } from '@/server/rules/http';
import { ruleService } from '@/server/services/rule-service';
import { updateRuleSetSchema } from '@/server/rules/schemas';

export const runtime = 'nodejs';

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { ctx: actor } = ruleRequest(req);
    const { id } = await ctx.params;
    return ok(await ruleService.getRuleSet(actor, id));
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { principal, ctx: actor } = ruleRequest(req);
    rateLimit(clientKey(principal, 'rules-write'), 60, 60_000);
    const { id } = await ctx.params;
    const body = updateRuleSetSchema.parse(await req.json());
    return ok(await ruleService.updateRuleSet(actor, id, body));
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { principal, ctx: actor } = ruleRequest(req);
    rateLimit(clientKey(principal, 'rules-write'), 60, 60_000);
    const { id } = await ctx.params;
    const url = new URL(req.url);
    const reason = url.searchParams.get('reason') ?? undefined;
    return ok(await ruleService.archiveRuleSet(actor, id, reason));
  } catch (err) {
    return toErrorResponse(err);
  }
}
