'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Text } from '@/design-system/typography/text';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Star, Heart, MessageSquare } from 'lucide-react';
import Link from 'next/link';

export function FeaturedGrid() {
  const articles = [
    { title: 'The Macro Case for Fixed Income in 2024', category: 'Investing', likes: 1240, author: 'Eleanor Vance' },
    { title: 'Quantitative Easing vs Tightening: A Visual Guide', category: 'Economics', likes: 850, author: 'The Market Maven' },
    { title: 'Emerging Markets: Top 5 Opportunistic Nodes', category: 'Markets', likes: 420, author: 'Julian Wealth' },
    { title: 'Tax-Advantaged Growth: Retirement Matrix 101', category: 'Personal Finance', likes: 2100, author: 'Sarah Mitchell' },
    { title: 'DeFi Liquidity Pools: A Risk-Parity Audit', category: 'Crypto', likes: 680, author: 'Sarah Crypto' },
    { title: 'ESG Benchmarks for Institutional Portfolios', category: 'Compliance', likes: 320, author: 'Michael Roberts' },
  ];

  return (
    <section className="space-y-10">
      <header className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
            <Star className="h-5 w-5 fill-amber-500" />
          </div>
          <Text variant="h2" className="text-2xl lg:text-3xl font-bold">Featured Intelligence</Text>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {articles.map((item, idx) => (
          <Card key={idx} className="glass-card border-none hover:border-primary/20 transition-all duration-500 group flex flex-col overflow-hidden">
            <CardHeader className="p-8 pb-4">
              <div className="flex justify-between items-start mb-4">
                <Badge variant="outline" className="text-[8px] font-bold uppercase border-primary/20 bg-primary/5 text-primary h-5 px-2">
                  {item.category}
                </Badge>
                <div className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground">
                  <Heart className="h-3 w-3" /> {item.likes}
                </div>
              </div>
              <CardTitle className="text-xl font-bold leading-tight group-hover:text-primary transition-colors">
                {item.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0 flex-grow">
              <Text variant="caption" className="text-muted-foreground uppercase font-bold tracking-widest text-[9px]">
                By {item.author}
              </Text>
            </CardContent>
            <CardFooter className="p-6 bg-muted/10 border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase">12 Comments</span>
              </div>
              <Button variant="ghost" size="sm" className="h-8 px-2 text-primary font-bold text-xs group/btn" asChild>
                <Link href="/articles">
                  Read Analysis <ArrowRight className="ml-1.5 h-3 w-3 transition-transform group-hover/btn:translate-x-1" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  );
}
