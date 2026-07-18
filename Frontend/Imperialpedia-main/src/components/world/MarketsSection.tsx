import type { WorldData } from "@/lib/data/worldRegions";
import MostActive from "@/components/world/MostActive";

function pctNum(change: string): number {
  const n = parseFloat(change.replace(/[+%]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function MoverRow({
  ticker,
  name,
  change,
  positive,
  maxAbs,
}: {
  ticker: string;
  name: string;
  change: string;
  positive: boolean;
  maxAbs: number;
}) {
  const width = Math.max(4, Math.round((Math.abs(pctNum(change)) / maxAbs) * 100));
  return (
    <div className="py-1.5">
      <div className="flex items-center justify-between text-xs mb-1 gap-2">
        <span className="font-bold text-foreground truncate">
          {ticker} <span className="font-normal text-muted-foreground">{name}</span>
        </span>
        <span
          className={`font-mono font-bold shrink-0 ${positive ? "text-[hsl(var(--cnbc-green))]" : "text-[hsl(var(--cnbc-red))]"}`}
        >
          {change}
        </span>
      </div>
      <div className="h-1.5 bg-muted rounded-sm overflow-hidden">
        <div
          className={`h-full ${positive ? "bg-[hsl(var(--cnbc-green))]" : "bg-[hsl(var(--cnbc-red))]"}`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

/** CNBC-style dedicated "MARKETS" module — bar-chart Market Movers +
 * Most Active table, both from the same real, live watchlist data already
 * fetched for the sidebar (Yahoo Finance, including real volume). */
export default function MarketsSection({ watchlist }: { watchlist: WorldData["watchlist"] }) {
  if (watchlist.length === 0) return null;

  const sorted = [...watchlist].sort((a, b) => pctNum(b.change) - pctNum(a.change));
  const top = sorted.slice(0, 5);
  const bottom = sorted.slice(-5).reverse();
  const maxAbs = Math.max(1, ...sorted.map((w) => Math.abs(pctNum(w.change))));

  return (
    <div className="border-b border-border px-2 sm:px-4 py-5">
      <h2 className="world-kicker text-xl font-black tracking-widest text-foreground uppercase border-b-4 border-[hsl(var(--cnbc-gold))] inline-block pb-1 mb-4">
        Markets
      </h2>

      <div className="bg-muted border border-border rounded-sm p-3 sm:p-4 mb-4">
        <span className="world-kicker text-[10px] font-black tracking-widest text-foreground uppercase block mb-3">
          Market Movers
        </span>
        <div className="grid sm:grid-cols-2 gap-x-6">
          <div>
            <p className="world-kicker text-[9px] font-bold text-muted-foreground uppercase mb-1">Top</p>
            {top.map((w) => (
              <MoverRow
                key={w.ticker}
                ticker={w.ticker}
                name={w.name}
                change={w.change}
                positive={w.positive}
                maxAbs={maxAbs}
              />
            ))}
          </div>
          <div>
            <p className="world-kicker text-[9px] font-bold text-muted-foreground uppercase mb-1">Bottom</p>
            {bottom.map((w) => (
              <MoverRow
                key={w.ticker}
                ticker={w.ticker}
                name={w.name}
                change={w.change}
                positive={w.positive}
                maxAbs={maxAbs}
              />
            ))}
          </div>
        </div>
      </div>

      <MostActive watchlist={watchlist} />
    </div>
  );
}
