"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { resolveArticleImage } from '@/lib/article-art';
import { articleUrl } from '@/lib/article-url';
import { formatArticleDate } from '@/lib/format-date';

type Variant = 'lead' | 'default' | 'horizontal';

interface StoryCardProps {
  article: any;
  variant?: Variant;
  priority?: boolean;
}

function Kicker({ article }: { article: any }) {
  const name = article?.category?.name || article?.categoryName || 'PAGE SIX / LAW ELITE';
  return (
    <span className="inline-block bg-[#E13131] text-white text-[10px] font-black uppercase tracking-[0.18em] px-2.5 py-0.5 mb-2 rounded-sm shadow-sm">
      {name}
    </span>
  );
}

function Byline({ article }: { article: any }) {
  const author = article?.author || 'Page Six Editorial';
  const date = formatArticleDate(article?.updatedAt || article?.publishedAt);
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-slate-500 font-semibold uppercase tracking-wider">
      <span className="text-[#E13131] font-bold">By {author}</span>
      {date && (
        <>
          <span className="text-slate-300">·</span>
          <span className="text-slate-500">{date}</span>
        </>
      )}
    </div>
  );
}

/**
 * Page Six / NY Post Editorial Story Card.
 * High-impact tabloid media styling with bold serif headlines, fiery red category badges, and crisp image containers.
 */
export function StoryCard({ article, variant = 'default', priority = false }: StoryCardProps) {
  if (!article) return null;
  const href = articleUrl(article);

  if (variant === 'lead') {
    return (
      <Link href={href} className="group block border-b-2 border-slate-900 pb-6">
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-900 rounded-sm shadow-md ring-1 ring-slate-900/10">
          <Image
            src={resolveArticleImage(article)}
            alt={article.title}
            fill
            priority={priority}
            sizes="(max-width: 1024px) 100vw, 66vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.03] opacity-95 group-hover:opacity-100"
          />
          <div className="absolute top-3 left-3 z-10">
            <Kicker article={article} />
          </div>
        </div>
        <div className="pt-4">
          <h2 className="font-serif text-3xl sm:text-4xl md:text-[2.65rem] font-black leading-[1.05] text-slate-900 group-hover:text-[#E13131] transition-colors tracking-tight">
            {article.title}
          </h2>
          {article.summary && (
            <p className="mt-3 text-[1.05rem] leading-relaxed text-slate-700 font-serif line-clamp-3">
              {article.summary}
            </p>
          )}
          <div className="mt-4 pt-3 border-t border-slate-200">
            <Byline article={article} />
          </div>
        </div>
      </Link>
    );
  }

  if (variant === 'horizontal') {
    return (
      <Link href={href} className="group flex gap-4 items-start py-3 border-b border-slate-100 hover:bg-slate-50/80 p-2 rounded-sm transition-colors">
        <div className="relative w-28 h-20 sm:w-36 sm:h-24 shrink-0 overflow-hidden rounded-sm bg-slate-900 ring-1 ring-slate-200">
          <Image
            src={resolveArticleImage(article)}
            alt={article.title}
            fill
            sizes="144px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <div className="min-w-0 flex-1">
          <Kicker article={article} />
          <h3 className="font-serif text-[15px] sm:text-base font-bold leading-snug text-slate-900 group-hover:text-[#E13131] group-hover:underline transition-colors line-clamp-2">
            {article.title}
          </h3>
          <div className="mt-1.5">
            <Byline article={article} />
          </div>
        </div>
      </Link>
    );
  }

  // default — stacked card (NY Post grid style)
  return (
    <Link href={href} className="group flex flex-col h-full border border-slate-200 rounded-sm p-3 bg-white hover:border-[#E13131] hover:shadow-md transition-all">
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-sm bg-slate-900">
        <Image
          src={resolveArticleImage(article)}
          alt={article.title}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
        />
        <div className="absolute top-2 left-2 z-10">
          <Kicker article={article} />
        </div>
      </div>
      <div className="pt-3 flex flex-col flex-1">
        <h3 className="font-serif text-lg md:text-[1.35rem] font-bold leading-snug text-slate-900 group-hover:text-[#E13131] transition-colors line-clamp-3">
          {article.title}
        </h3>
        {article.summary && (
          <p className="mt-2 text-[13.5px] leading-relaxed text-slate-600 font-serif line-clamp-2 flex-1">
            {article.summary}
          </p>
        )}
        <div className="mt-3 pt-2.5 border-t border-slate-100">
          <Byline article={article} />
        </div>
      </div>
    </Link>
  );
}
