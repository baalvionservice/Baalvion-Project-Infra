import { NextResponse } from 'next/server';
import { cmsGetHomepage } from '@/lib/cms';

/**
 * Same-origin BFF for the homepage promo content managed in the central CMS.
 * The CMS public API (cms-service) only allows server-side reads, so client
 * components fetch this route instead of calling the CMS directly.
 */
export const dynamic = 'force-dynamic';

export async function GET() {
  const homepage = await cmsGetHomepage();
  return NextResponse.json({ data: homepage });
}
