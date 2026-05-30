"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { SearchBar } from "@/app/latest/components/SearchBar";
import { searchService } from "@/services/data/search-service";
import type { SearchResult } from "@/types/search";
import { Loader2, ArrowUpRight } from "lucide-react";

const TYPE_LABEL: Record<string, string> = {
  company: "Company", country: "Country", industry: "Industry", technology: "Technology",
  article: "Article", author: "Creator", glossary: "Glossary", topic: "Market", calculator: "Tool",
};

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }
    let active = true;
    setLoading(true);
    searchService
      .performSearch(query)
      .then((res) => {
        if (active) setResults(res.data || []);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [query]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Search Imperialpedia
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Articles, companies, markets, glossary, reviews, creators &amp; more
            </p>
          </div>
          <SearchBar placeholder="Search the index..." />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {query && (
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            {loading ? "Searching" : `${results.length} result${results.length === 1 ? "" : "s"}`} for &ldquo;{query}&rdquo;
          </h2>
        )}

        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {!loading && query && results.length === 0 && (
          <p className="text-center py-16 text-gray-500 dark:text-gray-400">
            No results found. Try a different term.
          </p>
        )}

        {!loading && !query && (
          <p className="text-center py-16 text-gray-600 dark:text-gray-400">
            Enter a search term to explore the index.
          </p>
        )}

        <div className="space-y-3">
          {results.map((r) => (
            <Link
              key={r.id}
              href={r.route}
              className="group block rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded">
                      {TYPE_LABEL[r.type] || r.type}
                    </span>
                    {r.category && (
                      <span className="text-[11px] text-gray-400 uppercase tracking-wide">{r.category}</span>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-primary transition-colors truncate">
                    {r.title}
                  </h3>
                  {r.snippet && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{r.snippet}</p>
                  )}
                </div>
                <ArrowUpRight className="h-5 w-5 text-gray-300 group-hover:text-primary shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
