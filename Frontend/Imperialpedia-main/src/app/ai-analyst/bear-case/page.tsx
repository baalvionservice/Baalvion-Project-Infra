'use client';

import React, { useState } from 'react';
import { generateBearCase, BearCaseOutput } from '@/ai/flows/bear-case-flow';
import { Container } from '@/design-system/layout/container';
import { Text } from '@/design-system/typography/text';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingDown, 
  ShieldAlert, 
  Loader2, 
  ArrowRight, 
  Target, 
  BarChart3, 
  Activity, 
  MessageSquare,
  Search,
  AlertTriangle,
  Zap,
  Info,
  Flame
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import Link from 'next/link';

/**
 * AI Bear Case Generator Dashboard.
 * Specialized tool for generating structured, AI-driven bearish scenarios.
 */
export default function BearCaseGeneratorPage() {
  const [asset, setAsset] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BearCaseOutput | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asset.trim()) return;

    setLoading(true);
    setResult(null);
    
    try {
      const output = await generateBearCase({ asset });
      setResult(output);
      toast({
        title: "Risk Analysis Complete",
        description: `Bear case for ${asset.toUpperCase()} has been synthesized.`,
      });
    } catch (error) {
      console.error('AI Analyst failure', error);
      toast({
        variant: "destructive",
        title: "Generation Error",
        description: "The AI engine encountered an exception during the risk audit.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background pb-20 pt-12">
      <Container>
        <header className="mb-12 max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 mb-6">
            <ShieldAlert className="h-4 w-4" />
            <Text variant="label" className="text-[10px] font-bold uppercase tracking-widest">Risk Assessment Node</Text>
          </div>
          <Text variant="h1" className="text-4xl lg:text-6xl font-bold mb-6 tracking-tight">Bear Case Generator</Text>
          <Text variant="body" className="text-muted-foreground text-lg leading-relaxed">
            Perform deep-dive risk audits. Generate data-driven bearish scenarios to identify vulnerabilities in any financial asset.
          </Text>
        </header>

        <div className="max-w-2xl mx-auto mb-16">
          <Card className="glass-card shadow-2xl border-amber-500/20 overflow-hidden">
            <CardContent className="p-6">
              <form onSubmit={handleGenerate} className="flex gap-3">
                <div className="relative flex-1 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-amber-500 transition-colors" />
                  <Input 
                    placeholder="Enter asset symbol (e.g. TSLA, ETH, Oil)..." 
                    value={asset}
                    onChange={(e) => setAsset(e.target.value)}
                    className="h-14 pl-12 bg-background/50 border-white/10 rounded-2xl text-lg focus:ring-amber-500/40 focus:border-amber-500"
                    disabled={loading}
                  />
                </div>
                <Button 
                  size="lg" 
                  type="submit" 
                  disabled={loading || !asset.trim()} 
                  className="h-14 px-8 rounded-2xl font-bold bg-amber-600 hover:bg-amber-700 shadow-xl shadow-amber-900/20 transition-all scale-[1.02] active:scale-100"
                >
                  {loading ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : <Flame className="mr-2 h-5 w-5" />}
                  {loading ? 'Auditing...' : 'Audit Risks'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {loading && !result && (
          <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-500">
            <div className="w-20 h-20 rounded-3xl bg-amber-500/10 flex items-center justify-center mb-6 border border-amber-500/20">
              <Loader2 className="h-10 w-10 text-amber-500 animate-spin" />
            </div>
            <Text variant="h3" className="font-bold mb-2">Scanning Vulnerability Matrix</Text>
            <Text variant="bodySmall" className="text-muted-foreground text-center max-w-sm">
              Traversing regulatory filings, competitive shifts, and distribution trends for {asset.toUpperCase()}...
            </Text>
          </div>
        )}

        {result && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Vulnerability & Risks */}
              <div className="lg:col-span-8 space-y-8">
                <Card className="glass-card border-none shadow-2xl overflow-hidden">
                  <CardHeader className="bg-amber-500/5 border-b border-white/5 p-8">
                    <div className="flex justify-between items-start mb-4">
                      <Badge className="bg-amber-600 text-white border-none px-3 py-1 font-bold uppercase tracking-widest text-[10px]">
                        Risk Intelligence
                      </Badge>
                      <div className="flex items-center gap-2 text-amber-500 font-bold text-xs">
                        <TrendingDown className="h-4 w-4" /> Bearish Scenario Active
                      </div>
                    </div>
                    <CardTitle className="text-3xl font-bold leading-tight">Bear Thesis: {asset.toUpperCase()}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <Text variant="body" className="text-lg leading-relaxed text-foreground/80 italic border-l-4 border-amber-500/30 pl-6 mb-10">
                      {result.overview}
                    </Text>

                    <div className="space-y-6">
                      <div className="flex items-center gap-2 text-amber-500 font-bold text-sm uppercase tracking-widest">
                        <AlertTriangle className="h-4 w-4" /> Negative Catalysts
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {result.risks.map((risk, idx) => (
                          <div key={idx} className="p-4 rounded-2xl bg-background/40 border border-white/5 flex gap-4 items-start group hover:border-amber-500/30 transition-colors">
                            <div className="mt-1 w-5 h-5 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-all">
                              <ArrowRight className="h-3 w-3" />
                            </div>
                            <Text variant="bodySmall" className="text-muted-foreground group-hover:text-foreground transition-colors">
                              {risk}
                            </Text>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Downside Projections */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <Card className="glass-card border-none bg-amber-500/5 border-amber-500/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-bold flex items-center gap-2 text-amber-500">
                        <Target className="h-4 w-4" /> Short-Term Support
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-2xl font-bold">{result.expected_price_range.short_term.split(':')[0]}</div>
                      <Text variant="caption" className="text-muted-foreground leading-relaxed">
                        {result.expected_price_range.short_term.split(':')[1] || result.expected_price_range.short_term}
                      </Text>
                    </CardContent>
                  </Card>

                  <Card className="glass-card border-none bg-destructive/5 border-destructive/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-bold flex items-center gap-2 text-destructive">
                        <TrendingDown className="h-4 w-4" /> Medium-Term Capitulation
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-2xl font-bold">{result.expected_price_range.medium_term.split(':')[0]}</div>
                      <Text variant="caption" className="text-muted-foreground leading-relaxed">
                        {result.expected_price_range.medium_term.split(':')[1] || result.expected_price_range.medium_term}
                      </Text>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Right Column: Conviction & Metrics */}
              <div className="lg:col-span-4 space-y-8">
                <Card className="glass-card border-none shadow-xl bg-card/30">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Bear Conviction</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex justify-between items-end mb-2">
                      <div className="text-5xl font-bold tracking-tighter text-amber-500">{result.confidence_score}</div>
                      <Text variant="label" className="mb-1">Score / 100</Text>
                    </div>
                    <Progress value={result.confidence_score} className="h-3 bg-muted/20" />
                    <div className="pt-4 flex items-center gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
                      <Info className="h-5 w-5 text-amber-500 shrink-0" />
                      <Text variant="caption" className="italic text-muted-foreground">
                        Conviction based on liquidity distribution and competitive decay markers.
                      </Text>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card border-none">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-amber-500" /> Negative Signals
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-muted-foreground">
                        <MessageSquare className="h-3 w-3" /> Sentiment Node
                      </div>
                      <div className="p-3 rounded-xl bg-background/50 border border-white/5">
                        <Text variant="bodySmall" className="font-bold text-amber-500">{result.supporting_metrics.social_sentiment}</Text>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-muted-foreground">
                        <Activity className="h-3 w-3" /> Distribution Trend
                      </div>
                      <div className="p-3 rounded-xl bg-background/50 border border-white/5">
                        <Text variant="bodySmall" className="font-bold">{result.supporting_metrics.volume_trend}</Text>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/5 space-y-3">
                      <div className="text-[10px] font-bold uppercase text-muted-foreground">Deteriorating KPIs</div>
                      <div className="flex flex-wrap gap-2">
                        {result.supporting_metrics.key_kpis.map((kpi, i) => (
                          <Badge key={i} variant="secondary" className="bg-amber-500/10 text-amber-500 border-none px-2 py-0.5 text-[9px] font-bold">
                            {kpi}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="p-8 rounded-[2rem] border border-amber-500/20 bg-amber-500/5 space-y-4">
                  <Text variant="label" className="text-amber-500 font-bold">Risk Directive</Text>
                  <Text variant="caption" className="text-muted-foreground leading-relaxed italic">
                    "Defensive posture recommended. High correlation with sector-wide weakness. Evaluate stop-loss levels at the psychological short-term support."
                  </Text>
                  <Button variant="link" className="p-0 h-auto text-amber-500 text-xs font-bold group" asChild>
                    <Link href="/ai-analyst/bull-case">
                      View Counter Bull Case <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Container>
    </main>
  );
}
