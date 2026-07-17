'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useMarketDataOverview } from '@/lib/queries/market-data.queries';
import ExchangeStatusBar from './market-data/ExchangeStatusBar';
import MarketTicker from './market-data/MarketTicker';
import StockNewsCard from './market-data/StockNewsCard';
import MarketMovers from './market-data/MarketMovers';
import SectorPerformance from './market-data/SectorPerformance';
import EconomicCalendar from './market-data/EconomicCalendar';
import MarketDataHealthPanel from './market-data/MarketDataHealthPanel';
import type { MarketInstrument } from '@/lib/types/market-data.types';

const BORDER = '#242A33';
const TEXT = '#F5F7FA';
const MUTED = '#9CA3AF';
const SUCCESS = '#16C784';
const ACCENT = '#2D7FF9';
const DANGER = '#EF4444';

function Section({ title, items, nowMs, websiteId }: { title: string; items: MarketInstrument[]; nowMs: number; websiteId: string }) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide" style={{ color: MUTED }}>{title}</p>
      <div>
        {items.map((item) => <MarketTicker key={item.label} item={item} nowMs={nowMs} websiteId={websiteId} />)}
      </div>
    </div>
  );
}

function SubPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border p-3" style={{ borderColor: BORDER }}>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide" style={{ color: TEXT }}>{title}</p>
      {children}
    </div>
  );
}

export default function MarketDataPanel({ websiteId }: { websiteId: string }) {
  const { data, isLoading, isError, dataUpdatedAt } = useMarketDataOverview(websiteId);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (isLoading) return <p className="py-8 text-center text-xs" style={{ color: MUTED }}>Loading market data…</p>;
  if (isError || !data) return <p className="py-8 text-center text-xs" style={{ color: DANGER }}>Couldn&apos;t load market data.</p>;

  const marketOpen = data.exchangeStatus.some((ex) => (ex.code === 'NYSE' || ex.code === 'NASDAQ') && ex.isOpen);
  const secondsSinceUpdate = Math.max(0, Math.round((nowMs - dataUpdatedAt) / 1000));

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className="flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold"
            style={{ borderColor: marketOpen ? SUCCESS : DANGER, color: marketOpen ? SUCCESS : DANGER }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: marketOpen ? SUCCESS : DANGER }} />
            {marketOpen ? 'Market Open' : 'Market Closed'}
          </span>
          <span className="text-[11px]" style={{ color: MUTED }}>Updated {secondsSinceUpdate}s ago</span>
        </div>
        <div className="flex items-center gap-3">
          <ExchangeStatusBar exchanges={data.exchangeStatus} />
          <Link
            href={`/cms/websites/${websiteId}/news/markets`}
            className="flex shrink-0 items-center gap-1 text-[11px] font-semibold"
            style={{ color: ACCENT }}
          >
            View Full Markets <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <Section title="US Markets" items={data.usIndices} nowMs={nowMs} websiteId={websiteId} />
        <Section title="Global Markets" items={data.globalIndices} nowMs={nowMs} websiteId={websiteId} />
        <Section title="Currencies" items={data.forex} nowMs={nowMs} websiteId={websiteId} />
        <Section title="Commodities" items={data.commodities} nowMs={nowMs} websiteId={websiteId} />
        <Section title="Crypto" items={data.crypto} nowMs={nowMs} websiteId={websiteId} />
        <Section title="Bond Yields" items={data.bonds} nowMs={nowMs} websiteId={websiteId} />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SubPanel title="Market Movers">
          <MarketMovers gainers={data.movers.gainers} losers={data.movers.losers} websiteId={websiteId} />
        </SubPanel>
        <SubPanel title="Sector Performance">
          <SectorPerformance sectors={data.sectors} websiteId={websiteId} />
        </SubPanel>
      </div>

      <div className="mt-4">
        <SubPanel title="Economic Calendar">
          <EconomicCalendar events={data.economicCalendar} />
        </SubPanel>
      </div>

      <div className="mt-5">
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide" style={{ color: MUTED }}>Stocks &amp; News</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {data.stocks.map((item) => (
            <StockNewsCard key={item.label} item={item} nowMs={nowMs} websiteId={websiteId} />
          ))}
        </div>
      </div>

      <MarketDataHealthPanel health={data.health} />
    </div>
  );
}
