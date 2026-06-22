/**
 * @file app/api/compliance/goods-screening/route.ts
 * @description Authenticated BFF endpoint that screens goods against the Rule/Policy
 * Engine's restricted-goods rule set (global baseline + tenant override). Returns the
 * decision (ALLOW/DENY/REVIEW) plus required licenses and certificates.
 *
 * Identity + tenant come solely from the gateway-signed principal (CR-1/CR-3); the
 * evaluation is rate-limited, audited and emitted as a RULE_EVALUATED event.
 */
import { z } from 'zod';
import { ok, toErrorResponse, rateLimit, clientKey } from '@/server/http/api';
import { ruleRequest } from '@/server/rules/http';
import { screenGoods } from '@/server/rules/goods-screening';

export const runtime = 'nodejs';

const goodsScreeningSchema = z.object({
  hsCode: z.string().max(32).nullish(),
  productCategory: z.string().max(128).nullish(),
  originCountry: z.string().max(64).nullish(),
  destinationCountry: z.string().max(64).nullish(),
  direction: z.enum(['IMPORT', 'EXPORT', 'BOTH']).optional(),
  quantity: z.number().nonnegative().optional(),
  value: z.number().nonnegative().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(req: Request) {
  try {
    const { principal, ctx } = ruleRequest(req);
    rateLimit(clientKey(principal, 'goods-screening'), 600, 60_000);
    const body = goodsScreeningSchema.parse(await req.json());
    return ok(await screenGoods(ctx, body));
  } catch (err) {
    return toErrorResponse(err);
  }
}
