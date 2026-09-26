"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

import type { NewsArticle, NewsCategory } from "@/lib/data.news";
import type { SiblingTopic } from "@/lib/topic-config";
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
import { ArticleCard } from "./NewsArticleCard";

type ExploreValue =
  | "all"
  | "markets"
  | "company"
  | "crypto"
  | "personal-finance"
  | "more";

const MAIN_TABS: Array<{
  value: Exclude<ExploreValue, "more">;
  label: string;
  category: NewsCategory | "All";
}> = [
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

function filterBySubtopic(articles: NewsArticle[], subtopicSlug: string) {
  if (subtopicSlug === "all" || !subtopicSlug) return articles;

  const keywordMap: Record<string, string[]> = {
    "youtube-monetization": ["youtube"],
    "instagram-monetization": ["instagram", "sponsorship", "brand-deal"],
    "website-monetization": ["website", "adsense", "page-rpm"],
    "social-media-earnings": ["tiktok", "facebook", "social", "instagram"],
    "creator-guides": ["income-stream", "affiliate", "digital-product", "sponsorship", "business"],
    "creator-tools": ["calculator", "rpm-vs-cpm", "adsense-page-rpm", "tool"],
    "budgeting-basics": ["budget"],
    "fraud-protection": ["fraud", "scam", "canva", "document"],
  };

  const keywords = keywordMap[subtopicSlug] || [subtopicSlug.replace(/-/g, " ")];
  const matched = articles.filter((article) => {
    const haystack = `${article.title} ${article.slug} ${article.excerpt} ${(article.tags || []).join(" ")}`.toLowerCase();
    return keywords.some((kw) => haystack.includes(kw.toLowerCase()));
  });

  return matched.length > 0 ? matched : articles;
}

export function ExploreNewsSection({
  articles,
  categoryLabel,
  subtopics,
  currentSlug,
  showTabs = true,
}: {
  articles: NewsArticle[];
  /** Overrides each card's badge text (e.g. the current topic page's title) without changing article.category. */
  categoryLabel?: string;
  /** Sub-topic list for category hubs (e.g. YouTube Monetization, Instagram Monetization, etc.). */
  subtopics?: SiblingTopic[];
  /** Current page slug. */
  currentSlug?: string;
  /** Whether to show filter tabs. Defaults to true. */
  showTabs?: boolean;
}) {
  const [selectedSubtopic, setSelectedSubtopic] = React.useState<string>("all");
  const [tab, setTab] = React.useState<ExploreValue>("all");
  const [selectedCategory, setSelectedCategory] = React.useState<NewsCategory | "All">("All");

  const filtered = React.useMemo(() => {
    if (subtopics && subtopics.length > 0) {
      return filterBySubtopic(articles, selectedSubtopic);
    }
    if (showTabs) {
      return filterByCategory(articles, selectedCategory);
    }
    return articles;
  }, [articles, subtopics, selectedSubtopic, showTabs, selectedCategory]);

  return (
    <div className="space-y-6">
      {/* ── Subtopic filter tabs for Category Hubs ── */}
      {subtopics && subtopics.length > 0 ? (
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1 border-b border-border/40 pb-3">
          <button
            type="button"
            onClick={() => setSelectedSubtopic("all")}
            className={`border px-4 py-2 text-xs font-semibold uppercase tracking-wider shadow-none transition-colors whitespace-nowrap ${
              selectedSubtopic === "all"
                ? "border-gray-900 bg-gray-900 text-white"
                : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            All
          </button>

          {subtopics.map((s) => {
            const isActive = selectedSubtopic === s.slug || currentSlug === s.slug;
            return (
              <Link
                key={s.slug}
                href={`/${s.slug}`}
                onClick={(e) => {
                  if (selectedSubtopic !== s.slug) {
                    setSelectedSubtopic(s.slug);
                  }
                }}
                className={`border px-4 py-2 text-xs font-semibold uppercase tracking-wider shadow-none transition-colors whitespace-nowrap ${
                  isActive
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {s.label}
              </Link>
            );
          })}
        </div>
      ) : (
        showTabs && (
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
                    className=" border bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-700 shadow-none data-[state=active]:border-gray-900 data-[state=active]:bg-gray-900 data-[state=active]:text-white"
                  >
                    {t.label}
                  </TabsTrigger>
                ))}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className=" border bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-700 hover:bg-gray-50"
                      onClick={() => setTab("more")}
                    >
                      More <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuRadioGroup
                      value={selectedCategory === "All" ? "" : selectedCategory}
                      onValueChange={(v) => {
                        const cat = v as NewsCategory;
                        setTab("more");
                        setSelectedCategory(cat);
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
        )
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {filtered.map((article) => (
          <ArticleCard key={article.id} article={article} categoryLabel={categoryLabel} />
        ))}
      </div>
    </div>
  );
}

