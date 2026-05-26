'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Text } from '@/design-system/typography/text';
import { Flame, MessageSquare, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface TrendingDiscussionsProps {
  topics: string[];
}

/**
 * Sidebar module for high-velocity community threads.
 */
export function TrendingDiscussions({ topics }: TrendingDiscussionsProps) {
  return (
    <Card className="glass-card border-none shadow-xl">
      <CardHeader className="pb-4">
        <CardTitle className="text-sm flex items-center gap-2 font-bold uppercase tracking-widest text-amber-500">
          <Flame className="h-4 w-4 fill-amber-500" /> Trending Threads
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-white/5">
          {topics.map((topic, i) => (
            <Link key={i} href="#" className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors group">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-background/50 border border-white/5 text-muted-foreground group-hover:text-primary transition-colors">
                  <MessageSquare className="h-3.5 w-3.5" />
                </div>
                <Text variant="caption" className="font-bold truncate group-hover:text-foreground transition-colors">
                  {topic}
                </Text>
              </div>
              <ChevronRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
            </Link>
          ))}
        </div>
        <div className="p-4 pt-0">
          <button className="w-full h-10 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary border-t border-white/5 mt-2">
            Explore All Forums
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
