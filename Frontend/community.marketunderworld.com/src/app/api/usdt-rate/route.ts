import { NextResponse } from 'next/server';

// The price of one USDT in dollars, rupees and dirhams, from public sources that need no key, tried in order:
//   1. CoinGecko (USDT itself), 2. Coinbase (USDT itself), 3. a fiat rate table where USDT is taken as one dollar.
// The answer says which source it came from. If none answers it says so and returns no numbers; a price is never made up.
export const revalidate = 60;

type Rates = { usd: number; inr: number | null; aed: number | null };
const timeout = () => AbortSignal.timeout(4000);

async function coingecko(): Promise<Rates> {
  const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=usd,inr,aed', { next: { revalidate: 60 }, signal: timeout() });
  if (!res.ok) throw new Error(`coingecko ${res.status}`);
  const t = ((await res.json()) as { tether?: { usd?: number; inr?: number; aed?: number } }).tether;
  if (!t || typeof t.usd !== 'number') throw new Error('coingecko empty');
  return { usd: t.usd, inr: t.inr ?? null, aed: t.aed ?? null };
}

async function coinbase(): Promise<Rates> {
  const res = await fetch('https://api.coinbase.com/v2/exchange-rates?currency=USDT', { next: { revalidate: 60 }, signal: timeout() });
  if (!res.ok) throw new Error(`coinbase ${res.status}`);
  const r = ((await res.json()) as { data?: { rates?: Record<string, string> } }).data?.rates ?? {};
  const n = (k: string) => (r[k] && Number.isFinite(Number(r[k])) ? Number(r[k]) : null);
  const usd = n('USD');
  if (usd === null) throw new Error('coinbase empty');
  return { usd, inr: n('INR'), aed: n('AED') };
}

async function fiatTable(): Promise<Rates> {
  const res = await fetch('https://open.er-api.com/v6/latest/USD', { next: { revalidate: 300 }, signal: timeout() });
  if (!res.ok) throw new Error(`er-api ${res.status}`);
  const r = ((await res.json()) as { rates?: Record<string, number> }).rates ?? {};
  if (typeof r.INR !== 'number') throw new Error('er-api empty');
  return { usd: 1, inr: r.INR, aed: typeof r.AED === 'number' ? r.AED : null };
}

export async function GET() {
  const tried: string[] = [];
  for (const [source, fn, exact] of [['CoinGecko', coingecko, true], ['Coinbase', coinbase, true], ['exchange-rate table (USDT counted as $1)', fiatTable, false]] as const) {
    try {
      const rates = await fn();
      return NextResponse.json({ ok: true, ...rates, at: new Date().toISOString(), source, exact }, { headers: { 'cache-control': 'public, s-maxage=60, stale-while-revalidate=120' } });
    } catch (e) { tried.push(e instanceof Error ? e.message : 'failed'); }
  }
  return NextResponse.json({ ok: false, tried }, { status: 200, headers: { 'cache-control': 'public, s-maxage=15' } });
}
