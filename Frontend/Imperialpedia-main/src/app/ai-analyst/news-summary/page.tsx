'use client';

import React, { useState } from 'react';
import { generateNewsSummary, NewsSummaryOutput } from '@/ai/flows/ai-news-summary-flow';
import { Container } from '@/design-system/layout/container';
import { Text } from '@/design-system/typography/text';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Newspaper, 
  Loader2, 
  Search, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Info,
  Globe,
  ArrowRight,
  Target,
  Zap,
  ExternalLink
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

/**
 * AI News Summary Dashboard.
 * Specialized tool for aggregating and analyzing the news landscape for financial assets.
 */
export default function NewsSummaryPage() {
  const [subject, setSubject] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<NewsSummaryOutput | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) return;

    setLoading(true);
    setResult(null);
    
    try {
      const output = await generateNewsSummary({ subject });
      setResult(output);
      toast({
        title: "Intelligence Synchronized",
        description: `News audit for ${subject.toUpperCase()} has been generated.`,
      });
    } catch (error) {
      console.error('AI News Engine failure', error);
      toast({
        variant: "destructive",
        title: "Synthesis Exception",
        description: "The AI engine failed to connect to the global news clusters.",
      });
    } finally {
      setLoading(false);
    }
  };

  const getSentimentBadge = (sentiment: string) => {
    switch (sentiment) {
      case 'Positive':
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-bold uppercase text-[9px] px-2 h-5">Positive</Badge>;
      case 'Negative':
        return <Badge variant="destructive" className="font-bold uppercase text-[9px] px-2 h-5">Negative</Badge>;
      default:
        return <Badge variant="outline" className="text-muted-foreground border-white/10 text-[9px] font-bold uppercase px-2 h-5">Neutral</Badge>;
    }
  };

  return (
    <main className="min-h-screen bg-background pb-20 pt-12">
      <Container>
        <header className="mb-12 max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary mb-6">
            <Globe className="h-4 w-4" />
            <Text variant="label" className="text-[10px] font-bold uppercase tracking-widest">Global News Node</Text>
          </div>
          <Text variant="h1" className="text-4xl lg:text-6xl font-bold mb-6 tracking-tight">AI News Summary</Text>
          <Text variant="body" className="text-muted-foreground text-lg leading-relaxed">
            Scan the global news cycle. Get AI-powered summaries, sentiment analysis, and potential performance impacts for any financial subject.
          </Text>
        </header>

        <div className="max-w-2xl mx-auto mb-16">
          <Card className="glass-card shadow-2xl border-primary/20 overflow-hidden">
            <CardContent className="p-6">
              <form onSubmit={handleGenerate} className="flex gap-3">
                <div className="relative flex-1 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input 
                    placeholder="Enter asset or sector (e.g. BTC, Fintech, Oil)..." 
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
                  {loading ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : <Newspaper className="mr-2 h-5 w-5" />}
                  {loading ? 'Synthesizing...' : 'Scan Headlines'}
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
            <Text variant="h3" className="font-bold mb-2">Aggregating Global Feed</Text>
            <Text variant="bodySmall" className="text-muted-foreground text-center max-w-sm">
              Analyzing latest wires, regulatory releases, and institutional wires for {subject.toUpperCase()}...
            </Text>
          </div>
        )}

        {result && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Headlines & Analysis */}
              <div className="lg:col-span-8 space-y-8">
                <Card className="glass-card border-none shadow-2xl overflow-hidden">
                  <CardHeader className="bg-primary/5 border-b border-white/5 p-8">
                    <div className="flex justify-between items-start mb-4">
                      <Badge className="bg-primary text-white border-none px-3 py-1 font-bold uppercase tracking-widest text-[10px]">
                        News Intelligence
                      </Badge>
                      <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase">
                        <Zap className="h-4 w-4" /> Real-time Feed Synchronized
                      </div>
                    </div>
                    <CardTitle className="text-3xl font-bold leading-tight">News Dashboard: {subject.toUpperCase()}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <Text variant="body" className="text-lg leading-relaxed text-foreground/80 mb-10 pb-10 border-b border-white/5 italic">
                      "{result.overview}"
                    </Text>

                    <div className="space-y-6">
                      <div className="flex items-center gap-2 text-muted-foreground font-bold text-sm uppercase tracking-widest mb-4">
                        <Newspaper className="h-4 w-4" /> Top Strategic Headlines
                      </div>
                      <div className="space-y-6">
                        {result.top_headlines.map((item, idx) => (
                          <div key={idx} className="p-6 rounded-2xl bg-background/40 border border-white/5 space-y-4 group hover:border-primary/30 transition-all relative overflow-hidden">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-background/50 border border-white/10">
                                  {item.sentiment === 'Positive' ? <TrendingUp className="h-4 w-4 text-emerald-500" /> : 
                                   item.sentiment === 'Negative' ? <TrendingDown className="h-4 w-4 text-destructive" /> : 
                                   <Minus className="h-4 w-4 text-muted-foreground" />}
                                </div>
                                <Text variant="body" weight="bold" className="group-hover:text-primary transition-colors">{item.headline}</Text>
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                {getSentimentBadge(item.sentiment)}
                                <Badge variant="secondary" className="bg-muted/50 border-none text-[8px] font-mono">{item.source}</Badge>
                              </div>
                            </div>
                            
                            <div className="pl-11 border-l-2 border-white/5 ml-5">
                              <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10">
                                <Target className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                <div>
                                  <Text variant="label" className="text-primary mb-1">Potential Impact</Text>
                                  <Text variant="bodySmall" className="text-muted-foreground leading-relaxed">
                                    {item.potential_impact}
                                  </Text>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column: Conviction & Meta */}
              <div className="lg:col-span-4 space-y-8">
                <Card className="glass-card border-none shadow-xl bg-card/30">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Audit Conviction</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex justify-between items-end mb-2">
                      <div className="text-5xl font-bold tracking-tighter text-primary">{result.confidence_score}</div>
                      <Text variant="label" className="mb-1 opacity-50">Score / 100</Text>
                    </div>
                    <Progress value={result.confidence_score} className="h-3 bg-white/5" />
                    <div className="pt-4 flex items-start gap-3 p-4 rounded-xl bg-background/50 border border-white/5">
                      <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                      <Text variant="caption" className="italic text-muted-foreground leading-relaxed">
                        Conviction is derived from cross-referencing multiple verified financial wire services.
                      </Text>
                    </div>
                  </CardContent>
                </Card>

                <div className="p-8 rounded-[3rem] border border-secondary/20 bg-secondary/5 space-y-4 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                    <TrendingUp className="h-12 w-12 text-secondary" />
                  </div>
                  <Text variant="label" className="text-secondary font-bold uppercase tracking-widest">Next Analysis</Text>
                  <Text variant="h3" className="mb-4">Sentiment Shift?</Text>
                  <Text variant="bodySmall" className="text-muted-foreground leading-relaxed">
                    Headlines often precede retail sentiment shifts. Run a social pulse scan to see how the public is reacting.
                  </Text>
                  <Button variant="link" className="p-0 h-auto text-secondary font-bold text-xs group/btn" asChild>
                    <a href="/ai-analyst/social-sentiment">
                      Launch Sentiment Pulse <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover/btn:translate-x-1" />
                    </a>
                  </Button>
                </div>

                <Card className="glass-card border-none bg-background/30 shadow-xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Reliability SLA</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                      <Text variant="caption" className="font-bold">Intelligence Feed Active</Text>
                    </div>
                    <div className="flex items-center gap-3">
                      <ExternalLink className="h-4 w-4 text-emerald-500" />
                      <Text variant="caption">Verified Financial Source API</Text>
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
