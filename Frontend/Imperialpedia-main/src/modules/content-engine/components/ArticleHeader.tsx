'use client';

import React from 'react';
import Image from 'next/image';
import { Text } from '@/design-system/typography/text';
import { Article } from '../types';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';
import { TagList } from './TagList';

interface ArticleHeaderProps {
  article: Article;
}

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
              Expert: <span className="text-foreground">{article.authorId}</span>
            </Text>
          </div>
          
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <Text variant="bodySmall">
              {article.publishedAt ? format(new Date(article.publishedAt), 'MMMM d, yyyy') : 'Recently'}
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
        <div className="relative aspect-[21/9] w-full rounded-2xl overflow-hidden shadow-2xl border bg-muted group mt-12">
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
