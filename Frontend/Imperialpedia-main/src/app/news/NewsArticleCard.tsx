"use client";

import Image from "next/image";
import Link from "next/link";
import type { NewsArticle, NewsCategory } from "@/lib/data.news";
import { formatDate } from "@/services/format-date";
import { newsArticleHref } from "@/lib/data/article-url";

export function CategoryBadge({
  category,
  label,
}: {
  category: NewsCategory;
  label?: string;
}) {
  return (
    <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-[#1d4fc4]">
      {label ?? category}
    </span>
  );
}

/**
 * Investopedia-style article card:
 * High-quality 16:9 image, blue uppercase tag, bold headline with hover state,
 * excerpt, and author byline.
 */
export function ArticleCard({
  article,
  categoryLabel,
}: {
  article: NewsArticle;
  categoryLabel?: string;
}) {
  return (
    <Link href={newsArticleHref(article)} className="group flex flex-col space-y-3">
      <div className="relative w-full aspect-[16/10] overflow-hidden bg-muted">
        <Image
          src={article.imageUrl}
          alt={article.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-102"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
      </div>
      <div className="flex flex-col flex-1 space-y-1.5">
        <CategoryBadge category={article.category} label={categoryLabel} />
        <h3 className="text-base sm:text-lg font-bold text-foreground leading-snug group-hover:text-[#1d4fc4] transition-colors line-clamp-2">
          {article.title}
        </h3>
        {article.excerpt && (
          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed flex-1">
            {article.excerpt}
          </p>
        )}
        <p className="text-xs text-muted-foreground pt-1">
          By {article.author.name}
        </p>
      </div>
    </Link>
  );
}
