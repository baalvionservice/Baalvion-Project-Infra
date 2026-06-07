import type { Metadata } from 'next';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { getPublicMarket } from '@/lib/ir-public';

export const revalidate = 120;
export const metadata: Metadata = {
  title: 'Stock Information | Baalvion Investor Relations',
  description: 'Baalvion share price, market capitalisation, trading volume and dividend information.',
  alternates: { canonical: '/news-and-events/stock' },
};

const fmt = (n: number | null, currency = 'USD') => (n == null ? '—' : n.toLocaleString(undefined, { style: 'currency', currency, maximumFractionDigits: 2 }));
const compact = (n: number | null) => (n == null ? '—' : Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(n));

export default async function StockPage() {
  const m = await getPublicMarket();
  const up = (m?.changePct ?? 0) >= 0;

  return (
    <div className="animate-in fade-in duration-700">
      <section className="border-b border-border/60 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <p className="text-sm font-medium uppercase tracking-widest text-primary">Investor Relations</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">Stock Information</h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">Current share price and key market data.</p>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-6 py-12">
        {!m ? (
          <p className="rounded-xl border border-dashed py-20 text-center text-sm text-muted-foreground">Stock information is not available at this time.</p>
        ) : (
          <div className="space-y-6">
            <div className="rounded-2xl border border-border/60 bg-card/40 p-8">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{m.symbol} {m.exchange ? `· ${m.exchange}` : ''}</p>
                  <p className="mt-1 text-5xl font-bold tracking-tight">{fmt(m.price, m.currency)}</p>
                </div>
                <div className={`flex items-center gap-1 text-lg font-medium ${up ? 'text-green-600' : 'text-red-600'}`}>
                  {up ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                  {m.changePct != null ? `${m.changePct.toFixed(2)}%` : '—'}
                </div>
              </div>
              {m.asOf && <p className="mt-3 text-xs text-muted-foreground">As of {new Date(m.asOf).toLocaleString()}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {[
                ['Market cap', compact(m.marketCap)],
                ['Volume', compact(m.volume)],
                ['52-week high', fmt(m.week52High, m.currency)],
                ['52-week low', fmt(m.week52Low, m.currency)],
                ['P/E ratio', m.peRatio != null ? m.peRatio.toFixed(2) : '—'],
                ['Dividend yield', m.dividendYield != null ? `${m.dividendYield}%` : '—'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-border/60 bg-card/40 p-4">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="mt-1 text-lg font-semibold">{value}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Market data is provided for information purposes and may be delayed.</p>
          </div>
        )}
      </section>
    </div>
  );
}
