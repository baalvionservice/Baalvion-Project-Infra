"use client";

import Image from "next/image";
import Link from "next/link";

import { formatDate } from "@/services/format-date";
import { StocksArticle } from "@/lib/data/data.stocks";
import { StocksCategory } from "./stocks-tab";

const CATEGORY_COLORS: Record<StocksCategory, string> = {
  "Growth Stocks": "bg-green-500/10 text-green-600 dark:text-green-400",
  "Trending Stocks": "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  "Value Stocks": "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  "Tech Stocks": "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  "Top Stocks": "bg-muted text-muted-foreground",
  "Dividend Stocks": "bg-pink-500/10 text-pink-600 dark:text-pink-400",
};

function CategoryBadge({ category }: { category: StocksArticle["category"] }) {
  return (
    <span
      className={`inline-block  w-fit  text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded ${CATEGORY_COLORS[category]}`}
    >
      {category}
    </span>
  );
}

export function StocksArticleCard({ article }: { article: StocksArticle }) {
  return (
    <Link href={`/${article.slug}`} className="group flex flex-col">
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
        <CategoryBadge category={article.category} />
        <h3 className="text-base font-bold text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-3">
          {article.title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2 flex-1">
          {article.excerpt}
        </p>
        <p className="text-xs text-muted-foreground">
          By {article.author.name} · {formatDate(article.publishedAt)}
        </p>
      </div>
    </Link>
  );
}
