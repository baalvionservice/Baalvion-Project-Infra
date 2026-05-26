'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Text } from '@/design-system/typography/text';
import { Badge } from '@/components/ui/badge';
import { Layers, Zap, ArrowRight, Target, Globe } from 'lucide-react';
import Link from 'next/link';

/**
 * Sidebar component for article pages that visualizes related knowledge nodes.
 */
export function ArticleConnectionDisplay() {
  const mockRelatedNodes = [
    { label: "Interest Rates", type: "Concept" },
    { label: "Federal Reserve", type: "Institution" },
    { label: "Inflation", type: "Indicator" },
    { label: "CPI Index", type: "Metric" }
  ];

  return (
    <Card className="glass-card border-none shadow-xl bg-card/30 overflow-hidden group">
      <CardHeader className="bg-primary/5 border-b border-white/5 p-6">
        <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-primary">
          <Layers className="h-4 w-4" /> Knowledge Matrix
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="space-y-4">
          <Text variant="label" className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">Related Discovery Nodes</Text>
          <div className="space-y-3">
            {mockRelatedNodes.map((node) => (
              <div key={node.label} className="flex items-center justify-between p-3 rounded-xl bg-background/50 border border-white/5 hover:border-primary/30 transition-all group/node cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-primary/10 text-primary group-hover/node:bg-primary group-hover/node:text-white transition-all">
                    <Zap className="h-3 w-3" />
                  </div>
                  <div>
                    <Text variant="caption" weight="bold" className="block text-foreground/90">{node.label}</Text>
                    <Text variant="caption" className="text-[8px] text-muted-foreground uppercase font-bold tracking-widest">{node.type}</Text>
                  </div>
                </div>
                <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover/node:opacity-100 transition-all -translate-x-2 group-hover/node:translate-x-0" />
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-white/5">
          <Button variant="ghost" className="w-full h-10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-all group/btn" asChild>
            <Link href="/knowledge-map">
              Enter Global Graph <Globe className="ml-2 h-3.5 w-3.5 group-hover/btn:animate-spin" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

import { Button } from '@/components/ui/button';
