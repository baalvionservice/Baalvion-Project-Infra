import React from "react";
import Link from "next/link";
import Image from "next/image";
import { articleArtDataUri } from "@baalvion/illustrations";
import { Text } from "@/design-system/typography/text";
import { newsArticleHref } from "@/lib/data/article-url";
import type { MarketAssetRow } from "@/lib/data/marketsLoader";
import type { Article } from "@/modules/content-engine/types/article";

const GREEN = "#0a7d3d";
const RED = "#CC0000";

export interface SearchDefaultData {
  popularSymbols: MarketAssetRow[];
  trending: Article[];
}

function formatDate(value?: string): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

/**
 * Command-palette default state -- shown before the user types anything, so
 * the search box opens onto something useful (live symbols + latest
 * articles) instead of an empty box. Mirrors the "popular symbols + trending
 * headlines" pattern of reference command palettes, but every row here is
 * real site data (the same live market feed and CMS articles the homepage
 * draws from), not placeholder content.
 */
export function SearchDefaultPanel({ data, onItemClick }: { data: SearchDefaultData; onItemClick?: () => void }) {
  const { popularSymbols, trending } = data;

  if (popularSymbols.length === 0 && trending.length === 0) {
    return (
      <div className="p-12 text-center">
        <Text variant="caption" className="text-muted-foreground">
          Start typing to search companies, countries, technologies, and articles.
        </Text>
      </div>
    );
  }

  return (
    <div className="p-2">
      {popularSymbols.length > 0 && (
        <div className="px-2 pt-2 pb-1">
          <Text variant="label" className="px-2 text-[9px] tracking-[0.2em] opacity-50">
            Popular Symbols
          </Text>
          <ul className="mt-1">
            {popularSymbols.map((asset) => {
              const price = asset.current_price != null ? Number(asset.current_price) : null;
              const pct = asset.change_pct_24h != null ? Number(asset.change_pct_24h) : null;
              const up = (pct ?? 0) >= 0;
              return (
                <li key={asset.symbol}>
                  <Link
                    href={`/markets/quote/${asset.symbol}`}
                    onClick={onItemClick}
                    className="flex items-center justify-between gap-3 rounded-xl px-2 py-2 hover:bg-muted/50 transition-colors"
                  >
                    <span className="flex items-baseline gap-2 min-w-0">
                      <span className="text-xs font-bold text-foreground shrink-0">{asset.symbol}</span>
                      <span className="text-xs text-muted-foreground truncate">{asset.name}</span>
                    </span>
                    <span className="flex items-baseline gap-1.5 text-xs font-mono shrink-0">
                      {price != null && (
                        <span className="font-semibold tabular-nums text-foreground">
                          {asset.asset_type === "forex" ? price.toFixed(4) : price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </span>
                      )}
                      {pct != null && (
                        <span className="font-bold tabular-nums" style={{ color: up ? GREEN : RED }}>
                          {up ? "▲" : "▼"} {Math.abs(pct).toFixed(2)}%
                        </span>
                      )}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {trending.length > 0 && (
        <div className="px-2 pt-3 pb-2 border-t border-white/5 mt-1">
          <Text variant="label" className="px-2 text-[9px] tracking-[0.2em] opacity-50">
            Trending
          </Text>
          <ul className="mt-1 space-y-0.5">
            {trending.map((article) => {
              const href = newsArticleHref({
                slug: article.slug,
                publishedAt: article.publishedAt || article.updatedAt,
                contentType: article.contentType,
                categorySlug: article.categorySlug,
              });
              const img =
                article.featuredImage ||
                articleArtDataUri({ title: article.title, category: article.category, seed: article.slug });

              return (
                <li key={article.id}>
                  <Link
                    href={href}
                    onClick={onItemClick}
                    className="group flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-muted/50 transition-colors"
                  >
                    <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                      <Image src={img} alt="" fill sizes="64px" className="object-cover" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2">
                        {article.title}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {formatDate(article.publishedAt || article.updatedAt)}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
