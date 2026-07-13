'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Text } from '@/design-system/typography/text';
import { Article } from '../types';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, User } from 'lucide-react';
import { TagList } from './TagList';
import { authors } from '@/config/authors';

interface ArticleHeaderProps {
  article: Article;
}

// Pinned to UTC so the formatted string is identical on the server (SSR) and
// in the browser (hydration) regardless of either side's local timezone —
// `date-fns`/`toLocaleDateString` without an explicit timeZone resolve the
// calendar date from the executing environment's local time, which can put
// the server and a visitor's browser on different calendar days for the same
// instant and throw a React hydration-mismatch error (#418).
const publishedDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

/**
 * Renders the top portion of an article, including metadata and featured image.
 */
export const ArticleHeader = ({ article }: ArticleHeaderProps) => {
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

        <Text variant="h4" className="text-muted-foreground font-normal italic leading-relaxed">
          {article.description}
        </Text>

        <div className="flex flex-wrap items-center gap-6 pt-6 text-muted-foreground border-y py-4 mt-8">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            <Text variant="bodySmall" className="font-medium">
              By{' '}
              {(() => {
                // Prefer the author this article is actually tagged with
                // (customFields.authorSlug); fall back to the site's default author.
                const slug = article.authorSlug || authors[0]?.slug;
                const name = article.authorName || authors[0]?.name || 'Imperialpedia';
                return slug ? (
                  <Link href={`/authors/${slug}`} className="text-foreground hover:text-primary transition-colors">
                    {name}
                  </Link>
                ) : (
                  <span className="text-foreground">{name}</span>
                );
              })()}
            </Text>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <Text variant="bodySmall">
              {article.publishedAt ? publishedDateFormatter.format(new Date(article.publishedAt)) : 'Recently'}
            </Text>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <Text variant="bodySmall">
              {article.readingTime} min read
            </Text>
          </div>
        </div>
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
