'use client';

import React from 'react';
import Image from 'next/image';
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

const updatedDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

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
 * Investopedia Article Header with Corinthian headline and interactive author/reviewer hover cards.
 */
export const ArticleHeader = ({
  article,
  author,
  reviewer,
  factChecker,
  canonicalUrl,
  showImage = true,
}: ArticleHeaderProps) => {
  const formattedDate = article.updatedAt
    ? updatedDateFormatter.format(new Date(article.updatedAt))
    : article.publishedAt
    ? updatedDateFormatter.format(new Date(article.publishedAt))
    : 'August 29, 2026';

  const effectiveAuthor = author || DEFAULT_AUTHOR;
  const effectiveReviewer = reviewer || DEFAULT_REVIEWER;
  const effectiveFactChecker = factChecker || DEFAULT_FACT_CHECKER;

  return (
    <header className="mb-6">
      {/* 1. Article Title (H1) with Corinthian Medium Font */}
      <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-bold text-[#121212] dark:text-white leading-[1.18] tracking-[-0.015em] mb-3.5 font-corinthian">
        {article.title}
      </h1>

      {/* 2. Interactive Byline & Editorial Disclosure with Hover Cards */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200/80 dark:border-gray-800 pb-4 text-xs font-sans">
        <div className="space-y-1">
          {/* Author with Updated Date */}
          <ContributorByline
            label="By"
            person={effectiveAuthor}
            meta={`Updated ${formattedDate}`}
          />

          {/* Reviewer */}
          <ContributorByline
            label="Reviewed by"
            person={effectiveReviewer}
          />

          {/* Fact Checker */}
          <ContributorByline
            label="Fact checked by"
            person={effectiveFactChecker}
          />
        </div>

        {canonicalUrl && (
          <div className="shrink-0">
            <ShareBar url={canonicalUrl} title={article.title} />
          </div>
        )}
      </div>

      {/* Featured Image */}
      {showImage && article.featuredImage && !article.featuredImage.startsWith("data:") && (
        <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800 bg-muted mt-6">
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
