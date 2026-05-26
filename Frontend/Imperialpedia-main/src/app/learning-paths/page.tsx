'use client';

import React, { useEffect, useState } from 'react';
import { Container } from '@/design-system/layout/container';
import { Text } from '@/design-system/typography/text';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  GraduationCap, 
  Map as MapIcon, 
  Clock, 
  Layers, 
  ArrowRight, 
  ChevronRight, 
  ShieldCheck, 
  Sparkles,
  Loader2,
  BookOpen,
  Target
} from 'lucide-react';
import { getGlobalTopicIndex } from '@/services/mock-api/topics';
import { LearningPath } from '@/types/topics';
import Link from 'next/link';

/**
 * Global Learning Paths Hub.
 * Specialized discovery suite for curated educational trajectories across the index.
 */
export default function LearningPathsPage() {
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await getGlobalTopicIndex();
        if (response.data) setPaths(response.data.learning_paths);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="py-40 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <Text variant="bodySmall" className="animate-pulse font-bold tracking-widest uppercase text-muted-foreground">
          Calibrating Learning Nodes...
        </Text>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background pt-16 pb-32 animate-in fade-in duration-700">
      <Container>
        <header className="mb-16 max-w-4xl">
          <div className="flex items-center gap-2 text-emerald-500 mb-4">
            <GraduationCap className="h-5 w-5" />
            <Text variant="label" className="font-bold tracking-widest uppercase">Structured Discovery</Text>
          </div>
          <Text variant="h1" className="text-4xl lg:text-7xl font-bold mb-6 tracking-tight">
            Learning <span className="text-emerald-500">Paths</span>
          </Text>
          <Text variant="body" className="text-muted-foreground text-xl leading-relaxed">
            Master the complex world of finance with guided trajectories. Each path groups related knowledge nodes into a logical progression, from foundational concepts to institutional analysis.
          </Text>
        </header>

        <div className="grid grid-cols-1 gap-12">
          {paths.map((path, idx) => (
            <Card key={path.id} className="glass-card border-none shadow-2xl overflow-hidden group hover:border-emerald-500/30 transition-all duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-12">
                
                {/* Visual Identity Panel */}
                <div className="lg:col-span-4 p-10 bg-emerald-500/5 border-r border-white/5 flex flex-col justify-center space-y-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                    <MapIcon className="h-64 w-64 text-emerald-500" />
                  </div>
                  <div className="w-20 h-20 rounded-[2.5rem] bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-xl relative z-10 group-hover:scale-110 transition-transform">
                    <Layers className="h-10 w-10" />
                  </div>
                  <div className="space-y-2 relative z-10">
                    <Badge className="bg-emerald-500 text-white border-none text-[9px] font-bold uppercase tracking-widest mb-2">Curated Node</Badge>
                    <Text variant="h2" className="text-3xl font-bold">{path.name}</Text>
                    <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
                      <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> 12h Total Depth</span>
                      <span className="flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5 text-emerald-500" /> {path.topics.length} Nodes</span>
                    </div>
                  </div>
                </div>

                {/* Topics & Participation Panel */}
                <div className="lg:col-span-8 p-10 space-y-10 relative">
                  <div className="space-y-4">
                    <Text variant="body" className="text-lg text-muted-foreground leading-relaxed">
                      {path.description}
                    </Text>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6">
                      {path.topics.map((t, i) => (
                        <Link key={t.slug} href={`/glossary/${t.slug}`}>
                          <div className="flex items-center justify-between p-4 rounded-2xl bg-background/50 border border-white/5 hover:border-emerald-500/30 transition-all group/item">
                            <div className="flex items-center gap-4">
                              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-bold text-xs group-hover/item:bg-emerald-500 group-hover/item:text-white transition-all">
                                {i + 1}
                              </div>
                              <Text variant="bodySmall" weight="bold">{t.title}</Text>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover/item:opacity-100 -translate-x-2 group-hover/item:translate-x-0 transition-all" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>

                  <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="h-5 w-5 text-emerald-500" />
                      <Text variant="caption" className="text-muted-foreground font-bold uppercase tracking-widest">Syllabus Verified by Institutional Leads</Text>
                    </div>
                    <Button size="lg" className="h-12 px-8 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-900/20 group/btn">
                      Start Learning Cycle <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Suggestion Callout */}
        <div className="mt-20 p-12 rounded-[3.5rem] bg-primary/5 border border-primary/20 text-center space-y-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
            <Sparkles className="h-64 w-64 text-primary" />
          </div>
          <div className="w-16 h-16 rounded-[1.5rem] bg-primary/20 flex items-center justify-center mx-auto text-primary shadow-2xl relative z-10">
            <Target className="h-8 w-8" />
          </div>
          <div className="space-y-2 relative z-10">
            <Text variant="h2" className="text-3xl font-bold">Custom Learning Node?</Text>
            <Text variant="body" className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Searching for a specialized taxonomy? Our AI can architect a custom learning path based on your unique goals and risk profile.
            </Text>
          </div>
          <Button size="lg" className="h-14 px-10 rounded-2xl font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 relative z-10">
            Generate My Custom Path
          </Button>
        </div>
      </Container>
    </main>
  );
}
