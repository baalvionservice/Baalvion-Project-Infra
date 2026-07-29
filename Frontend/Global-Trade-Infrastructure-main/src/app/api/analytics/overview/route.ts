/**
 * @file app/api/analytics/overview/route.ts
 * @description Org-scoped analytics: trade volume, pipeline state breakdown,
 * settlement performance, risk exposure, compliance, top destination
 * countries. Same authenticated pattern as api/reporting/route.ts.
 */
import { ok, toErrorResponse } from '@/server/http/api';
import { ledgerRequest } from '@/server/ledger/http';
import { analyticsService } from '@/server/services/analytics-service';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const { ctx } = ledgerRequest(req);
    return ok(await analyticsService.overview(ctx));
  } catch (err) {
    return toErrorResponse(err);
  }
}
