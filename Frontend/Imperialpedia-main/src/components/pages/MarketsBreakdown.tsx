import Link from "next/link";
import type { MarketAssetRow } from "@/lib/data/marketsLoader";

function fmt(v: number | string | null) {
  if (v == null) return "—";
  return Number(v).toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function Row({ asset }: { asset: MarketAssetRow }) {
  const pct = asset.change_pct_24h != null ? Number(asset.change_pct_24h) : null;
  const up = (pct ?? 0) >= 0;
  return (
    <Link
      href={`/markets/quote/${asset.symbol}`}
      className="flex items-center justify-between px-3 py-2 hover:bg-muted/50 transition-colors border-b border-border last:border-b-0"
    >
      <span className="truncate text-[13px] font-medium text-foreground">{asset.name}</span>
      <span className="flex items-baseline gap-1.5 shrink-0 font-mono text-[12px]">
        <span className="font-semibold text-foreground tabular-nums">{fmt(asset.current_price)}</span>
        {pct != null && (
          <span className={`font-bold tabular-nums ${up ? "text-positive" : "text-negative"}`}>
            {up ? "▲" : "▼"} {Math.abs(pct).toFixed(2)}%
          </span>
        )}
      </span>
    </Link>
  );
}

function Panel({ title, assets }: { title: string; assets: MarketAssetRow[] }) {
  return (
    <div className="rounded-sm border border-border bg-card overflow-hidden">
      <div className="px-3 py-2 border-b border-border bg-muted">
        <h4 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{title}</h4>
      </div>
      {assets.length === 0 ? (
        <p className="px-3 py-4 text-center text-[12px] text-muted-foreground">No data</p>
      ) : (
        assets.map((a) => <Row key={a.symbol} asset={a} />)
      )}
    </div>
  );
}

interface Props {
  usIndices: MarketAssetRow[];
  sectors: MarketAssetRow[];
  gainers: MarketAssetRow[];
  losers: MarketAssetRow[];
  europe: MarketAssetRow[];
  asiaPacific: MarketAssetRow[];
  china: MarketAssetRow[];
  emergingMarkets: MarketAssetRow[];
  crypto: MarketAssetRow[];
  commodities: MarketAssetRow[];
  currencies: MarketAssetRow[];
  bonds: MarketAssetRow[];
}

/** The full CNBC-depth market breakdown, embedded in the /market-news hub —
 * this codebase's next.config.ts already redirects the old standalone /markets
 * and /market URLs here ("removed in favour of the dynamic /market-news hub"),
 * so this IS the site's markets homepage; it previously only showed a static
 * 8-indicator snapshot. Now themed via semantic tokens (bg-card/border-border/
 * text-muted-foreground/text-positive/text-negative) that resolve to the
 * literal CNBC black/red look inside .cnbc-shell (globals.css) — matching the
 * standalone /markets/quote/[symbol] pages, not a separate light-editorial
 * clone as this component originally was before the CNBC re-theme. */
export function MarketsBreakdown(props: Props) {
  return (
    <section>
      <div className="mb-5 flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-positive" />
        <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">All Markets</h2>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Panel title="U.S. Indices" assets={props.usIndices} />
          <Panel title="Sector Performance" assets={props.sectors} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Panel title="Top Gainers" assets={props.gainers} />
          <Panel title="Top Losers" assets={props.losers} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Panel title="Europe" assets={props.europe} />
          <Panel title="Asia-Pacific" assets={props.asiaPacific} />
          <Panel title="China" assets={props.china} />
          <Panel title="Emerging Markets" assets={props.emergingMarkets} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Panel title="Crypto" assets={props.crypto} />
          <Panel title="Commodities" assets={props.commodities} />
          <Panel title="Currencies" assets={props.currencies} />
        </div>

        <Panel title="U.S. Treasury Yields" assets={props.bonds} />
      </div>
    </section>
  );
}
