'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, ArrowRight, Activity } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Text } from '@/design-system/typography/text';
import { cn } from '@/lib/utils';
import type { GlossaryListItem } from '@/lib/data/glossary';

interface GlossaryIndexClientProps {
  initialItems: GlossaryListItem[];
}

const DIFFICULTY_ALL = 'all';
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function groupKey(term: string): string {
  const first = term.charAt(0).toUpperCase();
  return /[A-Z]/.test(first) ? first : '#';
}

/**
 * Interactive glossary index: client-side search + difficulty filter over the
 * server-rendered, pre-sorted list. The initial list is fully SSR'd so the page
 * is useful with JavaScript disabled; this layer only refines what is shown.
 */
export function GlossaryIndexClient({ initialItems }: GlossaryIndexClientProps) {
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState<string>(DIFFICULTY_ALL);

  // Difficulty options derived from the data, preserving first-seen order.
  const difficulties = useMemo(() => {
    const seen: string[] = [];
    for (const item of initialItems) {
      if (item.difficulty && !seen.includes(item.difficulty)) {
        seen.push(item.difficulty);
      }
    }
    return seen;
  }, [initialItems]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return initialItems.filter((item) => {
      const matchesDifficulty =
        difficulty === DIFFICULTY_ALL || item.difficulty === difficulty;
      if (!matchesDifficulty) return false;
      if (!q) return true;
      return (
        item.term.toLowerCase().includes(q) ||
        item.short_def.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    });
  }, [initialItems, search, difficulty]);

  // Group the already-sorted list into A–Z buckets (plus '#' for non-letters).
  const grouped = useMemo(() => {
    const map = new Map<string, GlossaryListItem[]>();
    for (const item of filtered) {
      const key = groupKey(item.term);
      const bucket = map.get(key);
      if (bucket) bucket.push(item);
      else map.set(key, [item]);
    }
    return map;
  }, [filtered]);

  const activeLetters = useMemo(() => new Set(grouped.keys()), [grouped]);
  const orderedGroups = useMemo(
    () =>
      [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b, 'en')),
    [grouped],
  );

  return (
    <div className="space-y-12">
      {/* Search + difficulty filter bar */}
      <div className="flex flex-col lg:flex-row gap-6 bg-card/30 p-6 rounded-[2rem] border border-white/5 backdrop-blur-sm sticky top-20 z-30 shadow-xl">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search the glossary…"
            className="pl-12 h-12 bg-background/50 border-white/10 rounded-xl text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search glossary terms"
          />
        </div>
        {difficulties.length > 0 && (
          <div className="flex flex-wrap items-center gap-3">
            {[DIFFICULTY_ALL, ...difficulties].map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setDifficulty(lvl)}
                className={cn(
                  'px-4 h-10 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border',
                  difficulty === lvl
                    ? 'bg-primary text-white border-primary shadow-lg'
                    : 'bg-background/50 text-muted-foreground border-white/5 hover:border-primary/30',
                )}
              >
                {lvl === DIFFICULTY_ALL ? 'All' : lvl}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* A–Z jump nav */}
      <nav
        aria-label="Jump to letter"
        className="flex flex-wrap gap-2 justify-center p-6 bg-card/20 rounded-[2rem] border border-white/5 shadow-inner"
      >
        {ALPHABET.map((letter) => (
          <a
            key={letter}
            href={activeLetters.has(letter) ? `#letter-${letter}` : undefined}
            aria-disabled={!activeLetters.has(letter)}
            className={cn(
              'w-10 h-10 flex items-center justify-center rounded-xl font-bold transition-all border',
              activeLetters.has(letter)
                ? 'bg-primary/10 text-primary border-primary/20 hover:bg-primary hover:text-white hover:scale-110'
                : 'opacity-20 cursor-not-allowed border-transparent pointer-events-none',
            )}
          >
            {letter}
          </a>
        ))}
      </nav>

      {/* Grouped term list */}
      {orderedGroups.length === 0 ? (
        <div className="text-center py-24">
          <Text variant="h3" className="font-bold mb-2">
            No matching terms
          </Text>
          <Text variant="body" className="text-muted-foreground">
            Try a different search or clear the difficulty filter.
          </Text>
        </div>
      ) : (
        <div className="space-y-16">
          {orderedGroups.map(([letter, terms]) => (
            <section
              key={letter}
              id={`letter-${letter}`}
              className="scroll-mt-48 space-y-8"
            >
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-2xl font-bold shadow-inner">
                  {letter}
                </div>
                <div className="flex-1 h-px bg-gradient-to-r from-primary/30 to-transparent" />
                <Text
                  variant="label"
                  className="text-[10px] text-muted-foreground font-bold"
                >
                  {terms.length} {terms.length === 1 ? 'Term' : 'Terms'}
                </Text>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {terms.map((item) => (
                  <Link key={item.id} href={`/glossary/${item.slug}`}>
                    <Card className="glass-card border-none hover:border-primary/30 transition-all duration-300 group overflow-hidden h-full">
                      <CardContent className="p-6 space-y-4">
                        <div className="flex justify-between items-start">
                          <Badge
                            variant="outline"
                            className="text-[8px] font-bold uppercase border-white/10 bg-black/20 text-muted-foreground"
                          >
                            {item.category}
                          </Badge>
                          <div className="flex items-center gap-1 text-[9px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0 uppercase">
                            Read <ArrowRight className="h-3 w-3" />
                          </div>
                        </div>
                        <Text
                          variant="body"
                          weight="bold"
                          className="group-hover:text-primary transition-colors text-lg"
                        >
                          {item.term}
                        </Text>
                        <Text
                          variant="caption"
                          className="text-muted-foreground line-clamp-2 leading-relaxed"
                        >
                          {item.short_def}
                        </Text>
                        {item.difficulty && (
                          <div className="pt-4 border-t border-white/5 flex items-center gap-1 text-[9px] text-muted-foreground font-bold uppercase tracking-tighter">
                            <Activity className="h-3 w-3" /> {item.difficulty}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
