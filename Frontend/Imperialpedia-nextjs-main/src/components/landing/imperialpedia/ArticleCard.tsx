import React from "react";
import Link from "next/link";
import Image from "next/image";
import type { Article } from "./types";
import { CategoryBadge } from "@/components/common/CategoryBadge";

type Props = {
  article: Article;
  /** card = image-top stacked (default); row = compact horizontal */
  variant?: "card" | "row";
};

/**
 * Editorial article card — category eyebrow, serif headline, image-top.
 * Mirrors Imperialpedia's content-card pattern (squared corners, hairline rules).
 */
export function ArticleCard({ article, variant = "card" }: Props) {
  if (variant === "row") {
    return (
      <Link href={article.href} className="group flex gap-3.5 py-3 border-b-2 border-black/10 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/30 p-2 rounded-xs transition-colors">
        <div className="relative h-16 w-24 flex-shrink-0 overflow-hidden border-2 border-black dark:border-slate-700 bg-muted">
          <Image
            src={article.image}
            alt={article.title}
            fill
            sizes="96px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1">
            <CategoryBadge category={article.category} />
          </div>
          <h4 className="text-sm font-black font-serif uppercase leading-tight text-black dark:text-white group-hover:text-[#c8102e] transition-colors line-clamp-2">
            {article.title}
          </h4>
        </div>
      </Link>
    );
  }

  return (
    <Link href={article.href} className="group block bg-white dark:bg-slate-900 border-3 border-black dark:border-slate-700 p-3.5 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[7px_7px_0px_0px_rgba(200,16,46,1)] transition-all relative">
      <div className="relative aspect-[16/10] w-full overflow-hidden border-2 border-black dark:border-slate-700 bg-muted">
        <Image
          src={article.image}
          alt={article.title}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="pt-3.5 space-y-1.5">
        <div className="flex items-center gap-2">
          <CategoryBadge category={article.category} />
        </div>
        <h3 className="text-base sm:text-lg font-black uppercase font-serif leading-tight text-black dark:text-white group-hover:text-[#c8102e] transition-colors line-clamp-3">
          {article.title}
        </h3>
        {article.dek && (
          <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 line-clamp-2 leading-snug">{article.dek}</p>
        )}
      </div>
    </Link>
  );
}
