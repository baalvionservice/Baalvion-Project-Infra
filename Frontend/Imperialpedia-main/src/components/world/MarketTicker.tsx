"use client";
import type { Indicator } from "@/lib/data/worldRegions";

export default function MarketTicker({ indicators }: { indicators: Indicator[] }) {
  const doubled = [...indicators, ...indicators];

  return (
    <div className="bg-[hsl(var(--cnbc-surface))] border-b border-white/10 overflow-hidden py-2">
      <div className="ticker-wrapper">
        <div className="ticker-track flex gap-8 animate-ticker whitespace-nowrap">
          {doubled.map((item, i) => (
            <span key={i} className="inline-flex items-center gap-2 text-xs shrink-0 cursor-pointer hover:opacity-80 transition-opacity">
              <span className="world-kicker text-white/50 font-semibold tracking-wide">{item.name}</span>
              <span className="text-white font-mono">{item.value}</span>
              <span className={`font-mono text-[11px] ${item.positive ? "text-[hsl(var(--cnbc-green))]" : "text-[hsl(var(--cnbc-red))]"}`}>
                {item.positive ? "▲" : "▼"} {item.change} ({item.percent})
              </span>
              <span className="text-white/20 ml-2">|</span>
            </span>
          ))}
        </div>
      </div>
      <style jsx>{`
        .ticker-wrapper { overflow: hidden; }
        .ticker-track { display: flex; }
        @keyframes ticker {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .animate-ticker {
          animation: ticker 60s linear infinite;
        }
        .animate-ticker:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
