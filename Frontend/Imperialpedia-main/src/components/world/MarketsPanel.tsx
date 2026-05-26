"use client";
import { useState } from "react";
import { worldMarkets, watchlistItems } from "@/lib/data/worldData";

export default function MarketsPanel() {
  const [activeTab, setActiveTab] = useState<"markets" | "watchlist">(
    "markets"
  );

  return (
    <div className="bg-white">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {(["markets", "watchlist"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 text-[10px] sm:text-xs font-black tracking-widest py-2 sm:py-3 transition-all uppercase ${
              activeTab === tab
                ? "border-b-2 border-[#CC0000] text-[#CC0000]"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <span className="hidden sm:inline">
              {tab === "markets" ? "World Markets" : "Watchlist"}
            </span>
            <span className="sm:hidden">
              {tab === "markets" ? "Markets" : "Watch"}
            </span>
          </button>
        ))}
      </div>

      {activeTab === "markets" && (
        <div>
          {worldMarkets.map((region) => (
            <div key={region.region}>
              <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
                <span className="text-[10px] font-black tracking-widest text-gray-500 uppercase">
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
                          m.positive ? "text-green-600" : "text-red-500"
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
            <button className="w-full text-[11px] font-bold text-[#0068CC] py-2 border border-[#0068CC] hover:bg-[#0068CC] hover:text-white transition-colors rounded-sm tracking-wide">
              VIEW FULL MARKETS →
            </button>
          </div>
        </div>
      )}

      {activeTab === "watchlist" && (
        <div>
          <div className="grid grid-cols-3 text-[8px] sm:text-[9px] font-black tracking-wider text-gray-400 px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-50 border-b border-gray-100 uppercase">
            <span>Symbol</span>
            <span className="text-right">Price</span>
            <span className="text-right">Change</span>
          </div>
          <div className="divide-y divide-gray-50">
            {watchlistItems.map((item) => (
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
                    item.positive ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {item.change}
                </div>
              </div>
            ))}
          </div>
          <div className="p-2 sm:p-3">
            <button className="w-full text-[10px] sm:text-[11px] font-bold text-[#CC0000] py-1.5 sm:py-2 border border-[#CC0000] hover:bg-[#CC0000] hover:text-white transition-colors rounded-sm tracking-wide">
              + ADD SYMBOL
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
