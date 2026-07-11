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
    <div className="bg-white">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`world-kicker flex-1 text-[10px] sm:text-xs font-black tracking-widest py-2 sm:py-3 transition-all uppercase ${
              activeTab === tab
                ? "border-b-2 border-[#ce2b2b] text-[#ce2b2b]"
                : "text-gray-500 hover:text-gray-800"
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
              <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
                <span className="world-kicker text-[10px] font-black tracking-widest text-gray-500 uppercase">
                  {region.region}
                </span>
              </div>
              <div className="divide-y divide-gray-50">
                {region.markets.map((m) => (
                  <div
                    key={m.name}
                    className="flex items-center justify-between px-2 sm:px-3 py-1.5 sm:py-2 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] sm:text-xs font-bold text-gray-800 truncate block">
                        {m.name}
                      </span>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-[10px] sm:text-xs font-mono text-gray-900">
                        {m.value}
                      </div>
                      <div
                        className={`text-[9px] sm:text-[11px] font-mono font-bold ${
                          m.positive ? "text-[#00a857]" : "text-[#ce2b2b]"
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
            <button className="world-kicker w-full text-[11px] font-bold text-[#005594] py-2 border border-[#005594] hover:bg-[#005594] hover:text-white transition-colors rounded-sm tracking-wide">
              VIEW FULL MARKETS →
            </button>
          </div>
        </div>
      )}

      {activeTab === "fx" && (
        <div>
          <div className="divide-y divide-gray-50">
            {fxCommodity.map((i) => (
              <div
                key={i.name}
                className="flex items-center justify-between px-2 sm:px-3 py-1.5 sm:py-2 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] sm:text-xs font-bold text-gray-800 truncate block">
                    {i.name}
                  </span>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-[10px] sm:text-xs font-mono text-gray-900">{i.value}</div>
                  <div
                    className={`text-[9px] sm:text-[11px] font-mono font-bold ${
                      i.positive ? "text-[#00a857]" : "text-[#ce2b2b]"
                    }`}
                  >
                    {i.positive ? "▲" : "▼"} {i.percent}
                  </div>
                </div>
              </div>
            ))}
            {fxCommodity.length === 0 && (
              <p className="px-3 py-4 text-xs text-gray-400">No FX/commodity data for this region.</p>
            )}
          </div>
        </div>
      )}

      {activeTab === "watchlist" && (
        <div>
          <div className="world-kicker grid grid-cols-3 text-[8px] sm:text-[9px] font-black tracking-wider text-gray-400 px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-50 border-b border-gray-100 uppercase">
            <span>Symbol</span>
            <span className="text-right">Price</span>
            <span className="text-right">Change</span>
          </div>
          <div className="divide-y divide-gray-50">
            {watchlist.map((item) => (
              <div
                key={item.ticker}
                className="grid grid-cols-3 items-center px-2 sm:px-3 py-2 sm:py-2.5 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="min-w-0">
                  <div className="text-[10px] sm:text-xs font-black text-gray-900">
                    {item.ticker}
                  </div>
                  <div className="text-[8px] sm:text-[10px] text-gray-400 truncate">
                    {item.name}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] sm:text-xs font-mono text-gray-800">
                    {item.price}
                  </span>
                </div>
                <div
                  className={`text-right text-[10px] sm:text-xs font-mono font-bold ${
                    item.positive ? "text-[#00a857]" : "text-[#ce2b2b]"
                  }`}
                >
                  {item.change}
                </div>
              </div>
            ))}
          </div>
          <div className="p-2 sm:p-3">
            <button className="world-kicker w-full text-[10px] sm:text-[11px] font-bold text-[#ce2b2b] py-1.5 sm:py-2 border border-[#ce2b2b] hover:bg-[#ce2b2b] hover:text-white transition-colors rounded-sm tracking-wide">
              + ADD SYMBOL
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
