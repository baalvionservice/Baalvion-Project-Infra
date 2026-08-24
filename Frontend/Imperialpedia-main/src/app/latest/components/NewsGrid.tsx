"use client";

import { useEffect } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { NewsCard } from "./NewsCard";
import { newsArticles, type NewsArticle } from "@/lib/data.news";

interface NewsGridProps {
  category?: string;
  searchQuery?: string;
  /** Reports whether the grid ended up with any real articles once loading
   *  settles, so a parent (e.g. an ad slot placed above this grid) can avoid
   *  rendering next to an empty "No articles found" result. */
  onLoadStateChange?: (hasArticles: boolean) => void;
}

/**
 * Real, CMS-backed page fetch via the same-origin `/api/news/latest` proxy
 * (avoids browser CORS against cms-service directly). Category/search
 * narrowing happens client-side over each fetched page, matching how this
 * grid always behaved; falls back to the bundled demo set only when the
 * very first page comes back empty (CMS unreachable/offline).
 */
const fetchNews = async ({
  pageParam = 1,
  category,
  searchQuery,
}: {
  pageParam?: number;
  category?: string;
  searchQuery?: string;
}): Promise<{
  articles: NewsArticle[];
  hasMore: boolean;
  nextPage: number;
}> => {
  let items: NewsArticle[] = [];
  let hasMore = false;

  try {
    const res = await fetch(`/api/news/latest?page=${pageParam}`, { cache: "no-store" });
    const data = (await res.json()) as { items: NewsArticle[]; hasMore: boolean };
    items = data.items;
    hasMore = data.hasMore;
  } catch {
    items = [];
    hasMore = false;
  }

  // Never truly empty: fall back to the bundled demo set on the first page only.
  if (pageParam === 1 && items.length === 0) {
    items = newsArticles;
    hasMore = false;
  }

  let articles = items;
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    articles = articles.filter(
      (article) =>
        article.title.toLowerCase().includes(q) ||
        article.excerpt.toLowerCase().includes(q)
    );
  } else if (category && category !== "All") {
    articles = articles.filter((article) => article.category === category);
  }

  return {
    articles,
    hasMore,
    nextPage: pageParam + 1,
  };
};

export function NewsGrid({ category = "All", searchQuery, onLoadStateChange }: NewsGridProps) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery({
    queryKey: ["news", category, searchQuery],
    queryFn: ({ pageParam }) => fetchNews({ pageParam, category, searchQuery }),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextPage : undefined,
    initialPageParam: 1,
  });

  const loadedArticleCount = data?.pages.flatMap((page) => page.articles).length ?? 0;
  useEffect(() => {
    if (!isLoading) onLoadStateChange?.(loadedArticleCount > 0);
  }, [isLoading, loadedArticleCount, onLoadStateChange]);

  // Infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 1000
      ) {
        if (hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 dark:bg-gray-700 aspect-[16/9] rounded-lg mb-3 sm:mb-4"></div>
            <div className="space-y-2">
              <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              <div className="h-2 sm:h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 dark:text-red-400">
          Failed to load news articles
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  const allArticles = data?.pages.flatMap((page) => page.articles) || [];

  if (allArticles.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">No articles found</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Featured Article */}
      {allArticles.length > 0 && (
        <div className="mb-8">
          <NewsCard article={allArticles[0]} variant="featured" />
        </div>
      )}

      {/* News Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {allArticles.slice(1).map((article) => (
          <NewsCard key={article.id} article={article} />
        ))}
      </div>

      {/* Loading More */}
      {isFetchingNextPage && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 dark:bg-gray-700 aspect-[16/9] rounded-lg mb-3 sm:mb-4"></div>
              <div className="space-y-2">
                <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                <div className="h-2 sm:h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* End of results */}
      {!hasNextPage && allArticles.length > 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">
            You've reached the end
          </p>
        </div>
      )}
    </div>
  );
}
