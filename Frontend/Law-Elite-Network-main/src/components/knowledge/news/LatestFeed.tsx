"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import type { CmsArticle } from "@/lib/cms";
import { StoryCard } from "./StoryCard";

type Props = {
  /** SSR first page, already fetched by the server component. */
  initialArticles: CmsArticle[];
  initialHasMore: boolean;
};

/** "Latest News" infinite-scrolling feed, backed by /api/news/latest. */
export function LatestFeed({ initialArticles, initialHasMore }: Props) {
  const [articles, setArticles] = React.useState(initialArticles);
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(initialHasMore);
  const [loading, setLoading] = React.useState(false);
  const sentinelRef = React.useRef<HTMLDivElement>(null);

  const loadMore = React.useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const nextPage = page + 1;
      const res = await fetch(`/api/news/latest?page=${nextPage}`);
      const data = (await res.json()) as { items: CmsArticle[]; hasMore: boolean };
      setArticles((prev) => [...prev, ...data.items]);
      setPage(nextPage);
      setHasMore(data.hasMore);
    } catch {
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, page]);

  React.useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadMore();
      },
      { rootMargin: "400px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  if (!articles.length) return null;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-10">
        {articles.map((article) => (
          <StoryCard key={article.id || article.slug} article={article} variant="default" />
        ))}
      </div>

      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-6">
          <button
            type="button"
            disabled={loading}
            onClick={() => void loadMore()}
            className="inline-flex items-center gap-2 rounded-md border border-slate-200 dark:border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}
