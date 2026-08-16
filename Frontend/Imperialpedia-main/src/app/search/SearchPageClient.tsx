"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { SearchBar } from "@/components/search/SearchBar";
import { SearchResultItem } from "@/components/search/SearchResultItem";
import type { SearchResult } from "@/types/search";
import type { Article } from "@/modules/content-engine/types";
import { newsArticleHref } from "@/lib/data/article-url";
import { Container } from "@/design-system/layout/container";
import { Text } from "@/design-system/typography/text";
import { Loader2, Sparkles } from "lucide-react";

interface SearchPageClientProps {
  trendingArticles: Article[];
}

function TrendingArticles({ articles }: { articles: Article[] }) {
  if (articles.length === 0) return null;
  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 text-primary mb-6">
        <Sparkles className="h-4 w-4" />
        <Text variant="label" className="text-xs font-bold uppercase tracking-widest">
          Trending on Imperialpedia
        </Text>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {articles.map((article) => (
          <Link
            key={article.id}
            href={newsArticleHref({
              slug: article.slug,
              publishedAt: article.publishedAt || article.updatedAt,
              contentType: article.contentType,
              categorySlug: article.categorySlug,
            })}
            className="flex items-center justify-between p-4 rounded-2xl hover:bg-muted/50 transition-all group border border-transparent hover:border-border/50"
          >
            <Text variant="bodySmall" weight="bold" className="group-hover:text-primary transition-colors line-clamp-2">
              {article.title}
            </Text>
          </Link>
        ))}
      </div>
    </div>
  );
}

function SearchContent({ trendingArticles }: SearchPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [inputValue, setInputValue] = useState(initialQuery);
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setInputValue(initialQuery);
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }
    // Route through /api/search (same endpoint the command palette uses)
    // instead of calling searchService.performSearch directly from the
    // browser: that call fetches cms-service and imperialpedia-service
    // straight from the client, and both only CORS-allowlist local dev
    // origins — in production the CMS/article portion of results is
    // silently dropped by the browser. Server-side fetches (this route,
    // and the RSC-side cms-public.ts) aren't subject to that restriction.
    const controller = new AbortController();
    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data: SearchResult[]) => setResults(data))
      .catch((e) => {
        if ((e as Error).name !== 'AbortError') console.error(e);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [query]);

  const handleSubmit = (value: string) => {
    const trimmed = value.trim();
    router.push(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : "/search");
  };

  return (
    <main className="min-h-screen bg-background pt-16 pb-32">
      <Container className="max-w-3xl">
        <header className="mb-10 text-center">
          <Text variant="h1" as="h1" className="text-3xl lg:text-4xl font-bold tracking-tight mb-2">
            Search Imperialpedia
          </Text>
          <Text variant="body" className="text-muted-foreground">
            Companies, countries, industries, technologies, articles &amp; reviews
          </Text>
        </header>

        <SearchBar
          value={inputValue}
          onChange={setInputValue}
          onSubmit={handleSubmit}
          autoFocus
          placeholder="Search companies, countries, articles..."
        />

        <div className="mt-10">
          {loading && (
            <div className="p-12 text-center flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <Text variant="caption" className="uppercase tracking-widest font-bold text-muted-foreground">
                Searching...
              </Text>
            </div>
          )}

          {!loading && query && (
            <Text variant="label" className="text-xs uppercase tracking-widest text-muted-foreground mb-4 block">
              {results.length} result{results.length === 1 ? "" : "s"} for &ldquo;{query}&rdquo;
            </Text>
          )}

          {!loading && query && results.length === 0 && (
            // CNBC-style no-results state: plain editorial text behind a red
            // rule, not a rounded dashed-border card with a big icon — same
            // treatment as the command-palette's SearchResults.tsx.
            <div className="py-10 border-t-2 border-[hsl(var(--cnbc-red))] mb-10">
              <Text variant="label" className="text-[hsl(var(--cnbc-red))] text-[10px] font-bold uppercase tracking-[0.2em]">
                No Results
              </Text>
              <Text variant="bodySmall" weight="bold" className="mt-2">
                No results found for &ldquo;{query}&rdquo;
              </Text>
              <Text variant="caption" className="text-muted-foreground mt-1">
                Try a different term, or browse what&apos;s trending below.
              </Text>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="space-y-1 mb-10">
              {results.map((result) => (
                <SearchResultItem key={result.id} {...result} />
              ))}
            </div>
          )}

          {!loading && results.length === 0 && <TrendingArticles articles={trendingArticles} />}
        </div>
      </Container>
    </main>
  );
}

export function SearchPageClient({ trendingArticles }: SearchPageClientProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <SearchContent trendingArticles={trendingArticles} />
    </Suspense>
  );
}

export default SearchPageClient;
