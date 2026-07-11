"use client";
import { useMemo, useState } from "react";
import type { WorldData } from "@/lib/data/worldRegions";

function pctNum(change: string): number {
  const n = parseFloat(change.replace(/[+%]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

/** CNBC-style "Quote Finder" + sidebar "Market Movers" mini — both driven by
 * the same real, live watchlist data already fetched for the page (Yahoo
 * Finance), not fabricated numbers. Search filters the live watchlist. */
export default function QuoteFinderMovers({ watchlist }: { watchlist: WorldData["watchlist"] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return watchlist.filter(
      (w) => w.ticker.toLowerCase().includes(q) || w.name.toLowerCase().includes(q),
    );
  }, [watchlist, query]);

  const sorted = useMemo(
    () => [...watchlist].sort((a, b) => pctNum(b.change) - pctNum(a.change)),
    [watchlist],
  );
  const top = sorted.slice(0, 3);
  const bottom = sorted.slice(-3).reverse();

  return (
    <div className="bg-white border-b border-gray-200">
      {/* Quote Finder */}
      <div className="p-3">
        <span className="world-kicker text-[10px] font-black tracking-widest text-gray-900 uppercase block mb-2">
          Quote Finder
        </span>
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search watchlist"
            className="w-full text-xs border border-gray-300 rounded-sm px-2.5 py-1.5 pr-8 focus:outline-none focus:ring-2 focus:ring-[#ce2b2b]"
          />
          <svg
            className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        {query && (
          <div className="mt-2 divide-y divide-gray-50 max-h-40 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-[11px] text-gray-400 py-2">No matches.</p>
            ) : (
              filtered.map((w) => (
                <div key={w.ticker} className="flex items-center justify-between py-1.5 text-xs">
                  <span className="font-bold text-gray-800">{w.ticker}</span>
                  <span className="font-mono text-gray-600">{w.price}</span>
                  <span
                    className={`font-mono font-bold ${w.positive ? "text-[#00a857]" : "text-[#ce2b2b]"}`}
                  >
                    {w.change}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Market Movers mini — Top/Bottom from the same live watchlist */}
      <div className="border-t border-gray-100 p-3">
        <span className="world-kicker text-[10px] font-black tracking-widest text-gray-900 uppercase block mb-2">
          Market Movers
        </span>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="world-kicker text-[9px] font-bold text-gray-400 uppercase mb-1">Top</p>
            {top.map((w) => (
              <div key={w.ticker} className="flex items-center justify-between py-1 text-[11px]">
                <span className="font-bold text-gray-800">{w.ticker}</span>
                <span className="font-mono font-bold text-[#00a857]">{w.change}</span>
              </div>
            ))}
          </div>
          <div>
            <p className="world-kicker text-[9px] font-bold text-gray-400 uppercase mb-1">Bottom</p>
            {bottom.map((w) => (
              <div key={w.ticker} className="flex items-center justify-between py-1 text-[11px]">
                <span className="font-bold text-gray-800">{w.ticker}</span>
                <span className="font-mono font-bold text-[#ce2b2b]">{w.change}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
