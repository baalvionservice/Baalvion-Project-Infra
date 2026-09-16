import Link from "next/link";
import dynamic from "next/dynamic";
import { getAssetDetail } from "@/lib/data/marketsLoader";
import { MARKET_QUOTES_LIVE } from "@/config/market-quotes";

// recharts is heavy and only needed when an article mentions exactly one
// tracked company (see article-detail.tsx) — dynamic() splits it into its
// own chunk instead of shipping it in every article route's client bundle.
const ArticleInlineChartClient = dynamic(() =>
  import("./ArticleInlineChartClient").then((m) => m.ArticleInlineChartClient),
);

/** Server component — resolves one tracked company's recent price history and
 *  renders a light-themed inline chart. Light/primary-blue sibling of QuoteChart
 *  (that one's hardcoded dark/Imperialpedia-styled, wrong theme for the article template). */
export async function ArticleInlineChart({ symbol, name }: { symbol: string; name: string }) {
  const detail = await getAssetDetail(symbol, "1M");
  const points = detail?.chart?.length ? detail.chart : detail?.historical ?? [];
  if (!points.length) return null;

  return (
    <div className="rounded-lg border border-border p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-bold text-foreground">
          {name} <span className="text-muted-foreground font-normal">· 1M</span>
        </p>
        {MARKET_QUOTES_LIVE && (
          <Link href={`/markets/quote/${symbol}`} className="text-xs font-semibold text-primary hover:underline">
            Full chart →
          </Link>
        )}
      </div>
      <ArticleInlineChartClient data={points} />
    </div>
  );
}
