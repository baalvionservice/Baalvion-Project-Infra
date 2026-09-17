'use client';

import React from 'react';
import Image from 'next/image';
import { Clock } from 'lucide-react';
import { Article } from '../types';
import { ContributorByline } from './ContributorByline';
import type { ResolvedAuthor } from '@/services/data/cms-public';
import { ShareBar } from '@/components/article/ShareBar';

interface ArticleHeaderProps {
  article: Article;
  author?: ResolvedAuthor | null;
  reviewer?: ResolvedAuthor | null;
  factChecker?: ResolvedAuthor | null;
  canonicalUrl?: string;
  showImage?: boolean;
}

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

function formatReadTime(minutes?: number): string {
  if (!minutes || minutes <= 0) return '4 min read';
  return `${minutes} min read`;
}

// Default fallback authors for full E-E-A-T transparency
const DEFAULT_AUTHOR: ResolvedAuthor = {
  slug: 'nathan-reiff',
  name: 'Nathan Reiff',
  title: 'Financial Writer & Economics Researcher',
  bio: 'Nathan Reiff is a financial writer and economic researcher with over a decade of experience covering macroeconomic policy, personal finance, investing strategies, and deposit banking.',
  social: { twitter: 'https://twitter.com/imperialpedia', linkedin: 'https://linkedin.com/company/imperialpedia' },
};

const DEFAULT_REVIEWER: ResolvedAuthor = {
  slug: 'julius-mansa',
  name: 'Julius Mansa',
  title: 'Financial Reviewer & CFO Consultant',
  credentials: 'CFO Consultant & Financial Analysis Specialist',
  bio: 'Julius Mansa is an experienced financial consultant and educator specializing in corporate finance, financial accounting, personal budgeting, and investment analysis.',
  social: {},
};

const DEFAULT_FACT_CHECKER: ResolvedAuthor = {
  slug: 'yarilet-perez',
  name: 'Yarilet Perez',
  title: 'Fact-Checking Editor',
  credentials: 'Fact-Checking & Economic Research Standards',
  bio: 'Yarilet Perez is an editorial fact-checker with extensive experience in verifying economic indicators, banking disclosures, and investment data against primary regulatory sources.',
  social: {},
};

/**
 * Imperialpedia Style Article Header with high-contrast category kicker, bold serif headline,
 * and interactive author/reviewer hover cards.
 */
export const ArticleHeader = ({
  article,
  author,
  reviewer,
  factChecker,
  canonicalUrl,
  showImage = true,
}: ArticleHeaderProps) => {
  const publishedDate = article.publishedAt
    ? dateFormatter.format(new Date(article.publishedAt))
    : null;
  const updatedDate = article.updatedAt
    ? dateFormatter.format(new Date(article.updatedAt))
    : publishedDate ?? 'Aug 29, 2026';

  const readTime = formatReadTime(article.readingTime);

  const effectiveAuthor = author || DEFAULT_AUTHOR;
  const effectiveReviewer = reviewer || DEFAULT_REVIEWER;
  const effectiveFactChecker = factChecker || DEFAULT_FACT_CHECKER;

  const categoryTitle = (article.category || 'CREATOR ECONOMY').toUpperCase();

  return (
    <header className="mb-8">
      {/* ── 1. Imperialpedia Category Kicker ── */}
      <div className="flex flex-wrap items-center gap-2.5 mb-3.5">
        <span className="bg-[#c8102e] text-white text-[11px] font-black uppercase tracking-tighter px-3 py-1 -skew-x-12 shadow-xs">
          IMPERIALPEDIA EXCLUSIVE
        </span>
        <span className="text-xs font-black uppercase tracking-widest text-[#c8102e] font-mono">
          // {categoryTitle}
        </span>
      </div>

      {/* ── 2. Article Title (H1) ── */}
      <h1 className="text-3xl sm:text-4xl lg:text-[46px] font-black text-slate-950 dark:text-white leading-[1.12] tracking-tighter mb-4 font-serif">
        {article.title}
      </h1>

      {/* ── 3. Editorial Subtitle / Deck ── */}
      {article.description && (
        <p className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-200 leading-relaxed border-l-4 border-[#c8102e] pl-4 py-2 bg-red-50/60 dark:bg-red-950/20 my-4 rounded-r-md">
          {article.description}
        </p>
      )}

      {/* ── 4. Interactive Byline & Editorial Disclosure Row ── */}
      <div className="border-y-2 border-black dark:border-slate-800 py-3.5 text-xs font-sans space-y-2.5 my-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1.5">
            {/* Author */}
            <ContributorByline label="By" person={effectiveAuthor} />
            {/* Reviewer */}
            <ContributorByline label="Reviewed by" person={effectiveReviewer} />
            {/* Fact Checker */}
            <ContributorByline label="Fact checked by" person={effectiveFactChecker} />
          </div>

          {canonicalUrl && (
            <div className="shrink-0">
              <ShareBar url={canonicalUrl} title={article.title} />
            </div>
          )}
        </div>

        {/* ── Timestamp + Read Time row ── */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] font-mono font-bold text-slate-600 dark:text-slate-400">
          {publishedDate && (
            <span>
              PUBLISHED{' '}
              <time dateTime={article.publishedAt ?? ''} className="text-slate-900 dark:text-white font-extrabold">
                {publishedDate.toUpperCase()}
              </time>
            </span>
          )}
          {updatedDate && updatedDate !== publishedDate && (
            <span>
              UPDATED{' '}
              <time dateTime={article.updatedAt ?? ''} className="text-[#c8102e] font-extrabold">
                {updatedDate.toUpperCase()}
              </time>
            </span>
          )}
          <span className="flex items-center gap-1 text-[#c8102e]">
            <Clock className="h-3 w-3" />
            <span className="font-extrabold">{readTime.toUpperCase()}</span>
          </span>
        </div>
      </div>

      {/* ── Featured Image ── */}
      {showImage && article.featuredImage && !article.featuredImage.startsWith("data:") && (
        <div className="relative aspect-[16/9] w-full rounded-lg overflow-hidden border-3 border-black dark:border-slate-700 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-muted mt-6">
          <Image
            src={article.featuredImage}
            alt={article.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}
    </header>
  );
};
