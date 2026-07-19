import Link from "next/link";
import type { NewsArticle } from "@/lib/data.news";
import { formatDate } from "@/services/format-date";
import { newsArticleHref } from "@/lib/data/article-url";

export type EconomicCalendarRow = {
  article: NewsArticle;
  /** Real topic the article was fetched from (Federal Reserve / Inflation / Economy), not a fabricated event label. */
  eventType: string;
};

type Props = {
  rows: EconomicCalendarRow[];
  ctaHref?: string;
};

/**
 * Economic-calendar-styled module sourced from real CPI/GDP/jobs/Fed coverage
 * already published in the CMS, keyed to when it actually ran — not a
 * forward-looking schedule of invented future release dates.
 */
export function EconomicCalendarTable({ rows, ctaHref = "/calendar" }: Props) {
  if (!rows.length) return null;

  return (
    <div className="overflow-hidden rounded-sm border border-border">
      <div className="flex items-center justify-between border-b border-border bg-muted px-5 py-3">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Economic Calendar</p>
        <Link href={ctaHref} className="text-xs font-semibold text-foreground hover:underline">
          Full economic calendar &rarr;
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <th className="px-5 py-2 font-semibold">Event</th>
              <th className="px-5 py-2 font-semibold">Released</th>
              <th className="px-5 py-2 font-semibold">Coverage</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ article, eventType }) => (
              <tr key={article.id} className="border-b border-border last:border-none">
                <td className="whitespace-nowrap px-5 py-3 font-semibold text-foreground">{eventType}</td>
                <td className="whitespace-nowrap px-5 py-3 text-muted-foreground">
                  {formatDate(article.publishedAt)}
                </td>
                <td className="max-w-0 px-5 py-3">
                  <Link href={newsArticleHref(article)} className="block truncate text-foreground hover:underline">
                    {article.title}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default EconomicCalendarTable;
