"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

type Variant = 'lead' | 'default' | 'horizontal';

interface StoryCardProps {
  article: any;
  variant?: Variant;
  priority?: boolean;
}

function imageUrl(article: any, w: number, h: number): string {
  const seed = article?.imageSeed || article?.id || article?.slug || 'lawelite';
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`;
}

function Kicker({ article }: { article: any }) {
  const name = article?.category?.name;
  if (!name) return null;
  return <span className="kicker mb-2">{name}</span>;
}

function Byline({ article }: { article: any }) {
  const author = article?.author;
  const date = article?.updatedAt || article?.updated_at;
  const reading = article?.readingTime;
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-slate-500 font-medium">
      {author && <span className="text-slate-700 font-semibold">{author}</span>}
      {author && date && <span className="text-slate-300">·</span>}
      {date && <span>{date}</span>}
      {reading ? (
        <span className="inline-flex items-center gap-1 text-slate-400">
          <Clock className="w-3 h-3" /> {reading} min read
        </span>
      ) : null}
    </div>
  );
}

/**
 * Editorial story card. The newsroom workhorse used across the homepage in
 * three densities: a hero `lead`, a stacked `default`, and a `horizontal`
 * thumbnail row.
 */
export function StoryCard({ article, variant = 'default', priority = false }: StoryCardProps) {
  if (!article) return null;
  const href = `/article/${article.slug}`;

  if (variant === 'lead') {
    return (
      <Link href={href} className="group block">
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg bg-slate-100">
          <Image
            src={imageUrl(article, 1200, 675)}
            alt={article.title}
            fill
            priority={priority}
            sizes="(max-width: 1024px) 100vw, 66vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
        </div>
        <div className="pt-5">
          <Kicker article={article} />
          <h2 className="font-headline text-2xl md:text-4xl font-extrabold leading-[1.1] text-slate-900 group-hover:text-news-600 transition-colors tracking-tight">
            {article.title}
          </h2>
          {article.summary && (
            <p className="mt-3 text-[1.05rem] leading-relaxed text-slate-600 line-clamp-2 max-w-2xl">
              {article.summary}
            </p>
          )}
          <div className="mt-4">
            <Byline article={article} />
          </div>
        </div>
      </Link>
    );
  }

  if (variant === 'horizontal') {
    return (
      <Link href={href} className="group flex gap-4 items-start">
        <div className="relative w-28 h-20 sm:w-32 sm:h-24 shrink-0 overflow-hidden rounded-md bg-slate-100">
          <Image
            src={imageUrl(article, 320, 240)}
            alt={article.title}
            fill
            sizes="128px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <div className="min-w-0">
          <Kicker article={article} />
          <h3 className="font-headline text-[15px] sm:text-base font-bold leading-snug text-slate-900 group-hover:text-news-600 transition-colors line-clamp-3">
            {article.title}
          </h3>
          <div className="mt-1.5">
            <Byline article={article} />
          </div>
        </div>
      </Link>
    );
  }

  // default — stacked card
  return (
    <Link href={href} className="group flex flex-col h-full">
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg bg-slate-100">
        <Image
          src={imageUrl(article, 640, 400)}
          alt={article.title}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
        />
      </div>
      <div className="pt-4 flex flex-col flex-1">
        <Kicker article={article} />
        <h3 className="font-headline text-lg md:text-xl font-bold leading-snug text-slate-900 group-hover:text-news-600 transition-colors line-clamp-3">
          {article.title}
        </h3>
        {article.summary && (
          <p className="mt-2 text-[14px] leading-relaxed text-slate-500 line-clamp-2 flex-1">
            {article.summary}
          </p>
        )}
        <div className="mt-3 pt-3 border-t border-slate-100">
          <Byline article={article} />
        </div>
      </div>
    </Link>
  );
}
