import React from 'react';
import { SearchResultItem } from './SearchResultItem';
import { Text } from '@/design-system/typography/text';
import { SearchResult } from '@/types/search';
import { Loader2 } from 'lucide-react';

interface SearchResultsProps {
  results: SearchResult[];
  loading?: boolean;
  onItemClick?: () => void;
  query?: string;
}

export const SearchResults = ({ results, loading, onItemClick, query }: SearchResultsProps) => {
  if (loading) {
    return (
      <div className="p-12 text-center flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <Text variant="caption" className="animate-pulse uppercase tracking-widest font-bold">Searching...</Text>
      </div>
    );
  }

  if (query && results.length === 0) {
    // CNBC-style no-results state: plain editorial text behind a red rule,
    // not a rounded dashed-border card with a big icon — matches the rest
    // of the site's CNBC re-theme (see components/cnbc/TopNav.tsx) instead
    // of reading like a generic SaaS empty state.
    return (
      <div className="px-4 py-10 border-t-2 border-[hsl(var(--cnbc-red))]">
        <Text variant="label" className="text-[hsl(var(--cnbc-red))] text-[10px] font-bold uppercase tracking-[0.2em]">
          No Results
        </Text>
        <Text variant="bodySmall" weight="bold" className="mt-2">
          No results found for &ldquo;{query}&rdquo;
        </Text>
        <Text variant="caption" className="text-muted-foreground mt-1">
          Try a different term, or see full results on the search page.
        </Text>
      </div>
    );
  }

  return (
    <div className="p-2 space-y-1">
      <div className="px-4 py-2">
        <Text variant="label" className="text-[9px] opacity-50 tracking-[0.2em]">Results</Text>
      </div>
      {results.map((result) => (
        <SearchResultItem 
          key={result.id} 
          {...result} 
          onClick={onItemClick} 
        />
      ))}
    </div>
  );
};
