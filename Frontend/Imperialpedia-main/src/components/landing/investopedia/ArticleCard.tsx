import React from "react";
import Link from "next/link";
import Image from "next/image";
import type { Article } from "./types";

const img = (seed: string, w: number, h: number) =>
  `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`;

type Props = {
  article: Article;
  /** card = image-top stacked (default); row = compact horizontal */
  variant?: "card" | "row";
};

/**
 * Editorial article card — category eyebrow, serif headline, image-top.
 * Mirrors Investopedia's content-card pattern (squared corners, hairline rules).
 */
export function ArticleCard({ article, variant = "card" }: Props) {
  if (variant === "row") {
    return (
      <Link href={article.href} className="group flex gap-3 py-3 border-b border-border last:border-0">
        <div className="relative h-16 w-24 flex-shrink-0 overflow-hidden bg-muted">
          <Image
            src={img(article.imageSeed, 240, 160)}
            alt=""
            fill
            sizes="96px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        <div className="min-w-0">
          <span className="eyebrow">{article.category}</span>
          <h4 className="mt-0.5 text-sm font-bold leading-snug text-foreground group-hover:text-primary line-clamp-3">
            {article.title}
          </h4>
        </div>
      </Link>
    );
  }

  return (
    <Link href={article.href} className="group block">
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
        <Image
          src={img(article.imageSeed, 800, 450)}
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="pt-3">
        <span className="eyebrow">{article.category}</span>
        <h3 className="mt-1 text-lg font-bold leading-tight text-foreground group-hover:text-primary line-clamp-3">
          {article.title}
        </h3>
        {article.dek && (
          <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">{article.dek}</p>
        )}
      </div>
    </Link>
  );
}

export default ArticleCard;
