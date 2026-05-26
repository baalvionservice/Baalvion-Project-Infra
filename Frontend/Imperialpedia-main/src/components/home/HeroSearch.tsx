'use client';

import React, { useState } from 'react';
import { Text } from '@/design-system/typography/text';
import { Button } from '@/components/ui/button';
import { Search, Sparkles, TrendingUp, BookOpen, Zap } from 'lucide-react';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

export function HeroSearch() {
  const [query, setQuery] = useState('');

  return (
    <section className="relative pt-24 pb-20 lg:pt-32 lg:pb-28 overflow-hidden bg-primary/5 border-b border-white/5">
      {/* Architectural Background */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} 
      />
      
      <Container className="relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-10">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary mb-2">
              <Sparkles className="h-4 w-4" />
              <Text variant="label" className="text-[10px] font-bold uppercase tracking-[0.2em]">Alpha Index Active</Text>
            </div>
            <Text variant="h1" className="text-4xl lg:text-7xl font-bold tracking-tight leading-tight">
              AI-Powered <span className="text-primary">Financial Intelligence</span>
            </Text>
            <Text variant="body" className="text-muted-foreground text-lg lg:text-xl max-w-2xl mx-auto">
              Navigate 1M+ knowledge nodes. Real-time market audits and expert-led research at your fingertips.
            </Text>
          </div>

          {/* Central Search Node */}
          <div className="max-w-2xl mx-auto relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-[2rem] blur opacity-25 group-focus-within:opacity-100 transition duration-1000" />
            <div className="relative flex items-center bg-card border border-white/10 rounded-2xl p-2 shadow-2xl">
              <Search className="ml-4 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                className="border-none focus-visible:ring-0 text-lg h-12 bg-transparent placeholder:text-muted-foreground/50" 
                placeholder="Search stocks, crypto, or economic concepts..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <Button className="h-12 px-8 rounded-xl font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                Discover
              </Button>
            </div>
          </div>

          {/* Quick Triggers */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Button variant="ghost" className="rounded-xl h-11 px-6 gap-2 text-muted-foreground hover:text-primary font-bold text-xs uppercase tracking-widest" asChild>
              <Link href="/topics"><TrendingUp className="h-4 w-4" /> Explore Topics</Link>
            </Button>
            <Button variant="ghost" className="rounded-xl h-11 px-6 gap-2 text-muted-foreground hover:text-secondary font-bold text-xs uppercase tracking-widest" asChild>
              <Link href="/articles"><Zap className="h-4 w-4" /> Latest News</Link>
            </Button>
            <Button variant="ghost" className="rounded-xl h-11 px-6 gap-2 text-muted-foreground hover:text-emerald-500 font-bold text-xs uppercase tracking-widest" asChild>
              <Link href="/learning-paths"><BookOpen className="h-4 w-4" /> Learn Finance</Link>
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}

import { Container } from '@/design-system/layout/container';
