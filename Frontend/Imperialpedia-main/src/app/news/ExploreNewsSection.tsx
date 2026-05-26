"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

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

export function ExploreNewsSection({
  articles,
}: {
  articles: NewsArticle[];
}) {
  const [tab, setTab] = React.useState<ExploreValue>("all");
  const [selectedCategory, setSelectedCategory] = React.useState<NewsCategory | "All">("All");

  const filtered = React.useMemo(
    () => filterByCategory(articles, selectedCategory),
    [articles, selectedCategory]
  );

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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {filtered.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </div>
  );
}

