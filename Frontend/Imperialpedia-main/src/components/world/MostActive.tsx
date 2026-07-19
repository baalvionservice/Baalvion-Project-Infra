import type { WorldData } from "@/lib/data/worldRegions";

function formatVolume(n: number): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + "B";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

/** CNBC-style "Most Active" table — real regularMarketVolume from Yahoo's
 * chart API (same fetch already used for the watchlist), sorted descending.
 * Scoped to the tracked watchlist (not the full market universe) — no
 * fabricated volume numbers. */
export default function MostActive({ watchlist }: { watchlist: WorldData["watchlist"] }) {
  const rows = [...watchlist]
    .filter((w) => w.volume != null)
    .sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0));
  if (rows.length === 0) return null;

  return (
    <div>
      <span className="world-kicker text-[10px] font-black tracking-widest text-foreground uppercase border-b-2 border-border pb-2 block mb-2">
        Most Active
      </span>
      <div className="grid grid-cols-4 world-kicker text-[9px] font-bold text-muted-foreground uppercase pb-1.5 border-b border-border">
        <span>Name</span>
        <span className="text-right">Price</span>
        <span className="text-right">%Chg</span>
        <span className="text-right">Vol</span>
      </div>
      <div className="divide-y divide-border">
        {rows.map((r) => (
          <div key={r.ticker} className="grid grid-cols-4 items-center py-2 text-xs">
            <span className="font-bold text-foreground">{r.ticker}</span>
            <span className="text-right font-mono text-foreground">{r.price}</span>
            <span
              className={`text-right font-mono font-bold ${r.positive ? "text-[hsl(var(--cnbc-green))]" : "text-[hsl(var(--cnbc-red))]"}`}
            >
              {r.change}
            </span>
            <span className="text-right font-mono text-muted-foreground">{formatVolume(r.volume as number)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
