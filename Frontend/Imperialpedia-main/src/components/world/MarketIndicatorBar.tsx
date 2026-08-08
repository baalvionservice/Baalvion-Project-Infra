import Link from "next/link";
import type { Indicator } from "@/lib/data/worldRegions";

interface Props {
  indicators: Indicator[];
  asOf: string;
  regionLabel: string;
}

export default function MarketIndicatorBar({ indicators, asOf, regionLabel }: Props) {
  const keyIndicators = indicators.slice(0, 6);

  return (
    <div className="bg-[hsl(var(--cnbc-surface))] py-2 sm:py-3 px-2 sm:px-4">
      <div className="flex items-center gap-1 mb-1 sm:mb-2 overflow-hidden">
        <span className="world-kicker text-[9px] sm:text-[10px] font-black tracking-widest text-[hsl(var(--cnbc-gold))] uppercase whitespace-nowrap">
          {regionLabel} Markets
        </span>
        <span className="text-[8px] sm:text-[10px] text-white/50 ml-1 sm:ml-2 truncate">
          • {asOf}
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
        {keyIndicators.map((indicator) => {
          const content = (
            <>
              <div className="world-kicker text-[8px] sm:text-[10px] font-bold text-white/60 tracking-wide uppercase mb-0.5 truncate">
                {indicator.name}
              </div>
              <div className="flex items-baseline gap-1 sm:gap-1.5 min-w-0">
                <span className="text-xs sm:text-sm font-black font-mono text-white group-hover:text-[hsl(var(--cnbc-gold))] transition-colors truncate">
                  {indicator.value}
                </span>
                <span
                  className={`text-[9px] sm:text-[11px] font-bold font-mono whitespace-nowrap ${
                    indicator.positive ? "text-[hsl(var(--cnbc-green))]" : "text-[hsl(var(--cnbc-red))]"
                  }`}
                >
                  {indicator.positive ? "▲" : "▼"} {indicator.percent}
                </span>
              </div>
              <div
                className={`text-[8px] sm:text-[10px] font-mono truncate ${
                  indicator.positive ? "text-[hsl(var(--cnbc-green))]/70" : "text-[hsl(var(--cnbc-red))]/70"
                }`}
              >
                {indicator.change}
              </div>
            </>
          );
          return indicator.symbol ? (
            <Link key={indicator.name} href={`/markets/quote/${indicator.symbol}`} className="group block min-w-0">
              {content}
            </Link>
          ) : (
            <div key={indicator.name} className="group min-w-0">
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}
