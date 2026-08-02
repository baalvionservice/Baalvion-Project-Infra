import React from "react";
import Link from "next/link";
import { Activity, TrendingUp, TrendingDown, Clock } from "lucide-react";
import {
  getAllMarketAssets,
  computeMovers,
  type MarketAssetRow,
} from "@/lib/data/marketsLoader";
import { HomeSectionHeading } from "./HomeSectionHeading";

const GREEN = "#0a7d3d";
const RED = "#CC0000";

interface QuoteRowProps {
  asset: MarketAssetRow;
}

function QuoteRow({ asset }: QuoteRowProps) {
  const price =
    asset.current_price != null ? Number(asset.current_price) : null;
  const pct = asset.change_pct_24h != null ? Number(asset.change_pct_24h) : null;
  const up = (pct ?? 0) >= 0;

  return (
    <li>
      <Link
        href={`/markets/quote/${asset.symbol}`}
        className="flex items-center justify-between group py-3 px-2 rounded-md hover:bg-muted transition-colors"
      >
        <div className="flex-grow min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground font-semibold">
              {asset.symbol}
            </span>
            <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
              {asset.name}
            </span>
          </div>
          {asset.asset_type && (
            <span className="text-xs text-muted-foreground capitalize mt-0.5">
              {asset.asset_type}
            </span>
          )}
        </div>

        <div className="flex items-baseline gap-3 text-sm font-mono flex-shrink-0 ml-3">
          {price != null && (
            <span className="text-foreground font-semibold tabular-nums">
              {asset.asset_type === "forex"
                ? price.toFixed(4)
                : price.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}
            </span>
          )}
          {pct != null && (
            <span
              className="font-bold tabular-nums flex items-center gap-0.5 px-2 py-1 rounded-md"
              style={{
                color: up ? GREEN : RED,
                backgroundColor: up ? "#0a7d3d20" : "#CC000020",
              }}
            >
              {up ? (
                <TrendingUp className="h-3.5 w-3.5" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" />
              )}
              {Math.abs(pct).toFixed(2)}%
            </span>
          )}
        </div>
      </Link>
    </li>
  );
}

/**
 * Refactored "Market Highlights" with E-E-A-T signals:
 * - Live feed status badge
 * - Last updated timestamp
 * - Better visual hierarchy (icons for gainers/losers)
 * - Link to full market data
 * - Professional, authoritative presentation
 */
export async function MarketHighlightsRefactored() {
  const assets = await getAllMarketAssets();
  const withPrices = assets.filter((a) => a.current_price != null);
  if (withPrices.length === 0) return null;

  const { gainers, losers } = computeMovers(withPrices);
  const lastUpdated = new Date();

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 border-t border-border">
      {/* Header with Live Badge */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <HomeSectionHeading title="Market Highlights" href="/markets" />
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                Live Feed
              </span>
            </div>
            <span className="text-xs text-muted-foreground">•</span>
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <time
                dateTime={lastUpdated.toISOString()}
                className="text-xs text-muted-foreground"
              >
                Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </time>
            </div>
          </div>
        </div>
        <Link
          href="/markets"
          className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors uppercase tracking-widest"
        >
          View All Markets →
        </Link>
      </div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        {/* Top Gainers */}
        <div className="rounded-lg border border-border overflow-hidden hover:border-primary/50 transition-colors">
          <div className="bg-muted px-4 py-3 border-b border-border flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-bold text-foreground">Top Gainers</h3>
            <span className="ml-auto text-xs text-muted-foreground font-semibold">
              24H Change
            </span>
          </div>
          <ul className="divide-y divide-border">
            {gainers.slice(0, 5).map((a) => (
              <QuoteRow key={a.symbol} asset={a} />
            ))}
          </ul>
          <Link
            href="/markets?filter=gainers"
            className="block px-4 py-3 text-center text-xs font-semibold text-primary hover:bg-muted transition-colors border-t border-border"
          >
            See All Gainers
          </Link>
        </div>

        {/* Top Losers */}
        <div className="rounded-lg border border-border overflow-hidden hover:border-primary/50 transition-colors">
          <div className="bg-muted px-4 py-3 border-b border-border flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
            <h3 className="font-bold text-foreground">Top Losers</h3>
            <span className="ml-auto text-xs text-muted-foreground font-semibold">
              24H Change
            </span>
          </div>
          <ul className="divide-y divide-border">
            {losers.slice(0, 5).map((a) => (
              <QuoteRow key={a.symbol} asset={a} />
            ))}
          </ul>
          <Link
            href="/markets?filter=losers"
            className="block px-4 py-3 text-center text-xs font-semibold text-primary hover:bg-muted transition-colors border-t border-border"
          >
            See All Losers
          </Link>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-muted-foreground mt-6 text-center">
        Market data delayed by 15 minutes. Data provided by Yahoo Finance API.{" "}
        <Link href="/disclaimer" className="text-primary hover:underline">
          Full Disclaimer
        </Link>
      </p>
    </section>
  );
}

export default MarketHighlightsRefactored;
