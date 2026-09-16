/**
 * @file app/api/gckb/public/corridor/route.ts
 * @description Public, unauthenticated ocean-corridor planner. Given two published
 * port codes it returns the routed distance, the canals and straits transited, a
 * transit-time estimate and the canal-free alternative. Rate-limited per client IP.
 */
import { z } from 'zod';
import { ok, toErrorResponse, rateLimit } from '@/server/http/api';
import { planCorridor } from '@/server/gckb/corridor';
import { optionalOrganizationId } from '@/server/gckb/optional-identity';

export const runtime = 'nodejs';

const querySchema = z.object({
  origin: z.string().min(2).max(16),
  destination: z.string().min(2).max(16),
  // Container services run roughly 14-20 knots; the bounds keep a stray query
  // from producing a transit time nobody could sail.
  speedKnots: z.coerce.number().min(6).max(30).optional(),
  portDays: z.coerce.number().min(0).max(30).optional(),
  vesselClass: z.string().max(24).optional(),
  /** Comma-separated container equipment codes, e.g. "40HC,20RF". */
  equipment: z.string().max(200).optional(),
});

function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0]?.trim() || 'anon';
  return req.headers.get('x-real-ip') ?? 'anon';
}

export async function GET(req: Request) {
  try {
    rateLimit(`corridor:${clientIp(req)}`, 120, 60_000);
    const url = new URL(req.url);
    const query = querySchema.parse({
      origin: url.searchParams.get('origin'),
      destination: url.searchParams.get('destination'),
      speedKnots: url.searchParams.get('speedKnots') ?? undefined,
      portDays: url.searchParams.get('portDays') ?? undefined,
      vesselClass: url.searchParams.get('vesselClass') ?? undefined,
      equipment: url.searchParams.get('equipment') ?? undefined,
    });

    return ok(
      await planCorridor({
        originCode: query.origin,
        destinationCode: query.destination,
        serviceSpeedKnots: query.speedKnots,
        portDays: query.portDays,
        vesselClassId: query.vesselClass,
        equipment: query.equipment ? query.equipment.split(',').map((c) => c.trim()).filter(Boolean) : undefined,
        organizationId: optionalOrganizationId(req),
      }),
    );
  } catch (err) {
    return toErrorResponse(err);
  }
}
