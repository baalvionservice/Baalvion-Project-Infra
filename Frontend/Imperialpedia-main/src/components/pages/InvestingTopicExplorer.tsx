"use client";

import * as React from "react";
import type { NewsArticle } from "@/lib/data.news";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArticleCard } from "@/app/news/NewsArticleCard";

export type InvestingTopic = { slug: string; label: string };

type Props = {
  /** All investing topics, in nav order. */
  topics: InvestingTopic[];
  /** Live articles per topic slug, fetched server-side from the CMS. */
  articlesByTopic: Record<string, NewsArticle[]>;
  /** The main investing feed, shown under "All". */
  allArticles: NewsArticle[];
};

/**
 * Topic-based explorer for the Investing hub — swaps between pre-fetched,
 * CMS-sourced article sets per topic (Stocks, ETFs, Bonds, ...) instead of the
 * generic news-type filter (Market News / Company News / ...) used elsewhere.
 * All data is fetched server-side before this component ever renders; switching
 * tabs only changes which already-live set is displayed.
 */
export function InvestingTopicExplorer({ topics, articlesByTopic, allArticles }: Props) {
  const [active, setActive] = React.useState<string>("all");

  const visibleTopics = React.useMemo(
    () => topics.filter((t) => (articlesByTopic[t.slug]?.length ?? 0) > 0),
    [topics, articlesByTopic]
  );

  const articles = active === "all" ? allArticles : articlesByTopic[active] ?? [];

  return (
    <div className="space-y-6">
      <Tabs value={active} onValueChange={setActive} className="w-full">
        <TabsList className="w-full justify-start bg-transparent p-0 h-auto flex-wrap gap-2">
          <TabsTrigger
            value="all"
            className="border bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-700 shadow-none data-[state=active]:border-gray-900 data-[state=active]:bg-gray-900 data-[state=active]:text-white"
          >
            All
          </TabsTrigger>
          {visibleTopics.map((t) => (
            <TabsTrigger
              key={t.slug}
              value={t.slug}
              className="border bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-700 shadow-none data-[state=active]:border-gray-900 data-[state=active]:bg-gray-900 data-[state=active]:text-white"
            >
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {articles.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      ) : (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No published articles in this topic yet — check back soon.
        </p>
      )}
    </div>
  );
}
