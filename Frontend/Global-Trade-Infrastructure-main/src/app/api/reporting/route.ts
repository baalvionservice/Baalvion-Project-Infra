/**
 * @file app/api/reporting/route.ts
 * @description Treasury reporting. ?report selects a section (cash-position,
 * fee-income, fx-margin, fx-volume, liquidity); the default is the consolidated
 * dashboard. Every figure is derived on read from the ledger.
 */
import { ok, toErrorResponse } from '@/server/http/api';
import { ledgerRequest } from '@/server/ledger/http';
import { treasuryReportingService } from '@/server/services/treasury-reporting-service';
import { liquidityService } from '@/server/services/liquidity-service';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const { ctx } = ledgerRequest(req);
    const url = new URL(req.url);
    const report = url.searchParams.get('report');
    const currency = url.searchParams.get('currency') ?? undefined;
    switch (report) {
      case 'cash-position':
        return ok(await treasuryReportingService.cashPosition(ctx, currency));
      case 'fee-income':
        return ok(await treasuryReportingService.feeIncome(ctx));
      case 'fx-margin':
        return ok(await treasuryReportingService.fxMargin(ctx));
      case 'fx-volume':
        return ok(await treasuryReportingService.fxVolume(ctx));
      case 'liquidity':
        return ok(await liquidityService.computeAll(ctx));
      default:
        return ok(await treasuryReportingService.dashboard(ctx));
    }
  } catch (err) {
    return toErrorResponse(err);
  }
}
