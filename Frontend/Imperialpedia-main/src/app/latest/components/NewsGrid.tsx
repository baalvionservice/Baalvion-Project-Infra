"use client";

import { useState, useEffect } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { NewsCard } from "./NewsCard";
import { NewsArticle, generateMockNews } from "@/data/mockNews";

interface NewsGridProps {
  category?: string;
  searchQuery?: string;
}

// Mock API function
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
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  const limit = 12;
  let articles: NewsArticle[] = [];

  if (searchQuery) {
    // Mock search functionality
    articles = generateMockNews(pageParam, limit).filter(
      (article) =>
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  } else if (category && category !== "All") {
    // Mock category filtering
    articles = generateMockNews(pageParam, limit).filter(
      (article) => article.category === category
    );
  } else {
    articles = generateMockNews(pageParam, limit);
  }

  return {
    articles,
    hasMore: pageParam < 5, // Limit to 5 pages for demo
    nextPage: pageParam + 1,
  };
};

export function NewsGrid({ category = "All", searchQuery }: NewsGridProps) {
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
