import Link from "next/link";
import type { NewsArticle } from "@/lib/data.news";
import { newsArticleHref } from "@/lib/data/article-url";

type Props = {
  articles: NewsArticle[];
  ctaHref?: string;
};

/**
 * Earnings-calendar-styled module. Deliberately shows *reported* coverage
 * (real headline + real publish date) rather than forward-looking
 * company/date/EPS-estimate rows, which the CMS has no data source for —
 * inventing those would put fictional financial figures on a live, indexed page.
 */
export function EarningsCalendarTable({ articles, ctaHref = "/earnings" }: Props) {
  if (!articles.length) return null;

  return (
    <div className="overflow-hidden rounded-sm border border-border">
      <div className="flex items-center justify-between border-b border-border bg-muted px-5 py-3">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Earnings Calendar</p>
        <Link href={ctaHref} className="text-xs font-semibold text-foreground hover:underline">
          Full earnings coverage &rarr;
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <th className="px-5 py-2 font-semibold">Story</th>
            </tr>
          </thead>
          <tbody>
            {articles.map((article) => (
              <tr key={article.id} className="border-b border-border last:border-none">
                <td className="max-w-0 px-5 py-3">
                  <Link
                    href={newsArticleHref(article)}
                    className="block truncate font-semibold text-foreground hover:underline"
                  >
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

export default EarningsCalendarTable;
