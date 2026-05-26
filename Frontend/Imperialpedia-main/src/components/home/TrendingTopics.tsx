'use client';

import React from 'react';
import { Text } from '@/design-system/typography/text';
import { Flame, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export function TrendingTopics() {
  const topics = [
    { label: 'Bitcoin', href: '/tags/bitcoin', volume: 'High' },
    { label: 'Inflation', href: '/tags/inflation', volume: 'Stable' },
    { label: 'AI Finance', href: '/tags/ai-finance', volume: 'Trending' },
    { label: 'Interest Rates', href: '/tags/interest-rates', volume: 'High' },
    { label: 'Fed Policy', href: '/tags/fed-policy', volume: 'Stable' },
    { label: 'ETFs', href: '/tags/etfs', volume: 'Trending' },
  ];

  return (
    <section className="flex flex-col md:flex-row items-center gap-8 py-6 border-y border-white/5">
      <div className="flex items-center gap-3 shrink-0">
        <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
          <Flame className="h-4 w-4 fill-amber-500" />
        </div>
        <Text variant="label" className="text-[10px] font-bold uppercase tracking-widest">Trending Nodes</Text>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {topics.map((topic) => (
          <Link key={topic.label} href={topic.href}>
            <Badge 
              variant="secondary" 
              className="bg-card hover:bg-primary/10 hover:text-primary border border-white/5 transition-all cursor-pointer h-9 px-4 rounded-xl font-bold text-xs gap-2 group"
            >
              #{topic.label}
              <span className="text-[8px] opacity-30 group-hover:opacity-100 transition-opacity font-mono">{topic.volume}</span>
            </Badge>
          </Link>
        ))}
      </div>

      <Button variant="ghost" size="sm" className="ml-auto text-primary font-bold text-[10px] uppercase tracking-widest group" asChild>
        <Link href="/topics">View Taxonomy <ChevronRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" /></Link>
      </Button>
    </section>
  );
}

import { Button } from '@/components/ui/button';
