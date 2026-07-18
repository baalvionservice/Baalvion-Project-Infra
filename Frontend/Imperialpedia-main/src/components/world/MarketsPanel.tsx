"use client";
import { useState } from "react";
import type { Indicator, WorldData } from "@/lib/data/worldRegions";

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
                ? "border-b-2 border-[hsl(var(--cnbc-red))] text-[hsl(var(--cnbc-red))]"
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
                {region.markets.map((m) => (
                  <div
                    key={m.name}
                    className="flex items-center justify-between px-2 sm:px-3 py-1.5 sm:py-2 hover:bg-muted cursor-pointer transition-colors"
                  >
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
                          m.positive ? "text-[hsl(var(--cnbc-green))]" : "text-[hsl(var(--cnbc-red))]"
                        }`}
                      >
                        {m.positive ? "▲" : "▼"} {m.change}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="p-3">
            <button className="world-kicker w-full text-[11px] font-bold text-[hsl(var(--cnbc-red))] py-2 border border-[hsl(var(--cnbc-red))] hover:bg-[hsl(var(--cnbc-red))] hover:text-white transition-colors rounded-sm tracking-wide">
              VIEW FULL MARKETS →
            </button>
          </div>
        </div>
      )}

      {activeTab === "fx" && (
        <div>
          <div className="divide-y divide-border">
            {fxCommodity.map((i) => (
              <div
                key={i.name}
                className="flex items-center justify-between px-2 sm:px-3 py-1.5 sm:py-2 hover:bg-muted cursor-pointer transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] sm:text-xs font-bold text-foreground truncate block">
                    {i.name}
                  </span>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-[10px] sm:text-xs font-mono text-foreground">{i.value}</div>
                  <div
                    className={`text-[9px] sm:text-[11px] font-mono font-bold ${
                      i.positive ? "text-[hsl(var(--cnbc-green))]" : "text-[hsl(var(--cnbc-red))]"
                    }`}
                  >
                    {i.positive ? "▲" : "▼"} {i.percent}
                  </div>
                </div>
              </div>
            ))}
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
            {watchlist.map((item) => (
              <div
                key={item.ticker}
                className="grid grid-cols-3 items-center px-2 sm:px-3 py-2 sm:py-2.5 hover:bg-muted cursor-pointer transition-colors"
              >
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
                    item.positive ? "text-[hsl(var(--cnbc-green))]" : "text-[hsl(var(--cnbc-red))]"
                  }`}
                >
                  {item.change}
                </div>
              </div>
            ))}
          </div>
          <div className="p-2 sm:p-3">
            <button className="world-kicker w-full text-[10px] sm:text-[11px] font-bold text-[hsl(var(--cnbc-red))] py-1.5 sm:py-2 border border-[hsl(var(--cnbc-red))] hover:bg-[hsl(var(--cnbc-red))] hover:text-white transition-colors rounded-sm tracking-wide">
              + ADD SYMBOL
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
