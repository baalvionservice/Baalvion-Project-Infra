'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Text } from '@/design-system/typography/text';
import { Sparkles, Bot, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

/**
 * AI Research Placeholder Section.
 * Signals future generative capabilities with a high-fidelity futuristic UI.
 */
export function AISection() {
  return (
    <section className="py-12">
      <Card className="glass-card border-none bg-gradient-to-br from-primary/10 via-background/50 to-secondary/10 overflow-hidden relative group rounded-[3rem]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(130,114,242,0.1),transparent)] pointer-events-none" />
        
        <CardContent className="p-12 lg:p-24 text-center relative z-10 space-y-10">
          <div className="mx-auto w-24 h-24 rounded-[2.5rem] bg-primary/20 flex items-center justify-center text-primary shadow-2xl animate-pulse ring-1 ring-primary/30">
            <Bot className="h-12 w-12" />
          </div>
          
          <div className="space-y-4 max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2 text-primary mb-2">
              <Sparkles className="h-4 w-4" />
              <Text variant="label" className="font-bold tracking-[0.3em] uppercase text-[10px]">Intelligence Node</Text>
            </div>
            <Text variant="h2" className="text-4xl lg:text-6xl font-bold tracking-tight">Ask AI About Finance</Text>
            <Text variant="body" className="text-muted-foreground text-lg lg:text-xl leading-relaxed">
              Get instant, data-driven answers to complex market questions. Our analyst kernel is currently being trained on 1M+ knowledge nodes.
            </Text>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000" />
              <div className="relative flex items-center bg-background/40 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-5 shadow-2xl cursor-not-allowed">
                <Text variant="body" className="text-muted-foreground/40 italic flex-1 text-left pl-4">
                  "Compare the current S&P 500 P/E ratio to historical inflationary peaks..."
                </Text>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 gap-2 font-bold px-4 py-1.5 rounded-xl uppercase text-[9px] tracking-widest">
                  <Lock className="h-3 w-3" /> Coming Soon
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
