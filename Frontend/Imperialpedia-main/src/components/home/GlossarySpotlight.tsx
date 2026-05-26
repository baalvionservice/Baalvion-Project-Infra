'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Text } from '@/design-system/typography/text';
import { Button } from '@/components/ui/button';
import { BookOpen, Sparkles, ArrowRight, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export function GlossarySpotlight() {
  return (
    <Card className="glass-card border-none shadow-3xl overflow-hidden bg-primary/5 relative group">
      {/* Visual Watermark */}
      <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-1000">
        <BookOpen className="h-64 w-64 text-primary rotate-12" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 relative z-10">
        <div className="lg:col-span-4 p-10 lg:p-16 flex flex-col justify-center items-center text-center space-y-6 bg-primary/10 border-r border-white/5">
          <div className="p-4 rounded-3xl bg-primary/20 text-primary shadow-xl animate-pulse">
            <Sparkles className="h-10 w-10" />
          </div>
          <div>
            <Text variant="label" className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">Term of the Day</Text>
            <Text variant="h2" className="text-4xl lg:text-5xl font-bold mt-2 tracking-tighter">Stagflation</Text>
          </div>
        </div>

        <div className="lg:col-span-8 p-10 lg:p-16 flex flex-col justify-center space-y-8">
          <div className="space-y-4">
            <Text variant="h3" className="text-xl font-bold uppercase tracking-widest text-muted-foreground opacity-50">Instructional Definition</Text>
            <Text variant="body" className="text-2xl lg:text-3xl leading-relaxed font-medium italic text-foreground/90 border-l-4 border-primary/30 pl-8">
              "A condition of slow economic growth and relatively high unemployment accompanied by rising prices, typically challenging standard monetary policy nodes."
            </Text>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 pt-4">
            <Button size="lg" className="h-14 px-10 rounded-2xl font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/30 w-full sm:w-auto" asChild>
              <Link href="/glossary/stagflation">Full Term Audit</Link>
            </Button>
            <Button variant="ghost" className="h-14 px-8 rounded-2xl font-bold text-muted-foreground hover:text-primary gap-2 group w-full sm:w-auto" asChild>
              <Link href="/glossary">
                Browse Global Index <ExternalLink className="h-4 w-4 transition-transform group-hover:scale-110" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
