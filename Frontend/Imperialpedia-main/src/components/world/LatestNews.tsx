"use client";
import { latestNews } from "@/lib/data/worldData";
import { useState } from "react";

const categoryColors: Record<string, string> = {
  MARKETS: "bg-blue-100 text-blue-700",
  CRYPTO: "bg-orange-100 text-orange-700",
  ECONOMY: "bg-green-100 text-green-700",
  TECH: "bg-purple-100 text-purple-700",
  WORLD: "bg-gray-100 text-gray-700",
  ENERGY: "bg-yellow-100 text-yellow-800",
  POLITICS: "bg-red-100 text-red-700",
  RETAIL: "bg-pink-100 text-pink-700",
  HEALTH: "bg-teal-100 text-teal-700",
  AUTO: "bg-indigo-100 text-indigo-700",
};

export default function LatestNews() {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? latestNews : latestNews.slice(0, 10);

  return (
    <div className="bg-white h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b-2 border-[#CC0000] bg-white sticky top-[88px] z-10">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-[#CC0000] rounded-full animate-pulse" />
          <h2 className="text-xs font-black tracking-widest text-gray-900 uppercase">Latest News</h2>
        </div>
        <span className="text-[10px] text-gray-400 font-medium">Live</span>
      </div>

      {/* News list */}
      <div className="divide-y divide-gray-100">
        {visible.map((item) => (
          <div
            key={item.id}
            className="px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className={`text-[9px] font-black tracking-wider px-1.5 py-0.5 rounded-sm ${categoryColors[item.category] || "bg-gray-100 text-gray-600"}`}>
                {item.category}
              </span>
              <span className="text-[10px] text-gray-400 font-mono shrink-0 ml-2">{item.time}</span>
            </div>
            <p className="text-xs font-semibold leading-snug text-gray-800 group-hover:text-[#CC0000] transition-colors line-clamp-2">
              {item.headline}
            </p>
            {item.positive !== null && (
              <span className={`text-[10px] font-bold mt-1 block ${item.positive ? "text-green-600" : "text-red-500"}`}>
                {item.positive ? "▲ BULLISH" : "▼ BEARISH"}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Show more */}
      <div className="p-4">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full text-xs font-bold text-[#CC0000] border border-[#CC0000] py-2 hover:bg-[#CC0000] hover:text-white transition-colors rounded-sm tracking-wide"
        >
          {expanded ? "SHOW LESS ▲" : "SHOW MORE ▼"}
        </button>
      </div>
    </div>
  );
}
