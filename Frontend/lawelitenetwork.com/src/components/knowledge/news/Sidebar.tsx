import Link from "next/link";
import type { CmsArticle } from "@/lib/cms";
import { articleUrl } from "@/lib/article-url";
import { CURRENT_CATEGORY_SLUGS } from "@/lib/category-slugs";

type Props = {
  articles: CmsArticle[];
};

function ArticleLinkList({ items }: { items: CmsArticle[] }) {
  return (
    <ol className="space-y-3">
      {items.map((article, i) => (
        <li key={article.id} className="flex gap-3">
          <span className="text-lg font-bold text-slate-300 dark:text-slate-600 leading-none">{i + 1}</span>
          <Link
            href={articleUrl(article)}
            className="font-headline text-sm font-semibold leading-snug text-slate-900 dark:text-white hover:text-news-600 transition-colors"
          >
            {article.title}
          </Link>
        </li>
      ))}
    </ol>
  );
}

/** Popular / Editor's Picks / Trending Topics — no fabricated view or comment counts. */
export function Sidebar({ articles }: Props) {
  const withViews = articles.filter((a) => typeof a.views === "number");
  const mostViewed = [...withViews].sort((a, b) => (b.views ?? 0) - (a.views ?? 0)).slice(0, 5);
  const editorsPicks = articles.filter((a) => a.featured).slice(0, 5);
  // An article's `category.slug` isn't guaranteed to be one of the site's
  // real category pages (e.g. a CMS article whose primary category resolved
  // to a nested/legacy slug like `family-law-child-custody`) -- linking those
  // unconditionally turns "Trending Topics" into dead links. articleUrl.ts /
  // Breadcrumbs.tsx apply the same guard for the same reason.
  const currentSlugSet = new Set<string>(CURRENT_CATEGORY_SLUGS);
  const categories = Array.from(
    new Map(
      articles
        .filter((a) => a.category?.slug && currentSlugSet.has(a.category.slug))
        .map((a) => [a.category!.slug, a.category!.name] as const),
    ).entries(),
  );

  return (
    <aside className="space-y-8">
      {mostViewed.length > 0 && (
        <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-4">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-news-600 mb-4">
            Most Viewed
          </h3>
          <ArticleLinkList items={mostViewed} />
        </div>
      )}

      {editorsPicks.length > 0 && (
        <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-4">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-news-600 mb-4">
            Editor&rsquo;s Picks
          </h3>
          <ArticleLinkList items={editorsPicks} />
        </div>
      )}

      {categories.length > 0 && (
        <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-4">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-news-600 mb-4">
            Trending Topics
          </h3>
          <div className="flex flex-wrap gap-2">
            {categories.map(([slug, name]) => (
              <Link
                key={slug}
                href={`/${slug}`}
                className="rounded-full border border-slate-200 dark:border-slate-700 px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-news-600 hover:text-news-600 transition-colors"
              >
                {name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
