'use client';

import React from 'react';
import { Article } from '../types';
import { ArticleList } from './ArticleList';
import { Text } from '@/design-system/typography/text';
import { SearchX } from 'lucide-react';

interface SearchResultsProps {
  results: Article[];
  query: string;
}

/**
 * Displays the results of a search operation.
 * Reuses the ArticleList for consistent grid rendering.
 */
export const SearchResults = ({ results, query }: SearchResultsProps) => {
  if (query.trim().length < 2) {
    return null;
  }

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <SearchX className="h-8 w-8 text-muted-foreground" />
        </div>
        <Text variant="h3">No intelligence found for "{query}"</Text>
        <Text variant="body" className="text-muted-foreground max-w-md">
          We couldn't find any articles matching your search criteria. Try using different keywords or browsing our topic index.
        </Text>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between border-b pb-4">
        <Text variant="h4">
          Search Results <span className="text-muted-foreground ml-2 text-lg">({results.length})</span>
        </Text>
      </div>
      <ArticleList articles={results} />
    </div>
  );
};
