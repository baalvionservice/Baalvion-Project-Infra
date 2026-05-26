'use client';

import React from 'react';
import { GraphNode, GraphConnection } from '@/types/knowledge-graph';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Text } from '@/design-system/typography/text';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ArrowRight, 
  Layers, 
  FileText, 
  Users, 
  TrendingUp, 
  Zap,
  ChevronRight,
  Target,
  Sparkles,
  Search
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface NodeDetailPanelProps {
  node: GraphNode;
  relatedNodes: GraphNode[];
}

/**
 * Detailed information panel for a selected knowledge node.
 */
export function NodeDetailPanel({ node, relatedNodes }: NodeDetailPanelProps) {
  return (
    <Card className="glass-card border-none shadow-2xl overflow-hidden animate-in slide-in-from-right-4 duration-500 h-full flex flex-col">
      <CardHeader className="bg-primary/5 border-b border-white/5 p-8 relative">
        <div className="absolute top-0 right-0 p-6 opacity-10">
          <Zap className="h-24 w-24 text-primary" />
        </div>
        <div className="space-y-4 relative z-10">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-primary border-primary/30 uppercase tracking-widest text-[9px] font-bold h-6 px-3">
              {node.type}
            </Badge>
            <Badge variant="secondary" className="bg-primary/5 text-primary border-none text-[9px] font-bold px-2 h-5">
              {node.category}
            </Badge>
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">{node.label}</CardTitle>
          <Text variant="bodySmall" className="text-muted-foreground leading-relaxed italic">
            "{node.description}"
          </Text>
        </div>
      </CardHeader>

      <CardContent className="p-8 space-y-8 flex-grow">
        {/* Knowledge Depth Indicators */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-card/30 border border-white/5 text-center space-y-1">
            <div className="text-xl font-bold font-mono">{node.metrics.articles}</div>
            <Text variant="label" className="text-[7px] opacity-50 uppercase font-bold tracking-tighter">Articles</Text>
          </div>
          <div className="p-4 rounded-2xl bg-card/30 border border-white/5 text-center space-y-1">
            <div className="text-xl font-bold font-mono">{node.metrics.concepts}</div>
            <Text variant="label" className="text-[7px] opacity-50 uppercase font-bold tracking-tighter">Relations</Text>
          </div>
          <div className="p-4 rounded-2xl bg-card/30 border border-white/5 text-center space-y-1">
            <div className="text-xl font-bold font-mono">{node.metrics.experts}</div>
            <Text variant="label" className="text-[7px] opacity-50 uppercase font-bold tracking-tighter">Experts</Text>
          </div>
        </div>

        {/* Related Nodes Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Target className="h-4 w-4 text-primary" />
            <Text variant="label" className="text-[10px] font-bold uppercase tracking-widest text-primary">Directly Linked Nodes</Text>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {relatedNodes.map(rel => (
              <div key={rel.id} className="flex items-center justify-between p-4 rounded-xl bg-background/40 border border-white/5 hover:border-primary/30 transition-all group cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all">
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>
                  <Text variant="bodySmall" weight="bold">{rel.label}</Text>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-all" />
              </div>
            ))}
          </div>
        </div>

        {/* Feature Suggestion */}
        <div className="p-6 rounded-3xl bg-secondary/5 border border-secondary/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <Search className="h-12 w-12 text-secondary" />
          </div>
          <Text variant="caption" className="text-muted-foreground leading-relaxed">
            Searching for specific alpha? Use the **Search Engine** to find localized intelligence regarding {node.label}.
          </Text>
        </div>
      </CardContent>

      <CardFooter className="p-8 bg-muted/20 border-t border-white/5">
        <Button className="w-full h-12 rounded-xl font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 group" asChild>
          <Link href={`/articles`}>
            Launch Detailed Audit <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
