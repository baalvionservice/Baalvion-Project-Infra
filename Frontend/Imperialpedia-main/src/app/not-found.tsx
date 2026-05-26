'use client';

import React from 'react';
import { Container } from '@/design-system/layout/container';
import { Text } from '@/design-system/typography/text';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SearchX, ArrowLeft, Search, Globe, Layout } from 'lucide-react';
import Link from 'next/link';

/**
 * Professional 404 Node Not Found Page.
 * Styled to match the platform's sophisticated dark UI.
 */
export default function NotFound() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center py-20 animate-in fade-in duration-700">
      <Container className="max-w-2xl text-center space-y-10">
        <div className="space-y-6">
          <div className="relative mx-auto w-32 h-32 flex items-center justify-center">
            <div className="absolute inset-0 rounded-[2.5rem] bg-destructive/10 animate-pulse" />
            <div className="absolute inset-2 rounded-[2rem] border-2 border-destructive/20" />
            <SearchX className="h-12 w-12 text-destructive relative z-10" />
          </div>
          
          <div className="space-y-2">
            <Badge variant="outline" className="border-destructive/30 text-destructive uppercase tracking-widest text-[10px] font-bold px-3 mb-2">Error 404</Badge>
            <Text variant="h1" className="text-4xl lg:text-6xl font-bold tracking-tight">Node Not Located</Text>
            <Text variant="body" className="text-muted-foreground text-lg leading-relaxed max-w-lg mx-auto">
              The intelligence node you requested does not exist in the Imperialpedia Index. It may have been de-indexed or moved during a cluster re-shard.
            </Text>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
          <Button variant="outline" className="h-12 rounded-xl font-bold border-white/10 bg-card/30 gap-2" asChild>
            <Link href="/"><ArrowLeft className="h-4 w-4" /> Go Home</Link>
          </Button>
          <Button variant="outline" className="h-12 rounded-xl font-bold border-white/10 bg-card/30 gap-2" asChild>
            <Link href="/search"><Search className="h-4 w-4" /> Global Search</Link>
          </Button>
          <Button className="h-12 rounded-xl font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20" asChild>
            <Link href="/knowledge-map">Open Graph</Link>
          </Button>
        </div>

        <div className="pt-12 border-t border-white/5 flex flex-col items-center gap-4">
          <div className="flex items-center gap-3 text-muted-foreground text-xs uppercase font-bold tracking-widest">
            <Globe className="h-4 w-4" /> Indexing Engine: Stable
          </div>
          <Text variant="caption" className="text-muted-foreground italic">
            "Searching for specific alpha? Our AI can help you find related research nodes."
          </Text>
          {/* TODO: Suggest alternative pages or content dynamically using AI in Phase 2 */}
          {/* Example: "Looking for companies in a specific country? Click here." */}
        </div>
      </Container>
    </main>
  );
}
