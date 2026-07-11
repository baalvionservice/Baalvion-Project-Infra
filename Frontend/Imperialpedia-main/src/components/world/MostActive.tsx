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
      <span className="world-kicker text-[10px] font-black tracking-widest text-gray-900 uppercase border-b-2 border-gray-200 pb-2 block mb-2">
        Most Active
      </span>
      <div className="grid grid-cols-4 world-kicker text-[9px] font-bold text-gray-400 uppercase pb-1.5 border-b border-gray-100">
        <span>Name</span>
        <span className="text-right">Price</span>
        <span className="text-right">%Chg</span>
        <span className="text-right">Vol</span>
      </div>
      <div className="divide-y divide-gray-50">
        {rows.map((r) => (
          <div key={r.ticker} className="grid grid-cols-4 items-center py-2 text-xs">
            <span className="font-bold text-gray-800">{r.ticker}</span>
            <span className="text-right font-mono text-gray-800">{r.price}</span>
            <span
              className={`text-right font-mono font-bold ${r.positive ? "text-[#00a857]" : "text-[#ce2b2b]"}`}
            >
              {r.change}
            </span>
            <span className="text-right font-mono text-gray-600">{formatVolume(r.volume as number)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
