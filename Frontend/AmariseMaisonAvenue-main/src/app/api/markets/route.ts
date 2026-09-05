import { NextResponse } from 'next/server';

/**
 * Same-origin read of the public markets registry (currency / taxRate / fxRate per market).
 *
 * The browser cannot call commerce-service directly: api.baalvion.com answers without an
 * Access-Control-Allow-Origin for this site, so a client-side fetch is CORS-blocked. That
 * matters because checkout reads taxRate from this feed — a blocked call silently falls back
 * to the bundled static table and bills whatever rate was hardcoded at build time. Proxying it
 * here keeps the rates live without widening the API's CORS allowlist.
 *
 * Server-side callers still hit commerce-service directly (see lib/markets.ts) and skip this hop.
 */
const COMMERCE_URL = process.env.NEXT_PUBLIC_COMMERCE_URL || 'http://localhost:3012/api/v1';
const REVALIDATE_SECONDS = 300;

export const revalidate = 300;

export async function GET() {
  try {
    const res = await fetch(`${COMMERCE_URL}/commerce/markets`, {
      next: { revalidate: REVALIDATE_SECONDS },
      headers: { accept: 'application/json' },
    });
    if (!res.ok) {
      // 502 (not 200-with-empty) so the caller's catch treats it as "feed down" and falls back
      // to the static table, rather than reading an empty registry as "no markets exist".
      return NextResponse.json({ error: 'markets_upstream_error' }, { status: 502 });
    }
    return NextResponse.json(await res.json(), {
      headers: {
        'Cache-Control': `public, s-maxage=${REVALIDATE_SECONDS}, stale-while-revalidate=600`,
      },
    });
  } catch {
    return NextResponse.json({ error: 'markets_unreachable' }, { status: 502 });
  }
}
