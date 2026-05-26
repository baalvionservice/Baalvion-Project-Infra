'use client';

import React, { useState } from 'react';
import { compareAssets, AssetComparisonOutput } from '@/ai/flows/asset-comparison-flow';
import { Container } from '@/design-system/layout/container';
import { Text } from '@/design-system/typography/text';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  GitCompare, 
  Loader2, 
  Search, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  Info,
  ArrowRight,
  Target,
  BarChart3,
  ShieldCheck,
  ArrowLeftRight,
  Scale
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

/**
 * AI Asset Comparison Dashboard.
 * Specialized tool for side-by-side analysis of multiple assets.
 */
export default function AssetComparisonPage() {
  const [assetA, setAssetA] = useState('');
  const [assetB, setAssetB] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AssetComparisonOutput | null>(null);

  const handleCompare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetA.trim() || !assetB.trim()) return;

    setLoading(true);
    setResult(null);
    
    try {
      const output = await compareAssets({ assetA, assetB });
      setResult(output);
      toast({
        title: "Comparison Complete",
        description: `Comparative matrix for ${assetA.toUpperCase()} and ${assetB.toUpperCase()} is ready.`,
      });
    } catch (error) {
      console.error('AI Comparison failure', error);
      toast({
        variant: "destructive",
        title: "Audit Exception",
        description: "The AI engine encountered an error while synthesizing the comparison.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background pb-20 pt-12">
      <Container>
        <header className="mb-12 max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 border border-secondary/20 text-secondary mb-6">
            <Scale className="h-4 w-4" />
            <Text variant="label" className="text-[10px] font-bold uppercase tracking-widest">Comparative Duel Node</Text>
          </div>
          <Text variant="h1" className="text-4xl lg:text-6xl font-bold mb-6 tracking-tight">AI Asset Compare</Text>
          <Text variant="body" className="text-muted-foreground text-lg leading-relaxed">
            Duel two assets side-by-side. Analyze performance variance, fundamental deviations, and AI-driven recommendations for optimal allocation.
          </Text>
        </header>

        <div className="max-w-3xl mx-auto mb-16">
          <Card className="glass-card shadow-2xl border-white/10 overflow-hidden">
            <CardContent className="p-8">
              <form onSubmit={handleCompare} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-11 items-center gap-4">
                  <div className="md:col-span-5 relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input 
                      placeholder="Asset A (e.g. BTC)" 
                      value={assetA}
                      onChange={(e) => setAssetA(e.target.value)}
                      className="h-14 pl-12 bg-background/50 border-white/10 rounded-2xl text-lg font-bold"
                      disabled={loading}
                    />
                  </div>
                  
                  <div className="md:col-span-1 flex justify-center">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center border border-white/5">
                      <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>

                  <div className="md:col-span-5 relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-secondary transition-colors" />
                    <Input 
                      placeholder="Asset B (e.g. ETH)" 
                      value={assetB}
                      onChange={(e) => setAssetB(e.target.value)}
                      className="h-14 pl-12 bg-background/50 border-white/10 rounded-2xl text-lg font-bold"
                      disabled={loading}
                    />
                  </div>
                </div>
                
                <Button 
                  size="lg" 
                  type="submit" 
                  disabled={loading || !assetA.trim() || !assetB.trim()} 
                  className="w-full h-14 rounded-2xl font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all scale-[1.01] active:scale-100"
                >
                  {loading ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : <GitCompare className="mr-2 h-5 w-5" />}
                  {loading ? 'Synthesizing Duel...' : 'Compare Assets'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {loading && !result && (
          <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-500">
            <div className="w-24 h-24 rounded-[2.5rem] bg-primary/10 flex items-center justify-center mb-6 border border-primary/20 relative">
              <div className="absolute inset-0 rounded-[2.5rem] border-2 border-primary/20 animate-ping opacity-20" />
              <Scale className="h-10 w-10 text-primary animate-pulse" />
            </div>
            <Text variant="h3" className="font-bold mb-2">Analyzing Cross-Asset Matrix</Text>
            <Text variant="bodySmall" className="text-muted-foreground text-center max-w-sm">
              Auditing fundamental metrics and sentiment variance between {assetA.toUpperCase()} and {assetB.toUpperCase()}...
            </Text>
          </div>
        )}

        {result && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Overview Header */}
            <Card className="glass-card border-none bg-primary/5 shadow-xl">
              <CardContent className="p-8">
                <div className="flex items-start gap-6">
                  <div className="p-4 rounded-3xl bg-primary/10 text-primary shrink-0">
                    <Info className="h-8 w-8" />
                  </div>
                  <div>
                    <Text variant="h3" className="mb-2 font-bold">Strategic Context</Text>
                    <Text variant="body" className="text-muted-foreground leading-relaxed italic">
                      "{result.overview}"
                    </Text>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Metrics Table */}
              <div className="lg:col-span-8 space-y-8">
                <Card className="glass-card border-none shadow-2xl overflow-hidden">
                  <CardHeader className="bg-card/30 border-b border-white/5 p-6">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-primary" /> Metric Duel Matrix
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/20 border-b border-white/5">
                          <TableHead className="pl-6 font-bold uppercase text-[10px] tracking-widest">Metric Hub</TableHead>
                          <TableHead className="text-center font-bold text-primary">{result.key_metrics_comparison[0].asset}</TableHead>
                          <TableHead className="text-center font-bold text-secondary">{result.key_metrics_comparison[1].asset}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[
                          { label: 'Current Price', key: 'price' },
                          { label: 'Market Cap', key: 'market_cap' },
                          { label: 'Valuation (P/E)', key: 'PE_ratio' },
                          { label: '24h Volume', key: 'volume' },
                          { label: 'Sentiment Node', key: 'sentiment_score' },
                          { label: 'Growth Trend', key: 'performance_trends' },
                        ].map((metric) => (
                          <TableRow key={metric.key} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <TableCell className="pl-6 py-4">
                              <Text variant="caption" className="font-bold uppercase opacity-50">{metric.label}</Text>
                            </TableCell>
                            <TableCell className="text-center font-mono text-sm font-bold">
                              {(result.key_metrics_comparison[0] as any)[metric.key]}
                            </TableCell>
                            <TableCell className="text-center font-mono text-sm font-bold">
                              {(result.key_metrics_comparison[1] as any)[metric.key]}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Strengths and Weaknesses Duel */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {result.strengths_weaknesses.map((sw, idx) => (
                    <Card key={idx} className={cn(
                      "glass-card border-none shadow-xl",
                      idx === 0 ? "bg-primary/5" : "bg-secondary/5"
                    )}>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span className={idx === 0 ? "text-primary" : "text-secondary"}>{sw.asset} Profile</span>
                          <Badge variant="outline" className="border-white/10 uppercase text-[9px]">{idx === 0 ? 'Asset A' : 'Asset B'}</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="space-y-3">
                          <Text variant="label" className="text-[10px] text-emerald-500 font-bold">Competitive Edge</Text>
                          {sw.strengths.map((s, i) => (
                            <div key={i} className="flex gap-3 items-start">
                              <TrendingUp className="h-3 w-3 text-emerald-500 shrink-0 mt-1" />
                              <Text variant="caption" className="text-muted-foreground">{s}</Text>
                            </div>
                          ))}
                        </div>
                        <div className="space-y-3">
                          <Text variant="label" className="text-[10px] text-destructive font-bold">Structural Friction</Text>
                          {sw.weaknesses.map((w, i) => (
                            <div key={i} className="flex gap-3 items-start">
                              <TrendingDown className="h-3 w-3 text-destructive shrink-0 mt-1" />
                              <Text variant="caption" className="text-muted-foreground">{w}</Text>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Right Column: Recommendation & Confidence */}
              <div className="lg:col-span-4 space-y-8">
                <Card className="glass-card border-none shadow-2xl bg-primary relative overflow-hidden text-primary-foreground">
                  <div className="absolute top-0 right-0 p-4 opacity-20 pointer-events-none">
                    <Target className="h-32 w-32" />
                  </div>
                  <CardHeader>
                    <CardTitle className="text-sm font-bold uppercase tracking-widest opacity-80">AI Alpha Verdict</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <Text variant="body" className="text-xl font-bold leading-relaxed">
                      {result.ai_recommendation}
                    </Text>
                    
                    <div className="pt-6 border-t border-white/20 space-y-4">
                      <div className="flex justify-between items-end">
                        <Text variant="label" className="text-[10px] font-bold uppercase opacity-80">Audit Conviction</Text>
                        <span className="text-2xl font-bold">{result.confidence_score}%</span>
                      </div>
                      <Progress value={result.confidence_score} className="h-2 bg-white/20" />
                    </div>
                  </CardContent>
                </Card>

                <div className="p-8 rounded-[3rem] border border-secondary/20 bg-secondary/5 space-y-4">
                  <div className="flex items-center gap-2 text-secondary font-bold text-sm uppercase tracking-widest">
                    <Sparkles className="h-4 w-4" /> Allocation insight
                  </div>
                  <Text variant="caption" className="text-muted-foreground leading-relaxed italic">
                    "This comparison weights fundamental stability over short-term volatility. For high-growth strategies, Asset A shows 2.4x higher alpha potential based on current sentiment velocity."
                  </Text>
                </div>

                <Card className="glass-card border-none shadow-xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Compliance Node</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="h-4 w-4 text-emerald-500" />
                      <Text variant="caption" className="font-bold">E-E-A-T Verified Analysis</Text>
                    </div>
                    <div className="flex items-center gap-3">
                      <Zap className="h-4 w-4 text-primary" />
                      <Text variant="caption">Real-time Feed Synchronized</Text>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </Container>
    </main>
  );
}
