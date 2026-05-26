'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Text } from '@/design-system/typography/text';
import { Badge } from '@/components/ui/badge';
import { Clock, ArrowRight, Newspaper, Zap } from 'lucide-react';
import Link from 'next/link';

export function NewsGrid() {
  const news = [
    { id: 1, title: 'Federal Reserve Signals Potential Rate Pivot in Q3', summary: 'New economic data nodes suggest a structural shift in monetary policy as inflation benchmarks hit key targets.', category: 'Economics', time: '12 min ago' },
    { id: 2, title: 'Bitcoin ETFs Witness Record Institutional Inflow', summary: 'Wall Street capital is moving into decentralized digital assets at an unprecedented velocity.', category: 'Crypto', time: '42 min ago' },
    { id: 3, title: 'AI Infrastructure Super-Cycle: Analysis of the Chip War', summary: 'Why semiconductors remain the primary bottleneck for global technological expansion.', category: 'Technology', time: '1h ago' },
    { id: 4, title: 'Global Yield Curve Inversion Deepens', summary: 'Audit of the 2-10 year spread indicates high-probability recession signals for G7 economies.', category: 'Markets', time: '2h ago' },
    { id: 5, title: 'Energy Sector Rotation: Renewables vs Legacy Hydrocarbons', summary: 'Identifying the next capital migration in the energy transition matrix.', category: 'Energy', time: '3h ago' },
  ];

  return (
    <section className="space-y-8">
      <header className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <Newspaper className="h-5 w-5" />
          </div>
          <Text variant="h2" className="text-2xl lg:text-3xl font-bold">Breaking News</Text>
        </div>
        <Button variant="ghost" className="text-primary font-bold text-xs uppercase group" asChild>
          <Link href="/articles">Full Wire Feed <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" /></Link>
        </Button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Featured News Node */}
        <Card className="lg:col-span-2 glass-card border-none shadow-2xl bg-primary/5 hover:border-primary/30 transition-all duration-500 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
            <Zap className="h-48 w-48 text-primary" />
          </div>
          <CardContent className="p-10 flex flex-col justify-center h-full space-y-6 relative z-10">
            <div className="flex items-center gap-3">
              <Badge className="bg-primary text-white border-none px-3 py-1 font-bold uppercase tracking-widest text-[9px]">Top Story</Badge>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold uppercase">
                <Clock className="h-3.5 w-3.5" /> {news[0].time}
              </div>
            </div>
            <Text variant="h2" className="text-3xl lg:text-5xl font-bold leading-tight group-hover:text-primary transition-colors">
              {news[0].title}
            </Text>
            <Text variant="body" className="text-muted-foreground text-lg max-w-2xl leading-relaxed italic">
              "{news[0].summary}"
            </Text>
            <Button className="w-fit h-12 px-8 rounded-xl font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/30">
              Read Analysis
            </Button>
          </CardContent>
        </Card>

        {/* Secondary News Nodes */}
        {news.slice(1).map((item) => (
          <Card key={item.id} className="glass-card border-none hover:border-primary/20 transition-all duration-300 group flex flex-col">
            <CardHeader className="p-6 pb-2">
              <div className="flex justify-between items-start mb-4">
                <Badge variant="outline" className="text-[8px] font-bold uppercase border-white/10 bg-black/20 text-muted-foreground">{item.category}</Badge>
                <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground font-mono">
                  <Clock className="h-3 w-3" /> {item.time}
                </div>
              </div>
              <CardTitle className="text-xl font-bold line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                {item.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-2 flex-grow">
              <Text variant="bodySmall" className="text-muted-foreground line-clamp-3 leading-relaxed">
                {item.summary}
              </Text>
            </CardContent>
            <CardFooter className="p-6 pt-0 border-t border-white/5 bg-card/10 mt-4">
              <Button variant="link" className="p-0 h-auto text-primary text-[10px] font-bold uppercase tracking-widest group/link pt-4" asChild>
                <Link href="/articles">Read Node <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover/link:translate-x-1" /></Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  );
}

import { Button } from '@/components/ui/button';
