import React from "react";
import type { Article as LandingArticle } from "@/components/landing/imperialpedia/types";
import { HomeSectionHeading } from "./HomeSectionHeading";
import { ArticleCard } from "@/components/landing/imperialpedia/ArticleCard";

interface LatestArticlesProps {
  articles: LandingArticle[];
}

/**
 * "Latest Articles" rail — Imperialpedia tabloid grid with black border frames and hard shadows.
 */
export function LatestArticles({ articles }: LatestArticlesProps) {
  if (articles.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 border-t-2 border-black dark:border-slate-800">
      <HomeSectionHeading title="LATEST ARTICLES" href="/financial-intelligence" hrefLabel="ALL LATEST →" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {articles.map((article) => (
          <ArticleCard key={article.href} article={article} />
        ))}
      </div>
    </section>
  );
}
