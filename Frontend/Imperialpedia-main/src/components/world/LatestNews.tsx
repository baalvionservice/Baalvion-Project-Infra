"use client";
import type { WorldData } from "@/lib/data/worldRegions";
import { useState } from "react";

const categoryColors: Record<string, string> = {
  MARKETS: "bg-blue-100 text-blue-700",
  CRYPTO: "bg-orange-100 text-orange-700",
  ECONOMY: "bg-green-100 text-green-700",
  TECH: "bg-purple-100 text-purple-700",
  WORLD: "bg-muted text-foreground",
  ENERGY: "bg-yellow-100 text-yellow-800",
  POLITICS: "bg-red-100 text-red-700",
  RETAIL: "bg-pink-100 text-pink-700",
  HEALTH: "bg-teal-100 text-teal-700",
  AUTO: "bg-indigo-100 text-indigo-700",
};

export default function LatestNews({ latest }: { latest: WorldData["latest"] }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? latest : latest.slice(0, 10);

  return (
    <div className="bg-card h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b-2 border-[hsl(var(--cnbc-red))] bg-card sticky top-[88px] z-10">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-[hsl(var(--cnbc-red))] rounded-full animate-pulse" />
          <h2 className="world-kicker text-xs font-black tracking-widest text-foreground uppercase">Latest News</h2>
        </div>
        <span className="text-[10px] text-muted-foreground font-medium">Live</span>
      </div>

      {/* News list */}
      <div className="divide-y divide-border">
        {visible.map((item) => (
          <div
            key={item.id}
            className="px-4 py-3 hover:bg-muted transition-colors cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className={`text-[9px] font-black tracking-wider px-1.5 py-0.5 rounded-sm ${categoryColors[item.category] || "bg-muted text-muted-foreground"}`}>
                {item.category}
              </span>
              <span className="text-[10px] text-muted-foreground font-mono shrink-0 ml-2">{item.time}</span>
            </div>
            <p className="text-xs font-semibold leading-snug text-foreground group-hover:text-[hsl(var(--cnbc-red))] transition-colors line-clamp-2">
              {item.headline}
            </p>
            {item.positive !== null && (
              <span className={`text-[10px] font-bold mt-1 block ${item.positive ? "text-[hsl(var(--cnbc-green))]" : "text-[hsl(var(--cnbc-red))]"}`}>
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
          className="world-kicker w-full text-xs font-bold text-[hsl(var(--cnbc-red))] border border-[hsl(var(--cnbc-red))] py-2 hover:bg-[hsl(var(--cnbc-red))] hover:text-white transition-colors rounded-sm tracking-wide"
        >
          {expanded ? "SHOW LESS ▲" : "SHOW MORE ▼"}
        </button>
      </div>
    </div>
  );
}
