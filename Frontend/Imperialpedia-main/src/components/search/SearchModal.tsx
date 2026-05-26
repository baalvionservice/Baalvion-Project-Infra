'use client';

import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { SearchBar } from './SearchBar';
import { SearchResults } from './SearchResults';
import { SearchResult } from '@/types/search';
import { Command } from 'lucide-react';

/**
 * Command-style Search Modal for global discovery.
 */
export const SearchModal = ({ open, onOpenChange }: { open: boolean; onOpenChange: (val: boolean) => void }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Reset query on close
  useEffect(() => {
    if (!open) {
      setTimeout(() => setQuery(''), 300);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden bg-card border-white/10 shadow-3xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Global Search Matrix</DialogTitle>
          <DialogDescription>
            Search across millions of institutional knowledge nodes.
          </DialogDescription>
        </DialogHeader>
        <div className="p-4 border-b border-white/5">
          <SearchBar 
            value={query} 
            onChange={setQuery} 
            autoFocus 
            placeholder="Type to search our millions of nodes..."
          />
        </div>
        <div className="max-h-[60vh] overflow-y-auto no-scrollbar">
          <SearchResults 
            results={results} 
            loading={loading} 
            query={query} 
            onItemClick={() => onOpenChange(false)} 
          />
        </div>
        <div className="p-4 bg-muted/20 border-t border-white/5 flex items-center justify-between">
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase">
              <span className="p-1 rounded bg-background border border-white/10">ESC</span> Close
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase">
              <span className="p-1 rounded bg-background border border-white/10">↵</span> Navigate
            </div>
          </div>
          <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase">
            <Command size={12} /> Search Engine Active
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
