'use client';

import React from 'react';
import Image from 'next/image';
import { Text } from '@/design-system/typography/text';
import { Article } from '../types';
import { Badge } from '@/components/ui/badge';
import { TagList } from './TagList';
import { ContributorByline } from './ContributorByline';
import type { ResolvedAuthor } from '@/services/data/cms-public';

interface ArticleHeaderProps {
  article: Article;
  /** Full CMS profiles (bio/title/avatar) for the byline hover-cards. */
  author?: ResolvedAuthor | null;
  reviewer?: ResolvedAuthor | null;
  factChecker?: ResolvedAuthor | null;
}

// Pinned to UTC so the formatted string is identical on the server (SSR) and
// in the browser (hydration) regardless of either side's local timezone —
// see the #418 hydration-mismatch note this guarded against before.
const updatedDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

/**
 * Renders the top portion of an article, including metadata and featured image.
 */
export const ArticleHeader = ({ article, author, reviewer, factChecker }: ArticleHeaderProps) => {
  return (
    <header className="mb-12">
      <div className="space-y-4 mb-8">
        <div className="flex flex-wrap gap-4 items-center mb-6">
          <Badge variant="secondary" className="bg-primary/20 text-primary hover:bg-primary/30 font-bold uppercase tracking-widest text-[10px] py-1">
            {article.category}
          </Badge>
          <TagList tags={article.tags} />
        </div>

        <Text variant="h1" as="h1" className="text-4xl lg:text-6xl font-bold tracking-tight">
          {article.title}
        </Text>

        <Text variant="body" className="text-muted-foreground font-normal leading-relaxed text-lg lg:text-xl">
          {article.description}
        </Text>

        {author ? (
          <div className="space-y-1 pt-2 pb-2">
            <ContributorByline
              label="By"
              person={author}
              meta={article.updatedAt ? `Updated ${updatedDateFormatter.format(new Date(article.updatedAt))}` : undefined}
            />
            <ContributorByline label="Reviewed by" person={reviewer} />
            <ContributorByline label="Fact checked by" person={factChecker} />
          </div>
        ) : null}
      </div>

      {article.featuredImage && (
        <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden shadow-2xl border bg-muted group mt-12">
          <Image
            src={article.featuredImage}
            alt={article.title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            priority
          />
        </div>
      )}
    </header>
  );
};
