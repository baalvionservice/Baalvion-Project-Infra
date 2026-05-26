"use client";

import { NewsCard } from "./NewsCard";
import { mockNewsData } from "@/data/mockNews";

export function TrendingNews() {
  // Get top 4 trending articles (mock logic - in real app this would be based on views/engagement)
  const trendingArticles = mockNewsData.slice(0, 4);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3">
      <div className="flex items-center gap-2 mb-6">
        <svg
          className="h-5 w-5 text-red-500"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0 11.5 11.5 0 010 16.262.75.75 0 11-1.06-1.061 10 10 0 000-14.14.75.75 0 010-1.061z" />
          <path d="M15.932 7.757a.75.75 0 011.061 0 6.5 6.5 0 010 9.185.75.75 0 01-1.06-1.06 5 5 0 000-7.07.75.75 0 010-1.055z" />
        </svg>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
          Trending Now
        </h2>
      </div>

      <div className="space-y-4">
        {trendingArticles.map((article, index) => (
          <div key={article.id} className="flex items-start gap-3">
            
            <div className="flex-1">
              <NewsCard article={article} variant="compact" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
