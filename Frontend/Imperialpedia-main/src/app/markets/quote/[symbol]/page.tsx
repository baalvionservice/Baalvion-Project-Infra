import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAssetDetail } from "@/lib/data/marketsLoader";
import { QuoteChart } from "@/components/markets/QuoteChart";

const CNBC_RED = "#E31937";
const GREEN = "#00A651";
const RANGES = ["1D", "5D", "1M", "6M", "YTD", "1Y", "5Y", "MAX"] as const;

interface PageProps {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<{ range?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { symbol } = await params;
  const detail = await getAssetDetail(symbol, "1M");
  if (!detail) return { title: "Quote Not Found | Imperialpedia Markets" };
  return { title: `${detail.name} (${detail.symbol}) Quote | Imperialpedia Markets`, description: `Live price, chart, and statistics for ${detail.name}.` };
}

export const dynamic = "force-dynamic";

const fmt = (v: number | string | null | undefined, dec = 2) =>
  v == null ? "—" : Number(v).toLocaleString("en-US", { maximumFractionDigits: dec });

const fmtMarketCap = (v: number | string | null | undefined) => {
  if (v == null) return "—";
  const n = Number(v);
  if (n >= 1_000_000_000_000) return `$${(n / 1_000_000_000_000).toFixed(2)}T`;
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  return `$${n.toLocaleString()}`;
};

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/10 py-2 last:border-b-0">
      <span className="text-[12px] text-white/50">{label}</span>
      <span className="text-[12px] font-mono font-semibold text-white tabular-nums">{value}</span>
    </div>
  );
}

const PERF_ROWS: { key: "today" | "week" | "month" | "ytd" | "oneYear" | "fiveYear"; label: string }[] = [
  { key: "today", label: "Today" }, { key: "week", label: "Week" }, { key: "month", label: "Month" },
  { key: "ytd", label: "YTD" }, { key: "oneYear", label: "1 Year" }, { key: "fiveYear", label: "5 Year" },
];

export default async function QuotePage({ params, searchParams }: PageProps) {
  const { symbol } = await params;
  const { range = "1M" } = await searchParams;
  const validRange = (RANGES as readonly string[]).includes(range) ? range : "1M";
  const detail = await getAssetDetail(symbol, validRange);

  if (!detail) notFound();

  const price = detail.current_price;
  const pct = detail.change_pct_24h != null ? Number(detail.change_pct_24h) : null;
  const up = (pct ?? 0) >= 0;

  return (
    <main className="min-h-screen bg-black pb-24" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
      <div style={{ background: CNBC_RED }} className="py-3">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between">
          <Link href="/markets" className="text-[12px] font-semibold text-white/90 hover:underline">&larr; Markets</Link>
          {detail.marketStatus && (
            <span className="text-[11px] font-bold uppercase tracking-wide text-white bg-black/25 px-2 py-0.5 rounded-sm">
              {detail.marketStatus.label}
            </span>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-6 space-y-4">
        <div>
          <h1 className="text-2xl font-black text-white">{detail.name}</h1>
          <p className="text-[12px] text-white/50">{detail.symbol} {detail.exchange && `· ${detail.exchange}`}</p>
        </div>

        <div className="bg-[#111] border border-white/15 rounded-sm p-4">
          {price != null ? (
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-black font-mono text-white tabular-nums">{fmt(price)}</span>
              {pct != null && (
                <span className="text-lg font-bold font-mono tabular-nums" style={{ color: up ? GREEN : CNBC_RED }}>
                  {up ? "▲" : "▼"} {Math.abs(pct).toFixed(2)}%
                </span>
              )}
            </div>
          ) : (
            <p className="text-[13px] text-white/50">No live quote available.</p>
          )}
          <p className="mt-1 text-[11px] text-white/40">
            Last updated {detail.last_updated_at ? new Date(detail.last_updated_at).toLocaleTimeString("en-US", { timeZone: "America/New_York" }) + " ET" : "—"}
          </p>
        </div>

        <div className="bg-[#111] border border-white/15 rounded-sm p-4">
          <div className="flex flex-wrap gap-1 mb-3">
            {RANGES.map((r) => (
              <Link
                key={r}
                href={`/markets/quote/${symbol}?range=${r}`}
                className="px-2.5 py-1 text-[11px] font-bold rounded-sm"
                style={r === validRange ? { background: CNBC_RED, color: "#fff" } : { color: "rgba(255,255,255,0.5)" }}
              >
                {r}
              </Link>
            ))}
          </div>
          <QuoteChart data={detail.chart} />
        </div>

        {detail.performance && (
          <div className="bg-[#111] border border-white/15 rounded-sm p-4">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-white/70 mb-2">Performance</h3>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {PERF_ROWS.map(({ key, label }) => {
                const v = detail.performance![key];
                const rowUp = (v ?? 0) >= 0;
                return (
                  <div key={key} className="text-center border border-white/10 rounded-sm py-2">
                    <p className="text-[10px] text-white/40 uppercase">{label}</p>
                    <p className="text-[12px] font-mono font-bold tabular-nums" style={{ color: v == null ? "rgba(255,255,255,0.4)" : rowUp ? GREEN : CNBC_RED }}>
                      {v == null ? "—" : `${rowUp ? "+" : ""}${v.toFixed(2)}%`}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#111] border border-white/15 rounded-sm p-4">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-white/70 mb-2">Key Statistics</h3>
            <StatRow label="Market Cap" value={fmtMarketCap(detail.fundamentals?.marketCap ?? detail.market_cap)} />
            {detail.fundamentals && (
              <>
                <StatRow label="P/E Ratio" value={fmt(detail.fundamentals.peRatio)} />
                <StatRow label="52 Week High" value={fmt(detail.fundamentals.week52High)} />
                <StatRow label="52 Week Low" value={fmt(detail.fundamentals.week52Low)} />
                {detail.fundamentals.dividendYield != null && <StatRow label="Dividend Yield" value={`${detail.fundamentals.dividendYield.toFixed(2)}%`} />}
                {detail.fundamentals.industry && <StatRow label="Industry" value={detail.fundamentals.industry} />}
              </>
            )}
            {detail.volume && (
              <>
                <StatRow label="Volume" value={detail.volume.volume != null ? detail.volume.volume.toLocaleString() : "—"} />
                <StatRow label="Average Volume" value={detail.volume.averageVolume != null ? detail.volume.averageVolume.toLocaleString() : "—"} />
              </>
            )}
          </div>

          <div className="bg-[#111] border border-white/15 rounded-sm p-4">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-white/70 mb-2">Technical Indicators</h3>
            {detail.indicators ? (
              <>
                <StatRow label="SMA 20" value={fmt(detail.indicators.sma20)} />
                <StatRow label="SMA 50" value={fmt(detail.indicators.sma50)} />
                <StatRow label="SMA 200" value={fmt(detail.indicators.sma200)} />
                <StatRow label="RSI (14)" value={fmt(detail.indicators.rsi14)} />
                {detail.indicators.macd && <StatRow label="MACD Histogram" value={fmt(detail.indicators.macd.histogram)} />}
              </>
            ) : (
              <p className="text-[12px] text-white/40 py-4 text-center">Not available for this asset type.</p>
            )}
          </div>
        </div>

        {(detail.relatedCompanies.length > 0 || detail.relatedArticles.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {detail.relatedCompanies.length > 0 && (
              <div className="bg-[#111] border border-white/15 rounded-sm p-4">
                <h3 className="text-[11px] font-black uppercase tracking-widest text-white/70 mb-2">Related Companies</h3>
                <div className="flex flex-wrap gap-2">
                  {detail.relatedCompanies.map((c) => (
                    <Link key={c.symbol} href={`/markets/quote/${c.symbol}`} className="text-[11px] font-semibold text-white/80 border border-white/20 rounded-full px-2.5 py-1 hover:bg-white/10">
                      {c.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {detail.relatedArticles.length > 0 && (
              <div className="bg-[#111] border border-white/15 rounded-sm p-4">
                <h3 className="text-[11px] font-black uppercase tracking-widest text-white/70 mb-2">Related News</h3>
                <div className="space-y-1.5">
                  {detail.relatedArticles.map((a) => (
                    <Link key={a.id} href={`/news/${a.slug}`} className="block text-[12px] text-white/80 hover:underline truncate">
                      • {a.title}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
