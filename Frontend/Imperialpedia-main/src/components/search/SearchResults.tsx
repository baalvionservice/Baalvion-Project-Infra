import React from 'react';
import { SearchResultItem } from './SearchResultItem';
import { Text } from '@/design-system/typography/text';
import { SearchResult } from '@/types/search';
import { Loader2, SearchX } from 'lucide-react';

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
        <Text variant="caption" className="animate-pulse uppercase tracking-widest font-bold">Scanning Knowledge Index...</Text>
      </div>
    );
  }

  if (query && results.length === 0) {
    return (
      <div className="p-12 text-center flex flex-col items-center gap-4 bg-muted/20 rounded-2xl mx-4 my-2 border-2 border-dashed">
        <SearchX className="w-10 h-10 text-muted-foreground opacity-50" />
        <div>
          <Text variant="bodySmall" weight="bold">No results found for "{query}"</Text>
          <Text variant="caption" className="text-muted-foreground mt-1">Try a different financial node or taxonomy.</Text>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2 space-y-1">
      <div className="px-4 py-2">
        <Text variant="label" className="text-[9px] opacity-50 tracking-[0.2em]">Top Findings</Text>
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
