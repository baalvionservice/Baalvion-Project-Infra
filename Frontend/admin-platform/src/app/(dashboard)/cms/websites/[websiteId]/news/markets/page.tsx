'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useMarketDataOverview } from '@/lib/queries/market-data.queries';
import { useUIStore } from '@/lib/store/uiStore';
import ExchangeStatusBar from '@/components/cms/newsroom/market-data/ExchangeStatusBar';
import MarketTicker from '@/components/cms/newsroom/market-data/MarketTicker';
import MarketMovers from '@/components/cms/newsroom/market-data/MarketMovers';
import SectorPerformance from '@/components/cms/newsroom/market-data/SectorPerformance';
import EconomicCalendar from '@/components/cms/newsroom/market-data/EconomicCalendar';
import type { MarketInstrument } from '@/lib/types/market-data.types';

const BG = '#0F1115';
const CARD = '#181C22';
const BORDER = '#242A33';
const TEXT = '#F5F7FA';
const MUTED = '#9CA3AF';
const SUCCESS = '#16C784';
const DANGER = '#EF4444';

function Region({ title, items, nowMs, websiteId }: { title: string; items: MarketInstrument[]; nowMs: number; websiteId: string }) {
  return (
    <div className="rounded-xl border p-4" style={{ background: CARD, borderColor: BORDER }}>
      <h2 className="mb-2 text-sm font-bold" style={{ color: TEXT }}>{title}</h2>
      {items.length === 0 ? (
        <p className="py-4 text-center text-xs" style={{ color: MUTED }}>No instruments tracked in this section.</p>
      ) : (
        items.map((item) => <MarketTicker key={item.label} item={item} nowMs={nowMs} websiteId={websiteId} />)
      )}
    </div>
  );
}

function bySameRegion(items: MarketInstrument[], region: string) {
  return items.filter((i) => i.region === region);
}

export default function MarketsDirectoryPage({ params }: { params: Promise<{ websiteId: string }> }) {
  const { websiteId } = use(params);
  const { setBreadcrumbs } = useUIStore();
  const { data, isLoading, isError, dataUpdatedAt } = useMarketDataOverview(websiteId);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    setBreadcrumbs([
      { label: 'CMS', href: '/cms' },
      { label: 'News', href: `/cms/websites/${websiteId}/news` },
      { label: 'Markets' },
    ]);
  }, [setBreadcrumbs, websiteId]);

  if (isLoading) {
    return <div className="-m-6 min-h-[calc(100vh-4rem)] p-6" style={{ background: BG, color: MUTED }}>Loading markets…</div>;
  }
  if (isError || !data) {
    return <div className="-m-6 min-h-[calc(100vh-4rem)] p-6" style={{ background: BG, color: DANGER }}>Couldn&apos;t load market data.</div>;
  }

  const secondsSinceUpdate = Math.max(0, Math.round((nowMs - dataUpdatedAt) / 1000));

  return (
    <div className="-m-6 min-h-[calc(100vh-4rem)] p-6" style={{ background: BG }}>
      <Link href={`/cms/websites/${websiteId}/news`} className="mb-4 inline-flex items-center gap-1 text-xs" style={{ color: MUTED }}>
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Newsroom
      </Link>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: TEXT }}>Markets</h1>
          <p className="text-xs" style={{ color: MUTED }}>Updated {secondsSinceUpdate}s ago</p>
        </div>
        <ExchangeStatusBar exchanges={data.exchangeStatus} />
      </div>

      {/* U.S. — indices, movers, sectors */}
      <section className="mb-6">
        <h2 className="mb-3 text-lg font-bold" style={{ color: TEXT }}>U.S.</h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Region title="Indices" items={data.usIndices} nowMs={nowMs} websiteId={websiteId} />
          <div className="rounded-xl border p-4 lg:col-span-2" style={{ background: CARD, borderColor: BORDER }}>
            <h3 className="mb-2 text-sm font-bold" style={{ color: TEXT }}>Market Movers</h3>
            <MarketMovers gainers={data.movers.gainers} losers={data.movers.losers} websiteId={websiteId} />
          </div>
        </div>
        <div className="mt-4 rounded-xl border p-4" style={{ background: CARD, borderColor: BORDER }}>
          <h3 className="mb-2 text-sm font-bold" style={{ color: TEXT }}>Sector Performance</h3>
          <SectorPerformance sectors={data.sectors} websiteId={websiteId} />
        </div>
      </section>

      {/* Global regions */}
      <section className="mb-6">
        <h2 className="mb-3 text-lg font-bold" style={{ color: TEXT }}>Global Markets</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Region title="Europe" items={bySameRegion(data.globalIndices, 'Europe')} nowMs={nowMs} websiteId={websiteId} />
          <Region title="Asia-Pacific" items={bySameRegion(data.globalIndices, 'Asia-Pacific')} nowMs={nowMs} websiteId={websiteId} />
          <Region title="China" items={bySameRegion(data.globalIndices, 'China')} nowMs={nowMs} websiteId={websiteId} />
          <Region title="Emerging Markets" items={bySameRegion(data.globalIndices, 'Emerging Markets')} nowMs={nowMs} websiteId={websiteId} />
        </div>
      </section>

      {/* Crypto / Commodities / Currencies */}
      <section className="mb-6">
        <h2 className="mb-3 text-lg font-bold" style={{ color: TEXT }}>Crypto, Commodities &amp; Currencies</h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Region title="Crypto" items={data.crypto} nowMs={nowMs} websiteId={websiteId} />
          <Region title="Commodities" items={data.commodities} nowMs={nowMs} websiteId={websiteId} />
          <Region title="Currencies" items={data.forex} nowMs={nowMs} websiteId={websiteId} />
        </div>
      </section>

      <section className="mb-6">
        <h2 className="mb-3 text-lg font-bold" style={{ color: TEXT }}>Bond Yields</h2>
        <Region title="U.S. Treasury" items={data.bonds} nowMs={nowMs} websiteId={websiteId} />
      </section>

      <section>
        <div className="rounded-xl border p-4" style={{ background: CARD, borderColor: BORDER }}>
          <h2 className="mb-2 text-sm font-bold" style={{ color: TEXT }}>Economic Calendar</h2>
          <EconomicCalendar events={data.economicCalendar} />
        </div>
      </section>

      <p className="mt-4 text-center text-[11px]" style={{ color: SUCCESS }}>
        Click any instrument for its full quote page with charts, statistics, and news.
      </p>
    </div>
  );
}
