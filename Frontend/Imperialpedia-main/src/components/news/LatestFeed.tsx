"use client";

import * as React from "react";
import { ChevronDown, Loader2 } from "lucide-react";

import type { NewsArticle, NewsCategory } from "@/lib/data.news";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArticleCard } from "@/app/news/NewsArticleCard";

type ExploreValue = "all" | "markets" | "company" | "crypto" | "personal-finance" | "more";

const MAIN_TABS: Array<{ value: Exclude<ExploreValue, "more">; label: string; category: NewsCategory | "All" }> = [
  { value: "all", label: "All", category: "All" },
  { value: "markets", label: "Market News", category: "Markets" },
  { value: "company", label: "Company News", category: "Stocks" },
  { value: "crypto", label: "Cryptocurrency News", category: "Crypto" },
  { value: "personal-finance", label: "Personal Finance News", category: "PersonalFinance" },
];

const MORE_CATEGORIES: NewsCategory[] = ["Economy", "RealEstate", "ETFs", "Bonds"];

function filterByCategory(articles: NewsArticle[], category: NewsCategory | "All") {
  if (category === "All") return articles;
  return articles.filter((a) => a.category === category);
}

type Props = {
  /** SSR first page, already fetched by the server component. */
  initialArticles: NewsArticle[];
  initialHasMore: boolean;
};

/** "Latest News" section: category tabs over an infinite-scrolling, paginated feed. */
export function LatestFeed({ initialArticles, initialHasMore }: Props) {
  const [tab, setTab] = React.useState<ExploreValue>("all");
  const [selectedCategory, setSelectedCategory] = React.useState<NewsCategory | "All">("All");
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
      const data = (await res.json()) as { items: NewsArticle[]; hasMore: boolean };
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

  const filtered = React.useMemo(() => filterByCategory(articles, selectedCategory), [articles, selectedCategory]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Tabs
          value={tab}
          onValueChange={(next) => {
            const nextTab = next as ExploreValue;
            setTab(nextTab);
            const main = MAIN_TABS.find((t) => t.value === nextTab);
            if (main) setSelectedCategory(main.category);
          }}
          className="w-full"
        >
          <TabsList className="w-full justify-start bg-transparent p-0 h-auto flex-wrap gap-2">
            {MAIN_TABS.map((t) => (
              <TabsTrigger
                key={t.value}
                value={t.value}
                className="border border-border bg-card px-4 py-2 text-xs font-semibold uppercase tracking-wider text-foreground shadow-none data-[state=active]:border-[hsl(var(--cnbc-red))] data-[state=active]:bg-[hsl(var(--cnbc-red))] data-[state=active]:text-white"
              >
                {t.label}
              </TabsTrigger>
            ))}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="border bg-card px-4 py-2 text-xs font-semibold uppercase tracking-wider text-foreground"
                  onClick={() => setTab("more")}
                >
                  More <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuRadioGroup
                  value={selectedCategory === "All" ? "" : selectedCategory}
                  onValueChange={(v) => {
                    setTab("more");
                    setSelectedCategory(v as NewsCategory);
                  }}
                >
                  {MORE_CATEGORIES.map((cat) => (
                    <DropdownMenuRadioItem key={cat} value={cat}>
                      {cat}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => {
                    setTab("all");
                    setSelectedCategory("All");
                  }}
                >
                  View all
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {filtered.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>

      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-6">
          <Button type="button" variant="outline" disabled={loading} onClick={() => void loadMore()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
}
