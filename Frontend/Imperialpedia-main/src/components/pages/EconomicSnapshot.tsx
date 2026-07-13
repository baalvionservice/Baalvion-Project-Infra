import type { Indicator } from "@/lib/data/worldRegions";
import { sparklinePoints } from "@/lib/utils/sparkline";

type Props = {
  indicators: Indicator[];
};

/**
 * "Economic Snapshot" dashboard for the Economy hub — deliberately labeled
 * "most recent release" rather than "intraday" (unlike MarketSnapshot):
 * macro data updates monthly or quarterly, not by the second, so the cadence
 * language here is honest about how often these figures actually change.
 */
export function EconomicSnapshot({ indicators }: Props) {
  if (!indicators.length) return null;

  return (
    <section className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-6 sm:px-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400">
            Economic Snapshot
          </h2>
        </div>
        <span className="text-[11px] font-semibold text-gray-400">Most recent release per indicator</span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {indicators.map((item) => (
          <div
            key={item.name}
            className="min-w-0 rounded-xl border border-gray-100 bg-white px-3 py-3"
          >
            <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              {item.name}
            </p>
            <p className="truncate font-mono text-base font-bold text-foreground">
              {item.value}
            </p>
            <p
              className={`font-mono text-xs font-bold ${
                item.positive ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {item.positive ? "▲" : "▼"} {item.percent}
            </p>
            <svg
              viewBox="0 0 64 22"
              className="mt-2 h-5 w-full"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <polyline
                points={sparklinePoints(item.name, item.positive)}
                fill="none"
                stroke={item.positive ? "#059669" : "#dc2626"}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        ))}
      </div>
    </section>
  );
}

export default EconomicSnapshot;
