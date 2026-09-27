'use client';

import React from 'react';
import { Grid } from '@/design-system/layout/grid';
import { Text } from '@/design-system/typography/text';
import { Article } from '../types';
import { ArticleCard } from './ArticleCard';
import { BookOpen } from 'lucide-react';

interface ArticleListProps {
  articles: Article[];
}

/**
 * Renders a responsive grid of article cards.
 */
export const ArticleList = ({ articles }: ArticleListProps) => {
  if (!articles || articles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <BookOpen className="h-8 w-8 text-muted-foreground" />
        </div>
        <Text variant="h3">No articles found</Text>
        <Text variant="body" className="text-muted-foreground max-w-md">
          Our content engine is currently being populated with fresh financial insights. Please check back shortly.
        </Text>
      </div>
    );
  }

  return (
    <Grid columns={{ sm: 1, md: 2, lg: 3 }} gap="lg">
      {articles.map((article) => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </Grid>
  );
};
