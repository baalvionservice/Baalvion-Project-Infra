"use client";

import Image from "next/image";
import Link from "next/link";

import type { NewsArticle, NewsCategory } from "@/lib/data.news";
import { formatDate } from "@/services/format-date";
import { CATEGORY_COLORS } from "@/lib/utils/categories-colors";
import { newsArticleHref } from "@/lib/data/article-url";

export function CategoryBadge({ category, label }: { category: NewsCategory; label?: string }) {
  return (
    <span
      className={`inline-block w-fit text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded ${CATEGORY_COLORS[category]}`}
    >
      {label ?? category}
    </span>
  );
}

export function ArticleCard({
  article,
  categoryLabel,
}: {
  article: NewsArticle;
  /** Overrides the badge text (e.g. the current topic page's title) without changing article.category. */
  categoryLabel?: string;
}) {
  return (
    <Link href={newsArticleHref(article)} className="group flex flex-col">
      <div className="relative w-full aspect-[16/9] overflow-hidden rounded-xl mb-3">
        <Image
          src={article.imageUrl}
          alt={article.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
      </div>
      <div className="flex flex-col flex-1 space-y-2">
        <CategoryBadge category={article.category} label={categoryLabel} />
        <h3 className="text-base font-bold text-foreground leading-snug group-hover:text-blue-600 transition-colors line-clamp-3">
          {article.title}
        </h3>
        <p className="text-sm text-gray-500 line-clamp-2 flex-1">
          {article.excerpt}
        </p>
        <p className="text-xs text-gray-400">
          By {article.author.name} · {formatDate(article.publishedAt)}
        </p>
      </div>
    </Link>
  );
}
