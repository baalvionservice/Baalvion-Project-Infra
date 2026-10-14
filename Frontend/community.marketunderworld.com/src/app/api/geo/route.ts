import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export const dynamic = 'force-dynamic';

// Cloudflare resolves the visitor's location at the edge, so the country and (for most
// countries, including every Indian state) the sub-national region come from the request
// itself rather than a third-party lookup. Outside Workers there is no `cf` object and every
// field comes back null.
export async function GET(req: Request) {
  let cf: Record<string, unknown> | undefined;
  try {
    cf = (getCloudflareContext().cf as Record<string, unknown> | undefined) ?? undefined;
  } catch {
    cf = undefined;
  }
  const str = (v: unknown) => (typeof v === 'string' && v ? v : null);

  return NextResponse.json(
    {
      ip: req.headers.get('cf-connecting-ip'),
      countryCode: str(cf?.country) ?? req.headers.get('cf-ipcountry'),
      state: str(cf?.region),
      stateCode: str(cf?.regionCode),
      city: str(cf?.city),
      timezone: str(cf?.timezone),
    },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}
