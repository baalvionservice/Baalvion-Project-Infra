import Link from "next/link";
import { getAssetDetail } from "@/lib/data/marketsLoader";
import { ArticleInlineChartClient } from "./ArticleInlineChartClient";

/** Server component — resolves one tracked company's recent price history and
 *  renders a light-themed inline chart. Light/primary-blue sibling of QuoteChart
 *  (that one's hardcoded dark/CNBC-styled, wrong theme for the article template). */
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
        <Link href={`/markets/quote/${symbol}`} className="text-xs font-semibold text-primary hover:underline">
          Full chart →
        </Link>
      </div>
      <ArticleInlineChartClient data={points} />
    </div>
  );
}
