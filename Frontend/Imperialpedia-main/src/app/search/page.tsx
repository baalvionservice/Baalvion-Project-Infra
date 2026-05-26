"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { NewsGrid } from "@/app/latest/components/NewsGrid";
import { SearchBar } from "@/app/latest/components/SearchBar";

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Search News
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Find the latest news articles
            </p>
          </div>

          <SearchBar />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {query && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Search results for "{query}"
            </h2>
          </div>
        )}

        {query ? (
          <NewsGrid searchQuery={query} />
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">
              Enter a search term to find news articles
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
