'use client';

import React, { useState } from 'react';
import { generateEarningsSummary, EarningsSummaryOutput } from '@/ai/flows/earnings-summary-flow';
import { Container } from '@/design-system/layout/container';
import { Text } from '@/design-system/typography/text';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  Loader2, 
  Search, 
  TrendingUp, 
  DollarSign, 
  Target, 
  Activity, 
  CheckCircle2, 
  Info,
  ArrowRight,
  Sparkles,
  PieChart,
  ArrowUpRight
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

/**
 * AI Earnings Summary Dashboard.
 * Specialized tool for generating structured summaries of corporate fiscal performance.
 */
export default function EarningsSummaryPage() {
  const [asset, setAsset] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EarningsSummaryOutput | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asset.trim()) return;

    setLoading(true);
    setResult(null);
    
    try {
      const output = await generateEarningsSummary({ asset });
      setResult(output);
      toast({
        title: "Fiscal Audit Complete",
        description: `Earnings summary for ${asset.toUpperCase()} has been synthesized.`,
      });
    } catch (error) {
      console.error('AI Analyst failure', error);
      toast({
        variant: "destructive",
        title: "Analysis Exception",
        description: "The AI engine encountered an error while processing the fiscal report.",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: string) => val; // Keep as string for AI formatted currency

  return (
    <main className="min-h-screen bg-background pb-20 pt-12">
      <Container>
        <header className="mb-12 max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary mb-6">
            <DollarSign className="h-4 w-4" />
            <Text variant="label" className="text-[10px] font-bold uppercase tracking-widest">Fiscal Intelligence Node</Text>
          </div>
          <Text variant="h1" className="text-4xl lg:text-6xl font-bold mb-6 tracking-tight">Earnings Summary</Text>
          <Text variant="body" className="text-muted-foreground text-lg leading-relaxed">
            Generate high-fidelity summaries of corporate fiscal performance. Compare actuals vs estimates and identify key growth drivers instantly.
          </Text>
        </header>

        <div className="max-w-2xl mx-auto mb-16">
          <Card className="glass-card shadow-2xl border-primary/20 overflow-hidden">
            <CardContent className="p-6">
              <form onSubmit={handleGenerate} className="flex gap-3">
                <div className="relative flex-1 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input 
                    placeholder="Enter company symbol (e.g. AAPL, TSLA, NVDA)..." 
                    value={asset}
                    onChange={(e) => setAsset(e.target.value)}
                    className="h-14 pl-12 bg-background/50 border-white/10 rounded-2xl text-lg focus:ring-primary/40 focus:border-primary"
                    disabled={loading}
                  />
                </div>
                <Button 
                  size="lg" 
                  type="submit" 
                  disabled={loading || !asset.trim()} 
                  className="h-14 px-8 rounded-2xl font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all scale-[1.02] active:scale-100"
                >
                  {loading ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : <BarChart3 className="mr-2 h-5 w-5" />}
                  {loading ? 'Auditing...' : 'Audit Earnings'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {loading && !result && (
          <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-500">
            <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-6 border border-primary/20">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
            </div>
            <Text variant="h3" className="font-bold mb-2">Analyzing Fiscal Records</Text>
            <Text variant="bodySmall" className="text-muted-foreground text-center max-w-sm">
              Extracting revenue benchmarks, EPS variances, and management guidance for {asset.toUpperCase()}...
            </Text>
          </div>
        )}

        {result && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Highlights & Variance */}
              <div className="lg:col-span-8 space-y-8">
                <Card className="glass-card border-none shadow-2xl overflow-hidden">
                  <CardHeader className="bg-primary/5 border-b border-white/5 p-8">
                    <div className="flex justify-between items-start mb-4">
                      <Badge className="bg-primary text-white border-none px-3 py-1 font-bold uppercase tracking-widest text-[10px]">
                        Fiscal Performance
                      </Badge>
                      <div className="flex items-center gap-2 text-primary font-bold text-xs">
                        <Activity className="h-4 w-4" /> Reports Processed
                      </div>
                    </div>
                    <CardTitle className="text-3xl font-bold leading-tight">Earnings Audit: {asset.toUpperCase()}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <Text variant="body" className="text-lg leading-relaxed text-foreground/80 mb-10 pb-10 border-b border-white/5 italic">
                      {result.overview}
                    </Text>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                      <Card className="bg-background/40 border-white/5 p-6 rounded-2xl">
                        <Text variant="label" className="text-[10px] text-muted-foreground mb-4 block">Revenue Node</Text>
                        <div className="text-2xl font-bold mb-1">{result.earnings_highlights.revenue}</div>
                        <Text variant="caption" className="text-emerald-500 font-bold">YoY Growth: {result.earnings_highlights.YoY_change}</Text>
                      </Card>
                      <Card className="bg-background/40 border-white/5 p-6 rounded-2xl">
                        <Text variant="label" className="text-[10px] text-muted-foreground mb-4 block">Earnings Per Share (EPS)</Text>
                        <div className="text-2xl font-bold mb-1">{result.earnings_highlights.EPS}</div>
                        <Text variant="caption" className="text-primary font-bold">vs Consensus Estimates</Text>
                      </Card>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-widest">
                        <Target className="h-4 w-4" /> Performance vs Estimates
                      </div>
                      <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10">
                        <Text variant="bodySmall" className="text-foreground/90 leading-relaxed font-medium">
                          {result.performance_vs_estimates}
                        </Text>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Growth Drivers & Guidance */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <Card className="glass-card border-none bg-primary/5">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary">
                        <Sparkles className="h-4 w-4" /> Growth Drivers
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {result.key_drivers.map((driver, i) => (
                        <div key={i} className="flex gap-3 items-start">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                          <Text variant="caption" className="text-muted-foreground leading-relaxed">{driver}</Text>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card className="glass-card border-none bg-secondary/5">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-bold flex items-center gap-2 text-secondary">
                        <TrendingUp className="h-4 w-4" /> Forward Guidance
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Text variant="caption" className="text-muted-foreground leading-relaxed">
                        {result.forward_guidance}
                      </Text>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Right Column: Confidence & Next Steps */}
              <div className="lg:col-span-4 space-y-8">
                <Card className="glass-card border-none shadow-xl bg-card/30">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Analysis Conviction</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex justify-between items-end mb-2">
                      <div className="text-5xl font-bold tracking-tighter text-primary">{result.confidence_score}</div>
                      <Text variant="label" className="mb-1">Score / 100</Text>
                    </div>
                    <Progress value={result.confidence_score} className="h-3 bg-muted/20" />
                    <div className="pt-4 flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10">
                      <Info className="h-5 w-5 text-primary shrink-0" />
                      <Text variant="caption" className="italic text-muted-foreground leading-relaxed">
                        Accuracy is weighted against regulatory SEC filings and primary investor relations releases.
                      </Text>
                    </div>
                  </CardContent>
                </Card>

                <div className="p-8 rounded-[3rem] border border-secondary/20 bg-secondary/5 space-y-4 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                    <PieChart className="h-12 w-12 text-secondary" />
                  </div>
                  <Text variant="label" className="text-secondary font-bold uppercase">Strategic Tools</Text>
                  <Text variant="h3" className="mb-4">ROI Modeling</Text>
                  <Text variant="bodySmall" className="text-muted-foreground leading-relaxed">
                    Ready to trade? Run a catalyst detection scan to see how this report influences upcoming price action.
                  </Text>
                  <Button variant="link" className="p-0 h-auto text-secondary font-bold text-xs group/btn" asChild>
                    <a href="/ai-analyst/catalyst-detection">
                      Launch Catalyst Scanner <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover/btn:translate-x-1" />
                    </a>
                  </Button>
                </div>

                <Card className="glass-card border-none bg-background/30 shadow-xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Auditor SLA</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                      <Text variant="caption" className="font-bold">Fiscal Hub Active</Text>
                    </div>
                    <div className="flex items-center gap-3">
                      <Target className="h-4 w-4 text-emerald-500" />
                      <Text variant="caption">Precision Yield Verified</Text>
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
