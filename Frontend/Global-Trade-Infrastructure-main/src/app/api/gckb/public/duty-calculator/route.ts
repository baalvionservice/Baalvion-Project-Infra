/**
 * @file app/api/gckb/public/duty-calculator/route.ts
 * @description Public, unauthenticated import-duty / landed-cost estimator. Given a
 * destination country, HS code and customs value, returns an itemised duty + tax
 * breakdown computed from the published knowledge base, with FTA preference
 * applied when the origin qualifies. Rate-limited per client IP.
 */
import { z } from 'zod';
import { ok, toErrorResponse, rateLimit } from '@/server/http/api';
import { estimateDuty } from '@/server/gckb/duty-calculator';
import { hasPublishedTariffData } from '@/server/gckb/public-read';

export const runtime = 'nodejs';

const bodySchema = z.object({
  destinationCountryCode: z.string().min(2).max(8),
  hsCode: z.string().min(2).max(16),
  customsValue: z.number().positive(),
  currency: z.string().length(3),
  originCountryCode: z.string().min(2).max(8).optional(),
  quantity: z.number().positive().optional(),
  unit: z.string().max(16).optional(),
});

function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0]?.trim() || 'anon';
  return req.headers.get('x-real-ip') ?? 'anon';
}

export async function POST(req: Request) {
  try {
    rateLimit(`duty-calc:${clientIp(req)}`, 60, 60_000);
    const body = bodySchema.parse(await req.json());
    // With no tariff schedule published, an estimate would come back as "0 duty", which is
    // wrong rather than empty. Refuse until real rates exist.
    if (!(await hasPublishedTariffData())) {
      return Response.json(
        { success: false, data: null, error: 'Duty estimates are not available yet: tariff rates have not been published.' },
        { status: 503 },
      );
    }
    const estimate = await estimateDuty(body);
    return ok(estimate);
  } catch (err) {
    return toErrorResponse(err);
  }
}
