"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, Eye } from 'lucide-react';

interface ArticleCardProps {
  article: any;
}

function imageUrl(article: any): string {
  const seed = article?.imageSeed || article?.id || article?.slug || 'lawelite';
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/640/400`;
}

/**
 * Editorial article card used on category and search result grids.
 * Image-led, with a category kicker, Franklin headline and clean metadata —
 * matching the newsroom homepage aesthetic.
 */
export function ArticleCard({ article }: ArticleCardProps) {
  if (!article) return null;
  const categoryName = article?.category?.name || article?.subcategory?.name;

  return (
    <Link href={`/article/${article.slug}`} className="group flex flex-col h-full">
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg bg-slate-100">
        <Image
          src={imageUrl(article)}
          alt={article.title}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
        />
      </div>

      <div className="pt-4 flex flex-col flex-1">
        {categoryName && <span className="kicker mb-2">{categoryName}</span>}

        <h3 className="font-headline text-lg md:text-xl font-bold leading-snug text-slate-900 group-hover:text-news-600 transition-colors line-clamp-3">
          {article.title}
        </h3>

        {article.summary && (
          <p className="mt-2 text-[14px] leading-relaxed text-slate-500 line-clamp-2 flex-1">
            {article.summary}
          </p>
        )}

        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-4 text-[12px] text-slate-400 font-medium">
          {article.readingTime ? (
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> {article.readingTime} min read
            </span>
          ) : null}
          {article.views ? (
            <span className="inline-flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" /> {Number(article.views).toLocaleString()} views
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
