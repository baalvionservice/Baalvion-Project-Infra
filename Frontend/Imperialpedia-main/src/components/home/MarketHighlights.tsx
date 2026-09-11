import React from "react";
import Link from "next/link";
import { getAllMarketAssets, computeMovers, type MarketAssetRow } from "@/lib/data/marketsLoader";
import { MARKETS_SECTION_LIVE } from "@/config/sections";
import { HomeSectionHeading } from "./HomeSectionHeading";

const GREEN = "#0a7d3d";
const RED = "#CC0000";

function QuoteRow({ asset }: { asset: MarketAssetRow }) {
  const price = asset.current_price != null ? Number(asset.current_price) : null;
  const pct = asset.change_pct_24h != null ? Number(asset.change_pct_24h) : null;
  const up = (pct ?? 0) >= 0;

  return (
    <li>
      <Link href={`/markets/quote/${asset.symbol}`} className="flex items-center justify-between group py-2 border-b border-border last:border-0">
        <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate pr-3">
          {asset.name}
        </span>
        <span className="flex items-baseline gap-1.5 text-xs font-mono flex-shrink-0">
          {price != null && (
            <span className="text-foreground font-semibold tabular-nums">
              {asset.asset_type === "forex" ? price.toFixed(4) : price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
          )}
          {pct != null && (
            <span className="font-bold tabular-nums" style={{ color: up ? GREEN : RED }}>
              {up ? "▲" : "▼"} {Math.abs(pct).toFixed(2)}%
            </span>
          )}
        </span>
      </Link>
    </li>
  );
}

/**
 * "Market Highlights" rail — top gainers/losers pulled from the same live
 * asset feed (imperialpedia-service, Yahoo-fallback) that already powers
 * /markets. Reuses `computeMovers` rather than re-deriving ranking logic.
 */
export async function MarketHighlights() {
  if (!MARKETS_SECTION_LIVE) return null;
  const assets = await getAllMarketAssets();
  const withPrices = assets.filter((a) => a.current_price != null);
  if (withPrices.length === 0) return null;

  const { gainers, losers } = computeMovers(withPrices);

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 border-t-2 border-black dark:border-slate-800">
      <HomeSectionHeading title="MARKET HIGHLIGHTS // LIVE TICKER" href="/market-news" hrefLabel="FULL MARKET COVERAGE →" />

      <div className="bg-white dark:bg-slate-900 border-3 border-black dark:border-slate-700 p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative rounded-xs">
        <div className="absolute top-0 left-0 right-0 h-2 bg-[#c8102e]" />
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-1">
          {/* Top Gainers */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b-2 border-black dark:border-slate-700 pb-2">
              <span className="bg-[#00875a] text-white text-[10px] font-mono font-black uppercase tracking-widest px-2.5 py-0.5 -skew-x-6">
                ▲ GAINERS
              </span>
              <h3 className="text-xs font-mono font-black uppercase tracking-widest text-black dark:text-white">
                LIVE MARKET MOVERS
              </h3>
            </div>
            <ul className="divide-y divide-slate-200 dark:divide-slate-800">
              {gainers.map((a) => (
                <QuoteRow key={a.symbol} asset={a} />
              ))}
            </ul>
          </div>

          {/* Top Losers */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b-2 border-black dark:border-slate-700 pb-2">
              <span className="bg-[#c8102e] text-white text-[10px] font-mono font-black uppercase tracking-widest px-2.5 py-0.5 -skew-x-6">
                ▼ LOSERS
              </span>
              <h3 className="text-xs font-mono font-black uppercase tracking-widest text-black dark:text-white">
                LIVE MARKET DECLINERS
              </h3>
            </div>
            <ul className="divide-y divide-slate-200 dark:divide-slate-800">
              {losers.map((a) => (
                <QuoteRow key={a.symbol} asset={a} />
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t-2 border-black dark:border-slate-800 flex items-center justify-between text-xs font-mono font-bold text-slate-500">
          <span>// LIVE DATA REFRESHED ON SHORT INTERVALS</span>
          <span className="text-[#c8102e]">Imperialpedia LEVEL FEED</span>
        </div>
      </div>
    </section>
  );
}
