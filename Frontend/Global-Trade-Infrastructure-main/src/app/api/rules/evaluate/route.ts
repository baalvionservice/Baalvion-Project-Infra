/**
 * @file app/api/rules/evaluate/route.ts
 * @description Evaluate a rule set (by key) against a facts payload. Merges the
 * platform-global baseline with the caller's tenant override and returns the
 * resolved decision, matched rules and obligations. Static `evaluate` segment
 * takes precedence over the dynamic `[id]` route, so there is no collision.
 */
import { ok, toErrorResponse, rateLimit, clientKey } from '@/server/http/api';
import { ruleRequest } from '@/server/rules/http';
import { ruleService } from '@/server/services/rule-service';
import { evaluateSchema } from '@/server/rules/schemas';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { principal, ctx } = ruleRequest(req);
    rateLimit(clientKey(principal, 'rules-eval'), 600, 60_000);
    const body = evaluateSchema.parse(await req.json());
    return ok(await ruleService.evaluate(ctx, body));
  } catch (err) {
    return toErrorResponse(err);
  }
}
