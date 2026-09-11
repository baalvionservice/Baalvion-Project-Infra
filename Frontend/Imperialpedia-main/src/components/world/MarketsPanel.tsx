"use client";
import { useState } from "react";
import Link from "next/link";
import type { Indicator, WorldData } from "@/lib/data/worldRegions";
import { MARKET_QUOTES_LIVE } from "@/config/market-quotes";

interface Props {
  markets: WorldData["markets"];
  watchlist: WorldData["watchlist"];
  indicators: Indicator[];
}

/** FX pairs read "EUR/USD" style; the rest are matched by name against the
 * known commodity/crypto set already carried in the indicators feed. */
const COMMODITY_OR_CRYPTO_NAMES = new Set(["Gold", "Crude (WTI)", "Brent", "Bitcoin"]);
function isFxOrCommodity(name: string): boolean {
  return name.includes("/") || COMMODITY_OR_CRYPTO_NAMES.has(name);
}

const TABS = ["markets", "fx", "watchlist"] as const;
type Tab = (typeof TABS)[number];

const TAB_LABEL: Record<Tab, { full: string; short: string }> = {
  markets: { full: "World Markets", short: "Markets" },
  fx: { full: "Currencies & Commodities", short: "FX" },
  watchlist: { full: "Watchlist", short: "Watch" },
};

export default function MarketsPanel({ markets, watchlist, indicators }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("markets");
  const fxCommodity = indicators.filter((i) => isFxOrCommodity(i.name));

  return (
    <div className="bg-card">
      {/* Tabs */}
      <div className="flex border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`world-kicker flex-1 text-[10px] sm:text-xs font-black tracking-widest py-2 sm:py-3 transition-all uppercase ${
              activeTab === tab
                ? "border-b-2 border-[hsl(var(--imperialpedia-red))] text-[hsl(var(--imperialpedia-red))]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="hidden sm:inline">{TAB_LABEL[tab].full}</span>
            <span className="sm:hidden">{TAB_LABEL[tab].short}</span>
          </button>
        ))}
      </div>

      {activeTab === "markets" && (
        <div>
          {markets.map((region) => (
            <div key={region.region}>
              <div className="px-3 py-2 bg-muted border-b border-border">
                <span className="world-kicker text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                  {region.region}
                </span>
              </div>
              <div className="divide-y divide-border">
                {region.markets.map((m) => {
                  const content = (
                    <>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] sm:text-xs font-bold text-foreground truncate block">
                          {m.name}
                        </span>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-[10px] sm:text-xs font-mono text-foreground">
                          {m.value}
                        </div>
                        <div
                          className={`text-[9px] sm:text-[11px] font-mono font-bold ${
                            m.positive ? "text-[hsl(var(--imperialpedia-green))]" : "text-[hsl(var(--imperialpedia-red))]"
                          }`}
                        >
                          {m.positive ? "▲" : "▼"} {m.change}
                        </div>
                      </div>
                    </>
                  );
                  const rowClass = "flex items-center justify-between px-2 sm:px-3 py-1.5 sm:py-2 hover:bg-muted transition-colors";
                  return m.symbol && MARKET_QUOTES_LIVE ? (
                    <Link key={m.name} href={`/markets/quote/${m.symbol}`} className={rowClass}>
                      {content}
                    </Link>
                  ) : (
                    <div key={m.name} className={rowClass}>
                      {content}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          <div className="p-3">
            <button className="world-kicker w-full text-[11px] font-bold text-[hsl(var(--imperialpedia-red))] py-2 border border-[hsl(var(--imperialpedia-red))] hover:bg-[hsl(var(--imperialpedia-red))] hover:text-white transition-colors rounded-sm tracking-wide">
              VIEW FULL MARKETS →
            </button>
          </div>
        </div>
      )}

      {activeTab === "fx" && (
        <div>
          <div className="divide-y divide-border">
            {fxCommodity.map((i) => {
              const content = (
                <>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] sm:text-xs font-bold text-foreground truncate block">
                      {i.name}
                    </span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-[10px] sm:text-xs font-mono text-foreground">{i.value}</div>
                    <div
                      className={`text-[9px] sm:text-[11px] font-mono font-bold ${
                        i.positive ? "text-[hsl(var(--imperialpedia-green))]" : "text-[hsl(var(--imperialpedia-red))]"
                      }`}
                    >
                      {i.positive ? "▲" : "▼"} {i.percent}
                    </div>
                  </div>
                </>
              );
              const rowClass = "flex items-center justify-between px-2 sm:px-3 py-1.5 sm:py-2 hover:bg-muted transition-colors";
              return i.symbol && MARKET_QUOTES_LIVE ? (
                <Link key={i.name} href={`/markets/quote/${i.symbol}`} className={rowClass}>
                  {content}
                </Link>
              ) : (
                <div key={i.name} className={rowClass}>
                  {content}
                </div>
              );
            })}
            {fxCommodity.length === 0 && (
              <p className="px-3 py-4 text-xs text-muted-foreground">No FX/commodity data for this region.</p>
            )}
          </div>
        </div>
      )}

      {activeTab === "watchlist" && (
        <div>
          <div className="world-kicker grid grid-cols-3 text-[8px] sm:text-[9px] font-black tracking-wider text-muted-foreground px-2 sm:px-3 py-1.5 sm:py-2 bg-muted border-b border-border uppercase">
            <span>Symbol</span>
            <span className="text-right">Price</span>
            <span className="text-right">Change</span>
          </div>
          <div className="divide-y divide-border">
            {watchlist.map((item) => {
              const rowContent = (
                <>
                  <div className="min-w-0">
                    <div className="text-[10px] sm:text-xs font-black text-foreground">
                      {item.ticker}
                    </div>
                    <div className="text-[8px] sm:text-[10px] text-muted-foreground truncate">
                      {item.name}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] sm:text-xs font-mono text-foreground">
                      {item.price}
                    </span>
                  </div>
                  <div
                    className={`text-right text-[10px] sm:text-xs font-mono font-bold ${
                      item.positive ? "text-[hsl(var(--imperialpedia-green))]" : "text-[hsl(var(--imperialpedia-red))]"
                    }`}
                  >
                    {item.change}
                  </div>
                </>
              );
              const rowClass = "grid grid-cols-3 items-center px-2 sm:px-3 py-2 sm:py-2.5 hover:bg-muted transition-colors";
              return MARKET_QUOTES_LIVE ? (
                <Link
                  key={item.ticker}
                  href={`/markets/quote/${item.ticker}`}
                  className={rowClass}
                >
                  {rowContent}
                </Link>
              ) : (
                <div
                  key={item.ticker}
                  className={rowClass}
                >
                  {rowContent}
                </div>
              );
            })}
          </div>
          <div className="p-2 sm:p-3">
            <button className="world-kicker w-full text-[10px] sm:text-[11px] font-bold text-[hsl(var(--imperialpedia-red))] py-1.5 sm:py-2 border border-[hsl(var(--imperialpedia-red))] hover:bg-[hsl(var(--imperialpedia-red))] hover:text-white transition-colors rounded-sm tracking-wide">
              + ADD SYMBOL
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
