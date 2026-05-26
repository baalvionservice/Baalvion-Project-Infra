"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

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
import {
  MAIN_TABS_STOCKS,
  MORE_CATEGORIES_STOCKS,
  StocksCategory,
} from "./stocks-tab";
import { StocksArticle } from "@/lib/data/data.stocks";
import { StocksArticleCard } from "./StocksArticleCard";

type ExploreValue =
  | "all"
  | "markets"
  | "company"
  | "crypto"
  | "personal-finance"
  | "more";

function filterByCategory(
  articles: StocksArticle[],
  category: StocksCategory | "All"
) {
  if (category === "All") return articles;
  return articles.filter((a) => a.category === category);
}

export function ExploreStocksSection({
  articles,
}: {
  articles: StocksArticle[];
}) {
  const [tab, setTab] = React.useState<ExploreValue>("all");
  const [selectedCategory, setSelectedCategory] = React.useState<
    StocksCategory | "All"
  >("All");

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

            const main = MAIN_TABS_STOCKS.find((t) => t.value === nextTab);
            if (main) setSelectedCategory(main.category);
          }}
          className="w-full"
        >
          <TabsList className="w-full justify-start bg-transparent p-0 h-auto flex-wrap gap-2">
            {MAIN_TABS_STOCKS.map((t) => (
              <TabsTrigger
                key={t.value}
                value={t.value}
                className="border bg-card px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground shadow-none data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {t.label}
              </TabsTrigger>
            ))}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="border bg-card px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:bg-muted"
                  onClick={() => setTab("more")}
                >
                  More <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuRadioGroup
                  value={selectedCategory === "All" ? "" : selectedCategory}
                  onValueChange={(v) => {
                    const cat = v as StocksCategory;
                    setTab("more");
                    setSelectedCategory(cat);
                  }}
                >
                  {MORE_CATEGORIES_STOCKS.map((cat) => (
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
          <StocksArticleCard key={article.id} article={article} />
        ))}
      </div>
    </div>
  );
}
