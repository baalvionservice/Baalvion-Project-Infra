"use client";
import { marketIndicators } from "@/lib/data/worldData";

export default function MarketTicker() {
  const doubled = [...marketIndicators, ...marketIndicators];

  return (
    <div className="bg-[#0a0a0a] border-b border-gray-800 overflow-hidden py-2">
      <div className="ticker-wrapper">
        <div className="ticker-track flex gap-8 animate-ticker whitespace-nowrap">
          {doubled.map((item, i) => (
            <span key={i} className="inline-flex items-center gap-2 text-xs shrink-0 cursor-pointer hover:opacity-80 transition-opacity">
              <span className="text-gray-400 font-medium tracking-wide">{item.name}</span>
              <span className="text-white font-mono">{item.value}</span>
              <span className={`font-mono text-[11px] ${item.positive ? "text-green-400" : "text-red-400"}`}>
                {item.positive ? "▲" : "▼"} {item.change} ({item.percent})
              </span>
              <span className="text-gray-700 ml-2">|</span>
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
