import { NextResponse } from 'next/server';

// The live price of one USDT in dollars, rupees and dirhams, from CoinGecko's public simple-price endpoint (no key).
// Cached for a minute. On any failure it says so and returns no numbers; it never falls back to a made-up price.
export const revalidate = 60;

export async function GET() {
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=usd,inr,aed', { next: { revalidate: 60 }, signal: AbortSignal.timeout(4000) });
    if (!res.ok) throw new Error(`upstream ${res.status}`);
    const data = (await res.json()) as { tether?: { usd?: number; inr?: number; aed?: number } };
    const t = data.tether;
    if (!t || typeof t.usd !== 'number') throw new Error('no price');
    return NextResponse.json({ ok: true, usd: t.usd, inr: t.inr ?? null, aed: t.aed ?? null, at: new Date().toISOString(), source: 'CoinGecko' }, { headers: { 'cache-control': 'public, s-maxage=60, stale-while-revalidate=120' } });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200, headers: { 'cache-control': 'public, s-maxage=15' } });
  }
}
