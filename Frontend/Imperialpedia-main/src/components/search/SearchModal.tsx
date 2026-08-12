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
import { SearchDefaultPanel, SearchDefaultData } from './SearchDefaultPanel';
import { SearchResult } from '@/types/search';
import { Text } from '@/design-system/typography/text';
import { Command } from 'lucide-react';

const EMPTY_DEFAULT_DATA: SearchDefaultData = { popularSymbols: [], trending: [] };

/**
 * Command-style Search Modal for global discovery.
 */
export const SearchModal = ({ open, onOpenChange }: { open: boolean; onOpenChange: (val: boolean) => void }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [defaultData, setDefaultData] = useState<SearchDefaultData>(EMPTY_DEFAULT_DATA);
  const [defaultLoading, setDefaultLoading] = useState(false);

  // Popular symbols + trending articles, fetched once when the palette opens
  // so it greets the user with something instead of an empty box.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setDefaultLoading(true);
    fetch('/api/search')
      .then((res) => res.json())
      .then((data: SearchDefaultData) => {
        if (!cancelled) setDefaultData(data);
      })
      .catch(() => {
        if (!cancelled) setDefaultData(EMPTY_DEFAULT_DATA);
      })
      .finally(() => {
        if (!cancelled) setDefaultLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

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
      <DialogContent
        // Anchored near the top instead of the default vertical-center: centering
        // breaks on mobile once the on-screen keyboard shrinks the visual viewport
        // (the dialog's `top: 50%` is computed against the layout viewport, so it
        // ends up partially hidden behind the keyboard). Top-anchoring, like most
        // command palettes, sits clear of the keyboard by construction and never
        // needs to reposition itself when the keyboard opens.
        className="max-w-2xl p-0 overflow-hidden bg-card border-white/10 shadow-3xl top-[6vh] sm:top-[10vh] translate-y-0 max-h-[88vh] flex flex-col"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Search Imperialpedia</DialogTitle>
          <DialogDescription>
            Search companies, countries, technologies, and articles.
          </DialogDescription>
        </DialogHeader>
        <div className="p-4 border-b border-white/5 shrink-0">
          <SearchBar
            value={query}
            onChange={setQuery}
            autoFocus
            placeholder="Search companies, countries, articles..."
          />
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
          {query.length < 2 ? (
            defaultLoading && defaultData === EMPTY_DEFAULT_DATA ? (
              <div className="p-12 text-center">
                <Text variant="caption" className="text-muted-foreground animate-pulse">
                  Loading…
                </Text>
              </div>
            ) : (
              <SearchDefaultPanel data={defaultData} onItemClick={() => onOpenChange(false)} />
            )
          ) : (
            <SearchResults
              results={results}
              loading={loading}
              query={query}
              onItemClick={() => onOpenChange(false)}
            />
          )}
        </div>
        {/* Keyboard hints only make sense on a device with a physical keyboard —
            hidden on touch/small screens instead of showing dead ESC/↵ affordances. */}
        <div className="hidden sm:flex p-4 bg-muted/20 border-t border-white/5 items-center justify-between">
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
