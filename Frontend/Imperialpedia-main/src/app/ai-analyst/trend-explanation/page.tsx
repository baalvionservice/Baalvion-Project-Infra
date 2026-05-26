
'use client';

import React, { useEffect, useState } from 'react';
import { analyticsService } from '@/services/data/analytics-service';
import { TrendExplanationItem } from '@/types/analytics';
import { Container } from '@/design-system/layout/container';
import { Text } from '@/design-system/typography/text';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Activity, 
  Loader2, 
  Search, 
  Zap, 
  Sparkles,
  ArrowRight,
  Info,
  Target
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

/**
 * AI Trend Explanation Dashboard.
 * Specialized tool for analyzing and interpreting market trends across assets and sectors.
 */
export default function TrendExplanationPage() {
  const [trends, setTrends] = useState<TrendExplanationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadTrends() {
      try {
        const response = await analyticsService.getTrendExplanations();
        if (response.data) setTrends(response.data);
      } catch (e) {
        console.error('Failed to sync trend intelligence', e);
      } finally {
        setLoading(false);
      }
    }
    loadTrends();
  }, []);

  const filtered = trends.filter(t => 
    t.asset_name.toLowerCase().includes(search.toLowerCase()) ||
    t.symbol.toLowerCase().includes(search.toLowerCase())
  );

  const getTrendBadge = (trend: string) => {
    switch (trend) {
      case 'Uptrend':
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-bold uppercase text-[10px] px-3 h-6">Uptrend</Badge>;
      case 'Downtrend':
        return <Badge variant="destructive" className="font-bold uppercase text-[10px] px-3 h-6">Downtrend</Badge>;
      default:
        return <Badge variant="outline" className="text-muted-foreground border-white/10 text-[10px] font-bold uppercase px-3 h-6">Sideways</Badge>;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'Uptrend': return <TrendingUp className="h-5 w-5 text-emerald-500" />;
      case 'Downtrend': return <TrendingDown className="h-5 w-5 text-destructive" />;
      default: return <Minus className="h-5 w-5 text-muted-foreground" />;
    }
  };

  if (loading) {
    return (
      <div className="py-40 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <Text variant="bodySmall" className="animate-pulse font-bold tracking-widest uppercase text-muted-foreground">
          Calibrating Trend Matrix...
        </Text>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background pb-20 pt-12">
      <Container>
        <header className="mb-12 max-w-3xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary mb-2">
            <Activity className="h-4 w-4" />
            <Text variant="label" className="text-[10px] font-bold uppercase tracking-widest">Trend Synthesis Node</Text>
          </div>
          <Text variant="h1" className="text-4xl lg:text-6xl font-bold tracking-tight">AI Trend Explainer</Text>
          <Text variant="body" className="text-muted-foreground text-lg leading-relaxed">
            Deconstruct market momentum. Get AI-powered explanations of current trajectories, identifying key support levels and catalyst drivers.
          </Text>
          <div className="max-w-md mx-auto pt-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="Search by asset or symbol..." 
                className="h-14 pl-12 bg-card/30 border-white/10 rounded-2xl text-lg shadow-xl" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((item) => (
            <Card key={item.symbol} className="glass-card border-none shadow-2xl flex flex-col group hover:border-primary/30 transition-all duration-500">
              <CardHeader className="p-8 pb-4">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 rounded-2xl bg-background/50 border border-white/5 shadow-inner group-hover:scale-110 transition-transform">
                    {getTrendIcon(item.trend)}
                  </div>
                  {getTrendBadge(item.trend)}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Text variant="h3" className="font-bold group-hover:text-primary transition-colors">{item.asset_name}</Text>
                    <Badge variant="outline" className="font-mono text-[9px] border-white/10">{item.symbol}</Badge>
                  </div>
                  <Text variant="caption" className="text-muted-foreground uppercase tracking-widest font-bold text-[9px]">Market Trajectory Audit</Text>
                </div>
              </CardHeader>
              
              <CardContent className="p-8 pt-4 flex-grow space-y-8">
                <div className="p-5 rounded-2xl bg-primary/5 border border-primary/10 italic text-sm text-foreground/90 leading-relaxed relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 opacity-5">
                    <Sparkles className="h-8 w-8 text-primary" />
                  </div>
                  "{item.explanation}"
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <Text variant="label" className="text-[10px] font-bold text-primary uppercase tracking-widest">Audit Confidence</Text>
                    <span className="text-2xl font-bold">{Math.round(item.confidence_score * 100)}%</span>
                  </div>
                  <Progress value={item.confidence_score * 100} className="h-1.5 bg-white/5" />
                </div>
              </CardContent>

              <div className="p-8 pt-0 mt-auto">
                <Button variant="outline" className="w-full h-12 rounded-xl font-bold border-primary/20 text-primary hover:bg-primary/5 group/btn">
                  Detailed Analysis <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-20">
          <Card className="glass-card bg-primary/5 border-primary/20 p-8 flex flex-col gap-4">
            <div className="p-4 rounded-[2rem] bg-primary/10 w-fit text-primary">
              <Zap className="h-8 w-8" />
            </div>
            <div>
              <Text variant="h3" className="mb-2 text-xl font-bold">Trend Calculation Logic</Text>
              <Text variant="bodySmall" className="text-muted-foreground leading-relaxed">
                Trajectories are calculated using a weighted matrix of **Moving Average Convergence (MACD)**, **Relative Strength (RSI)**, and **Institutional Buy/Sell Volume Clusters**.
              </Text>
            </div>
          </Card>
          
          <Card className="glass-card border-secondary/20 p-8 flex flex-col gap-4 relative overflow-hidden">
            <div className="p-4 rounded-[2rem] bg-secondary/10 w-fit text-secondary">
              <Target className="h-8 w-8" />
            </div>
            <div>
              <Text variant="h3" className="mb-2 text-xl font-bold">Execution Intelligence</Text>
              <Text variant="bodySmall" className="text-muted-foreground leading-relaxed">
                Always cross-reference trend explanations with the **Automated Recap** to ensure recent news events aren't triggering temporary anomalous spikes in the data node.
              </Text>
            </div>
          </Card>
        </div>
      </Container>
    </main>
  );
}
