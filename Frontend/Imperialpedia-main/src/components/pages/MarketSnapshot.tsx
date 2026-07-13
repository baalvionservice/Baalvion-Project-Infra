import type { Indicator } from "@/lib/data/worldRegions";
import { sparklinePoints } from "@/lib/utils/sparkline";

type Props = {
  indicators: Indicator[];
};

/** Fixed, recognizable read order for the hub's "heartbeat" card — index futures,
 * crypto, metals, energy, and rates, in that order regardless of indicator-array order. */
const SNAPSHOT_ORDER = [
  "S&P 500",
  "Nasdaq",
  "Dow Jones",
  "Bitcoin",
  "Gold",
  "Oil (WTI)",
  "10-Yr Bond",
  "EUR/USD",
];

/** "Today's Markets" heartbeat dashboard for the Market News hub — same indicator
 * data that powers the World page's ticker, reordered into the classic
 * indices → crypto → commodities → rates read the wire services use. */
export function MarketSnapshot({ indicators }: Props) {
  const byName = new Map(indicators.map((i) => [i.name, i]));
  const items = SNAPSHOT_ORDER.map((name) => byName.get(name)).filter(
    (i): i is Indicator => Boolean(i)
  );
  if (!items.length) return null;

  const asOf = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <section className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-6 sm:px-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400">
            Today&apos;s Markets
          </h2>
        </div>
        <span className="text-[11px] font-semibold text-gray-400">Intraday &middot; as of {asOf}</span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {items.map((item) => (
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
              viewBox={`0 0 64 22`}
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
            <p className="mt-1 truncate text-[10px] font-medium text-gray-400">Updated {asOf}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default MarketSnapshot;
