import Link from "next/link";
import type { NewsArticle } from "@/lib/data.news";
import { CATEGORY_TOPIC_SLUG } from "@/lib/utils/category-topic-slug";
import { newsArticleHref } from "@/lib/data/article-url";

type Props = {
  articles: NewsArticle[];
};

function ArticleLinkList({ items }: { items: NewsArticle[] }) {
  return (
    <ol className="space-y-3">
      {items.map((article, i) => (
        <li key={article.id} className="flex gap-3">
          <span className="text-lg font-bold text-muted-foreground/40 leading-none">{i + 1}</span>
          <Link href={newsArticleHref(article)} className="text-sm font-medium leading-snug text-foreground hover:underline">
            {article.title}
          </Link>
        </li>
      ))}
    </ol>
  );
}

/** Popular / Editor's Picks / Trending Topics — no fabricated view or comment counts. */
export function NewsSidebar({ articles }: Props) {
  const withViews = articles.filter((a) => typeof a.views === "number");
  const mostViewed = [...withViews].sort((a, b) => (b.views ?? 0) - (a.views ?? 0)).slice(0, 5);
  const editorsPicks = articles.filter((a) => a.featured).slice(0, 5);
  const categories = Array.from(new Set(articles.map((a) => a.category)));

  return (
    <aside className="space-y-8">
      {mostViewed.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Most Viewed
          </h3>
          <ArticleLinkList items={mostViewed} />
        </div>
      )}

      {editorsPicks.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Editor&rsquo;s Picks
          </h3>
          <ArticleLinkList items={editorsPicks} />
        </div>
      )}

      {categories.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Trending Topics
          </h3>
          <div className="flex flex-wrap gap-2">
            {categories
              .filter((cat) => CATEGORY_TOPIC_SLUG[cat])
              .map((cat) => (
                <Link
                  key={cat}
                  href={`/${CATEGORY_TOPIC_SLUG[cat]}`}
                  className="rounded-full border border-border px-3 py-1 text-xs font-medium text-foreground hover:bg-muted"
                >
                  {cat}
                </Link>
              ))}
          </div>
        </div>
      )}
    </aside>
  );
}
