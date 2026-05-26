'use client';

import React, { useState } from 'react';
import { generateMacroSummary, MacroSummaryOutput } from '@/ai/flows/macro-summary-flow';
import { Container } from '@/design-system/layout/container';
import { Text } from '@/design-system/typography/text';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Globe, 
  Loader2, 
  Search, 
  TrendingUp, 
  Activity, 
  Zap, 
  Info,
  ArrowRight,
  BarChart3,
  Landmark,
  Layers,
  Sparkles
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

/**
 * AI Macro Summary Dashboard.
 * Specialized tool for generating structured summaries of the macroeconomic environment.
 */
export default function MacroSummaryPage() {
  const [subject, setSubject] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MacroSummaryOutput | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) return;

    setLoading(true);
    setResult(null);
    
    try {
      const output = await generateMacroSummary({ subject });
      setResult(output);
      toast({
        title: "Macro Analysis Complete",
        description: `Economic summary for ${subject.toUpperCase()} has been synthesized.`,
      });
    } catch (error) {
      console.error('AI Macro Engine failure', error);
      toast({
        variant: "destructive",
        title: "Analysis Exception",
        description: "The AI engine encountered an error while scanning the macro landscape.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background pb-20 pt-12">
      <Container>
        <header className="mb-12 max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary mb-6">
            <Globe className="h-4 w-4" />
            <Text variant="label" className="text-[10px] font-bold uppercase tracking-widest">Global Macro Node</Text>
          </div>
          <Text variant="h1" className="text-4xl lg:text-6xl font-bold mb-6 tracking-tight">Macro Summary</Text>
          <Text variant="body" className="text-muted-foreground text-lg leading-relaxed">
            Generate high-fidelity macroeconomic summaries. Analyze GDP, inflation, and interest rate trends to understand their impact on your portfolio or sector.
          </Text>
        </header>

        <div className="max-w-2xl mx-auto mb-16">
          <Card className="glass-card shadow-2xl border-primary/20 overflow-hidden">
            <CardContent className="p-6">
              <form onSubmit={handleGenerate} className="flex gap-3">
                <div className="relative flex-1 group">
                  <Landmark className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input 
                    placeholder="Enter asset or sector (e.g. S&P 500, Tech, Bonds)..." 
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="h-14 pl-12 bg-background/50 border-white/10 rounded-2xl text-lg focus:ring-primary/40 focus:border-primary"
                    disabled={loading}
                  />
                </div>
                <Button 
                  size="lg" 
                  type="submit" 
                  disabled={loading || !subject.trim()} 
                  className="h-14 px-8 rounded-2xl font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all scale-[1.02] active:scale-100"
                >
                  {loading ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : <Sparkles className="mr-2 h-5 w-5" />}
                  {loading ? 'Synthesizing...' : 'Scan Macro'}
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
            <Text variant="h3" className="font-bold mb-2">Scanning Global Data Clusters</Text>
            <Text variant="bodySmall" className="text-muted-foreground text-center max-w-sm">
              Traversing central bank policies, fiscal data, and yield benchmarks for {subject.toUpperCase()}...
            </Text>
          </div>
        )}

        {result && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Thesis & Indicators */}
              <div className="lg:col-span-8 space-y-8">
                <Card className="glass-card border-none shadow-2xl overflow-hidden">
                  <CardHeader className="bg-primary/5 border-b border-white/5 p-8">
                    <div className="flex justify-between items-start mb-4">
                      <Badge className="bg-primary text-white border-none px-3 py-1 font-bold uppercase tracking-widest text-[10px]">
                        Economic Intelligence
                      </Badge>
                      <div className="flex items-center gap-2 text-primary font-bold text-xs">
                        <TrendingUp className="h-4 w-4" /> Policy Pulse Active
                      </div>
                    </div>
                    <CardTitle className="text-3xl font-bold leading-tight">Macro Audit: {subject.toUpperCase()}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <Text variant="body" className="text-lg leading-relaxed text-foreground/80 mb-10 pb-10 border-b border-white/5 italic">
                      {result.overview}
                    </Text>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-6">
                        <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-widest">
                          <Activity className="h-4 w-4" /> Key Indicators
                        </div>
                        <div className="space-y-4">
                          <div className="p-4 rounded-xl bg-background/40 border border-white/5 flex justify-between items-center">
                            <Text variant="caption" className="font-bold uppercase opacity-50">GDP Growth</Text>
                            <Text variant="bodySmall" weight="bold">{result.key_indicators.GDP_growth}</Text>
                          </div>
                          <div className="p-4 rounded-xl bg-background/40 border border-white/5 flex justify-between items-center">
                            <Text variant="caption" className="font-bold uppercase opacity-50">Inflation</Text>
                            <Text variant="bodySmall" weight="bold" className="text-amber-500">{result.key_indicators.inflation}</Text>
                          </div>
                          <div className="p-4 rounded-xl bg-background/40 border border-white/5 flex justify-between items-center">
                            <Text variant="caption" className="font-bold uppercase opacity-50">Interest Rate</Text>
                            <Text variant="bodySmall" weight="bold" className="text-primary">{result.key_indicators.interest_rate}</Text>
                          </div>
                          <div className="p-4 rounded-xl bg-background/40 border border-white/5 flex justify-between items-center">
                            <Text variant="caption" className="font-bold uppercase opacity-50">Unemployment</Text>
                            <Text variant="bodySmall" weight="bold">{result.key_indicators.unemployment}</Text>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="flex items-center gap-2 text-secondary font-bold text-sm uppercase tracking-widest">
                          <Layers className="h-4 w-4" /> Sector Indexes
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {result.key_indicators.sector_indexes.map((idx, i) => (
                            <Badge key={i} variant="secondary" className="bg-secondary/10 text-secondary border-none px-3 py-1 font-bold">
                              {idx}
                            </Badge>
                          ))}
                        </div>
                        <div className="p-6 rounded-2xl bg-secondary/5 border border-secondary/10">
                          <Text variant="label" className="text-secondary mb-2 block">Recent Trends</Text>
                          <ul className="space-y-3">
                            {result.recent_trends.map((trend, i) => (
                              <li key={i} className="flex gap-3 items-start">
                                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-secondary shrink-0" />
                                <Text variant="caption" className="text-muted-foreground leading-relaxed">{trend}</Text>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column: Impacts & Conviction */}
              <div className="lg:col-span-4 space-y-8">
                <Card className="glass-card border-none shadow-xl bg-card/30">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Strategic Conviction</CardTitle>
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
                        Conviction is weighted against latest FOMC dots and global trade data.
                      </Text>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card border-none">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Zap className="h-5 w-5 text-primary" /> Potential Impacts
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {result.potential_impacts.map((impact, i) => (
                      <div key={i} className="p-4 rounded-xl bg-background/50 border border-white/5 flex gap-4 items-start">
                        <ArrowRight className="h-4 w-4 text-primary shrink-0 mt-1" />
                        <Text variant="bodySmall" className="text-muted-foreground leading-relaxed">
                          {impact}
                        </Text>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <div className="p-8 rounded-[3rem] border border-secondary/20 bg-secondary/5 space-y-4 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                    <BarChart3 className="h-12 w-12 text-secondary" />
                  </div>
                  <Text variant="label" className="text-secondary font-bold uppercase">Risk Modeling</Text>
                  <Text variant="h3" className="mb-4">Structural Scan</Text>
                  <Text variant="bodySmall" className="text-muted-foreground leading-relaxed">
                    How does the macro environment affect specific assets? Run a risk audit to detect structural vulnerabilities.
                  </Text>
                  <Button variant="link" className="p-0 h-auto text-secondary font-bold text-xs group/btn" asChild>
                    <a href="/ai-analyst/risk-detection">
                      Launch Risk Scanner <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover/btn:translate-x-1" />
                    </a>
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
