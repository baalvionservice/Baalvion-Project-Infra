import React from "react";
import Link from "next/link";
import Image from "next/image";
import type { Article as LandingArticle } from "@/components/landing/investopedia/types";
import { HomeSectionHeading } from "./HomeSectionHeading";
import { CategoryBadge } from "@/components/common/CategoryBadge";

interface LatestArticlesProps {
  articles: LandingArticle[];
}

/**
 * "Latest Articles" rail. Presentational only — `articles` is the
 * already-deduped tail of `getHomeEditorial()`'s article pool, so this rail
 * never repeats a headline shown in the lead story or topic sections above it.
 */
export function LatestArticles({ articles }: LatestArticlesProps) {
  if (articles.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 border-t border-border">
      <HomeSectionHeading title="Latest Articles" href="/financial-intelligence" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {articles.map((article) => (
          <Link key={article.href} href={article.href} className="group block">
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
              <Image
                src={article.image}
                alt={article.title}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="pt-3">
              <CategoryBadge category={article.category} />
              <h3 className="mt-1 text-lg font-bold leading-tight text-foreground group-hover:text-primary line-clamp-3">
                {article.title}
              </h3>
              {article.dek && (
                <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">{article.dek}</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default LatestArticles;
