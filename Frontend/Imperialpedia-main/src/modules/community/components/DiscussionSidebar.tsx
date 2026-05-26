'use client';

import React from 'react';
import { TrendingTopic } from '@/types/community';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Text } from '@/design-system/typography/text';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Flame, 
  Sparkles, 
  ArrowUpRight, 
  Activity, 
  ShieldCheck, 
  ChevronRight,
  Layers,
  Search
} from 'lucide-react';
import Link from 'next/link';

interface DiscussionSidebarProps {
  topics: TrendingTopic[];
}

/**
 * Sidebar component for trending topics and strategic community metadata.
 */
export function DiscussionSidebar({ topics }: DiscussionSidebarProps) {
  return (
    <aside className="space-y-8 h-fit">
      <Card className="glass-card border-none shadow-xl overflow-hidden">
        <CardHeader className="bg-card/30 border-b border-white/5 pb-4">
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
            <Flame className="h-4 w-4 fill-primary" /> Viral Taxonomy Nodes
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-white/5">
            {topics.map((topic) => (
              <div key={topic.name} className="p-5 hover:bg-white/5 transition-all group cursor-pointer">
                <div className="flex justify-between items-start mb-3">
                  <Text variant="bodySmall" weight="bold" className="group-hover:text-primary transition-colors leading-snug">
                    {topic.name}
                  </Text>
                  <div className="flex items-center gap-1 text-[10px] text-emerald-500 font-bold">
                    <ArrowUpRight className="h-3 w-3" /> Trending
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                    <div className="flex items-center gap-1.5"><Layers className="h-3 w-3" /> {topic.count || 0} Threads</div>
                    <div className="flex items-center gap-1.5"><Activity className="h-3 w-3" /> {topic.engagement.toLocaleString()} Score</div>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 bg-muted/10 border-t border-white/5">
            <Button variant="ghost" className="w-full text-[9px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary rounded-none">
              Explore All Taxonomies
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card border-none bg-primary/5 shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-1000">
          <Sparkles className="h-32 w-32 text-primary" />
        </div>
        <CardContent className="p-8 space-y-4">
          <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-widest">
            <ShieldCheck className="h-4 w-4" /> Authority Tip
          </div>
          <Text variant="caption" className="text-muted-foreground leading-relaxed italic block">
            "Experts participating in **Macro** discussions are seeing a 2.4x higher follower conversion rate this cycle. Consider sharing your tactical yield audits."
          </Text>
          <Button variant="link" className="p-0 h-auto text-primary font-bold text-xs uppercase" asChild>
            <Link href="/community/leaderboard">Review Expert Rankings <ChevronRight className="ml-1 h-3 w-3" /></Link>
          </Button>
        </CardContent>
      </Card>

      <div className="p-8 rounded-[3rem] bg-secondary/5 border border-secondary/20 space-y-4 text-center">
        <div className="w-16 h-16 rounded-[1.5rem] bg-secondary/10 flex items-center justify-center mx-auto mb-2">
          <Search className="h-8 w-8 text-secondary" />
        </div>
        <Text variant="bodySmall" weight="bold" className="text-secondary">Custom Intelligence Node</Text>
        <Text variant="caption" className="text-muted-foreground leading-relaxed block">
          Can't find a specific discussion node? Search our 1M+ indexable pages to spark new dialogue.
        </Text>
        <Button variant="outline" className="w-full h-11 rounded-xl border-secondary/20 text-secondary font-bold text-xs">Global Search Hub</Button>
      </div>
    </aside>
  );
}
