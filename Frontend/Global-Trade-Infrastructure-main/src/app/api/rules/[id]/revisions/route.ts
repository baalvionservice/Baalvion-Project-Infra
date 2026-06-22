/**
 * @file app/api/rules/[id]/revisions/route.ts
 * @description Immutable version history for a rule set (and its rules).
 */
import { ok, toErrorResponse } from '@/server/http/api';
import { ruleRequest } from '@/server/rules/http';
import { ruleService } from '@/server/services/rule-service';

export const runtime = 'nodejs';

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { ctx: actor } = ruleRequest(req);
    const { id } = await ctx.params;
    // Confirms the set is visible to the caller (global or own tenant) before history.
    await ruleService.getRuleSet(actor, id);
    return ok(await ruleService.listRevisions(actor, id));
  } catch (err) {
    return toErrorResponse(err);
  }
}
