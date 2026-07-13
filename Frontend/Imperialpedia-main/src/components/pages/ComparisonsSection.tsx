import Link from "next/link";
import { GitCompareArrows } from "lucide-react";
import type { NewsArticle } from "@/lib/data.news";

/** Title pattern for genuine "X vs Y" comparison pieces — used only to surface
 * real published comparisons, never to fabricate one that doesn't exist. */
const VS_PATTERN = /\bvs\.?\b/i;

export function findComparisons(articles: NewsArticle[], limit: number): NewsArticle[] {
  const seen = new Set<string>();
  const out: NewsArticle[] = [];
  for (const a of articles) {
    if (seen.has(a.slug) || !VS_PATTERN.test(a.title)) continue;
    seen.add(a.slug);
    out.push(a);
    if (out.length >= limit) break;
  }
  return out;
}

type Props = {
  articles: NewsArticle[];
  heading?: string;
};

/** Shared "X vs Y" comparisons rail — used by Banking, Personal Finance, and any
 * other hub that wants to surface genuine comparison content. Hides entirely
 * when no real comparison articles exist for that hub yet. */
export function ComparisonsSection({ articles, heading = "Comparisons" }: Props) {
  if (!articles.length) return null;

  return (
    <section>
      <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 pb-2">
        <GitCompareArrows className="h-4 w-4" />
        {heading}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {articles.map((article) => (
          <Link
            key={article.id}
            href={`/${article.slug}`}
            className="group flex items-center justify-between gap-4 rounded-xl border border-gray-100 px-5 py-4 transition-colors hover:border-gray-900"
          >
            <span className="text-sm font-semibold text-foreground group-hover:underline">
              {article.title}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default ComparisonsSection;
