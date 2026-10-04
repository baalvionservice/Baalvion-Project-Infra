import { NextResponse } from 'next/server';

// Live crypto prices for the header ticker, from CoinGecko's public simple-price endpoint
// (no key). Cached for a minute at the edge. On any failure it returns an empty list and the
// ticker simply shows nothing; it never falls back to made-up prices.
const COINS: { id: string; pair: string }[] = [
  { id: 'bitcoin', pair: 'BTC' },
  { id: 'ethereum', pair: 'ETH' },
  { id: 'solana', pair: 'SOL' },
  { id: 'tether', pair: 'USDT' },
];

export const revalidate = 60;

export async function GET() {
  try {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${COINS.map((c) => c.id).join(',')}&vs_currencies=usd&include_24hr_change=true`;
    const res = await fetch(url, { next: { revalidate: 60 }, signal: AbortSignal.timeout(4000) });
    if (!res.ok) throw new Error(`upstream ${res.status}`);
    const data = (await res.json()) as Record<string, { usd?: number; usd_24h_change?: number }>;
    const items = COINS.flatMap(({ id, pair }) => {
      const row = data[id];
      if (!row || typeof row.usd !== 'number') return [];
      const change = row.usd_24h_change ?? 0;
      return [{
        pair,
        price: row.usd.toLocaleString('en-US', { maximumFractionDigits: row.usd < 10 ? 2 : 0 }),
        change: `${Math.abs(change).toFixed(1)}%`,
        pos: change >= 0,
      }];
    });
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ items: [] });
  }
}
