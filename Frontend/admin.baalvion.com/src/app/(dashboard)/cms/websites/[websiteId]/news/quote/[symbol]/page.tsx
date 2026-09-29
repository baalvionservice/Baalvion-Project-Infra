'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, TrendingDown, Newspaper, BarChart3 } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useAssetQuote } from '@/lib/queries/market-data.queries';
import { useUIStore } from '@/lib/store/uiStore';
import { secondsSince, formatAgo } from '@/lib/newsroom/marketDataFormat';
import { CHART_RANGES, type ChartRange } from '@/lib/types/market-data.types';
import MarketStatusBadge from '@/components/cms/newsroom/market-data/quote/MarketStatusBadge';
import PerformanceSummary from '@/components/cms/newsroom/market-data/quote/PerformanceSummary';
import HistoricalPriceTable from '@/components/cms/newsroom/market-data/quote/HistoricalPriceTable';
import TechnicalIndicatorsPanel from '@/components/cms/newsroom/market-data/quote/TechnicalIndicatorsPanel';
import RelatedCompanies from '@/components/cms/newsroom/market-data/quote/RelatedCompanies';
import QuoteSkeleton from '@/components/cms/newsroom/market-data/quote/QuoteSkeleton';

const BG = '#0F1115';
const CARD = '#181C22';
const BORDER = '#242A33';
const TEXT = '#F5F7FA';
const MUTED = '#9CA3AF';
const ACCENT = '#2D7FF9';
const SUCCESS = '#16C784';
const DANGER = '#EF4444';

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b py-2 last:border-b-0" style={{ borderColor: BORDER }}>
      <span className="text-xs" style={{ color: MUTED }}>{label}</span>
      <span className="text-xs font-semibold tabular-nums" style={{ color: TEXT }}>{value}</span>
    </div>
  );
}

function Panel({ title, icon: Icon, children }: { title: string; icon?: typeof BarChart3; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border p-4" style={{ background: CARD, borderColor: BORDER }}>
      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide" style={{ color: MUTED }}>
        {Icon && <Icon className="h-3.5 w-3.5" />} {title}
      </p>
      {children}
    </div>
  );
}

const fmtNum = (v: number | null | undefined) => (v == null ? '—' : v.toLocaleString(undefined, { maximumFractionDigits: 2 }));
const fmtVolume = (v: number | null | undefined) => (v == null ? '—' : v.toLocaleString());
const fmtPercent = (v: number | null | undefined) => (v == null ? '—' : `${v.toFixed(2)}%`);
const fmtMarketCap = (v: number | null | undefined) => {
  if (v == null) return '—';
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}T`; // Finnhub reports marketCap in millions
  return `$${(v / 1_000).toFixed(2)}B`;
};

export default function QuotePage({ params }: { params: Promise<{ websiteId: string; symbol: string }> }) {
  const { websiteId, symbol } = use(params);
  const { setBreadcrumbs } = useUIStore();
  const [range, setRange] = useState<ChartRange>('1M');
  const [nowMs, setNowMs] = useState(() => Date.now());

  const { data, isLoading, isError } = useAssetQuote(symbol, range, websiteId);

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    setBreadcrumbs([
      { label: 'CMS', href: '/cms' },
      { label: 'News', href: `/cms/websites/${websiteId}/news` },
      { label: 'Markets', href: `/cms/websites/${websiteId}/news/markets` },
      { label: data?.symbol ?? symbol },
    ]);
  }, [data, symbol, setBreadcrumbs, websiteId]);

  if (isLoading) {
    return (
      <div className="-m-6 min-h-[calc(100vh-4rem)] p-6" style={{ background: BG }}>
        <QuoteSkeleton />
      </div>
    );
  }
  if (isError || !data) {
    return (
      <div className="-m-6 min-h-[calc(100vh-4rem)] p-6" style={{ background: BG }}>
        <p className="text-sm" style={{ color: DANGER }}>Unknown symbol &quot;{symbol}&quot;.</p>
        <Link href={`/cms/websites/${websiteId}/news/markets`} className="mt-2 inline-flex items-center gap-1 text-xs underline" style={{ color: MUTED }}>
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Markets
        </Link>
      </div>
    );
  }

  const q = data.quote;
  const value = q?.price ?? q?.value;
  const up = (q?.change ?? 0) >= 0;
  const ago = formatAgo(secondsSince(q?.fetchedAt, nowMs));

  return (
    <div className="-m-6 min-h-[calc(100vh-4rem)] p-6" style={{ background: BG }}>
      <Link href={`/cms/websites/${websiteId}/news/markets`} className="mb-4 inline-flex items-center gap-1 text-xs" style={{ color: MUTED }}>
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Markets
      </Link>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        {data.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- external provider CDN logo, not a local/optimizable asset
          <img src={data.logoUrl} alt="" className="h-10 w-10 rounded" />
        )}
        <div>
          <h1 className="text-lg font-bold" style={{ color: TEXT }}>{data.name}</h1>
          <p className="text-xs" style={{ color: MUTED }}>
            {data.symbol} {data.exchange && `· ${data.exchange}`} · {data.currency}
          </p>
        </div>
        <MarketStatusBadge marketStatus={data.marketStatus} />
      </div>

      <div className="mb-5 rounded-xl border p-4" style={{ background: CARD, borderColor: BORDER }}>
        {value != null ? (
          <>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold tabular-nums" style={{ color: TEXT }}>{fmtNum(value)}</span>
              <span className="flex items-center gap-1 text-sm font-semibold tabular-nums" style={{ color: up ? SUCCESS : DANGER }}>
                {up ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                {q?.change != null && `${up ? '+' : ''}${q.change.toFixed(2)}`}
                {q?.changePercent != null && ` (${up ? '+' : ''}${q.changePercent.toFixed(2)}%)`}
              </span>
            </div>
            <p className="mt-1 text-[11px]" style={{ color: MUTED }}>Source: {data.source} · Updated {ago}</p>
          </>
        ) : (
          <p className="text-sm" style={{ color: MUTED }}>No live quote available for this symbol.</p>
        )}
      </div>

      <div className="mb-5 rounded-xl border p-4" style={{ background: CARD, borderColor: BORDER }}>
        <div className="mb-3 flex flex-wrap gap-1">
          {CHART_RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className="rounded px-2.5 py-1 text-xs font-medium transition-colors"
              style={range === r ? { background: ACCENT, color: '#fff' } : { color: MUTED }}
            >
              {r}
            </button>
          ))}
        </div>
        {data.chart.length === 0 ? (
          <p className="py-16 text-center text-xs" style={{ color: MUTED }}>No chart data available (Twelve Data key missing, or this asset type has no time series).</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data.chart}>
              <CartesianGrid strokeDasharray="3 3" stroke={BORDER} vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: MUTED }} axisLine={false} tickLine={false} minTickGap={40} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: MUTED }} axisLine={false} tickLine={false} width={50} />
              <Tooltip contentStyle={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 6, fontSize: 12 }} labelStyle={{ color: TEXT }} />
              <Line type="monotone" dataKey="close" stroke={ACCENT} strokeWidth={1.75} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mb-5">
        <Panel title="Performance Summary">
          <PerformanceSummary performance={data.performance} />
        </Panel>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Key Statistics">
          <div>
            <StatRow label="Open" value={fmtNum(q?.open)} />
            <StatRow label="Previous Close" value={fmtNum(q?.prevClose)} />
            <StatRow label="Day High" value={fmtNum(q?.high)} />
            <StatRow label="Day Low" value={fmtNum(q?.low)} />
            {data.fundamentals && (
              <>
                <StatRow label="52 Week High" value={fmtNum(data.fundamentals.week52High)} />
                <StatRow label="52 Week Low" value={fmtNum(data.fundamentals.week52Low)} />
                <StatRow label="Market Cap" value={fmtMarketCap(data.fundamentals.marketCap)} />
                <StatRow label="P/E Ratio" value={fmtNum(data.fundamentals.peRatio)} />
                <StatRow label="Dividend Yield" value={data.fundamentals.dividendYield != null ? fmtPercent(data.fundamentals.dividendYield) : '—'} />
                {data.fundamentals.industry && <StatRow label="Industry" value={data.fundamentals.industry} />}
              </>
            )}
            {data.volume && (
              <>
                <StatRow label="Volume" value={fmtVolume(data.volume.volume)} />
                <StatRow label="Average Volume" value={fmtVolume(data.volume.averageVolume)} />
              </>
            )}
          </div>
        </Panel>

        <Panel title="Technical Indicators" icon={BarChart3}>
          <TechnicalIndicatorsPanel indicators={data.indicators} />
        </Panel>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Related Companies">
          <RelatedCompanies companies={data.relatedCompanies} websiteId={websiteId} />
        </Panel>

        <Panel title="Latest Imperialpedia News" icon={Newspaper}>
          {data.relatedNews.length === 0 ? (
            <p className="py-6 text-center text-xs" style={{ color: MUTED }}>No related articles found.</p>
          ) : (
            <div className="space-y-2">
              {data.relatedNews.map((n) => (
                <Link
                  key={n.id}
                  href={`/cms/websites/${websiteId}/content/${n.id}`}
                  className="block truncate rounded px-1 py-1 text-xs hover:bg-white/5 hover:underline"
                  style={{ color: TEXT }}
                >
                  • {n.title}
                </Link>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <Panel title="Historical Prices">
        <HistoricalPriceTable rows={data.historical} />
      </Panel>
    </div>
  );
}
