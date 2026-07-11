import type { Indicator } from "@/lib/data/worldRegions";

function pctAbs(percent: string): number {
  const n = parseFloat(percent.replace(/[+%]/g, ""));
  return Number.isFinite(n) ? Math.abs(n) : 0;
}

/** CNBC-style "Market Movers" strip — the indicators with the biggest
 * absolute move, sorted from real live data (no separate fetch needed). */
export default function MarketMovers({ indicators }: { indicators: Indicator[] }) {
  const movers = [...indicators].sort((a, b) => pctAbs(b.percent) - pctAbs(a.percent)).slice(0, 6);
  if (movers.length === 0) return null;

  return (
    <div className="bg-white border-b border-gray-200 px-2 sm:px-4 py-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="world-kicker text-[10px] font-black tracking-widest text-gray-900 uppercase">
          Market Movers
        </span>
        <span className="flex-1 h-px bg-gray-200" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
        {movers.map((m) => (
          <div key={m.name} className="min-w-0">
            <div className="world-kicker text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase truncate">
              {m.name}
            </div>
            <span className="text-xs sm:text-sm font-black font-mono text-gray-900 truncate block">
              {m.value}
            </span>
            <span
              className={`text-[10px] sm:text-[11px] font-bold font-mono ${
                m.positive ? "text-[#00a857]" : "text-[#ce2b2b]"
              }`}
            >
              {m.positive ? "▲" : "▼"} {m.percent}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
