import React from "react";
import Link from "next/link";
import { getAllMarketAssets, computeMovers, type MarketAssetRow } from "@/lib/data/marketsLoader";
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
  const assets = await getAllMarketAssets();
  const withPrices = assets.filter((a) => a.current_price != null);
  if (withPrices.length === 0) return null;

  const { gainers, losers } = computeMovers(withPrices);

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 border-t border-border">
      <HomeSectionHeading title="Market Highlights" href="/market-news" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground pb-2 mb-1 border-b-2 border-foreground">
            Top Gainers
          </h3>
          <ul>
            {gainers.map((a) => (
              <QuoteRow key={a.symbol} asset={a} />
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground pb-2 mb-1 border-b-2 border-foreground">
            Top Losers
          </h3>
          <ul>
            {losers.map((a) => (
              <QuoteRow key={a.symbol} asset={a} />
            ))}
          </ul>
        </div>
      </div>
      <p className="mt-5 text-xs text-muted-foreground">
        Market data is provided for informational and educational purposes. Prices and percentage
        changes may be delayed or subject to data-provider limitations.
      </p>
    </section>
  );
}

export default MarketHighlights;
