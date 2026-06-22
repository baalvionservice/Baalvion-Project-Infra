/**
 * @file app/api/gckb/public/countries/route.ts
 * @description Public, unauthenticated list of published countries in the GCKB.
 * Serves the public Country Explorer and any external JSON consumer. Reads only
 * the global baseline (organizationId NULL) and only PUBLISHED records — enforced
 * in `public-read`, not here.
 */
import { ok, toErrorResponse } from '@/server/http/api';
import { listCountries } from '@/server/gckb/public-read';

export const runtime = 'nodejs';
export const revalidate = 300; // ISR: refresh the public catalog every 5 minutes

export async function GET() {
  try {
    const countries = await listCountries();
    return ok({ items: countries, total: countries.length });
  } catch (err) {
    return toErrorResponse(err);
  }
}
