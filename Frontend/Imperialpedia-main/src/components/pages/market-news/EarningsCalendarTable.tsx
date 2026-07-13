import Link from "next/link";
import type { NewsArticle } from "@/lib/data.news";
import { formatDate } from "@/services/format-date";

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
    <div className="overflow-hidden rounded-2xl border border-gray-100">
      <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-5 py-3">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Earnings Calendar</p>
        <Link href={ctaHref} className="text-xs font-semibold text-foreground hover:underline">
          Full earnings coverage &rarr;
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-[11px] uppercase tracking-wide text-gray-400">
              <th className="px-5 py-2 font-semibold">Story</th>
              <th className="px-5 py-2 font-semibold">Reported</th>
            </tr>
          </thead>
          <tbody>
            {articles.map((article) => (
              <tr key={article.id} className="border-b border-gray-50 last:border-none">
                <td className="max-w-0 px-5 py-3">
                  <Link
                    href={`/${article.slug}`}
                    className="block truncate font-semibold text-foreground hover:underline"
                  >
                    {article.title}
                  </Link>
                </td>
                <td className="whitespace-nowrap px-5 py-3 text-gray-500">
                  {formatDate(article.publishedAt)}
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
