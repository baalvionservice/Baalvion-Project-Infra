'use client';

import React, { useState } from 'react';
import { generateSocialSentiment, SocialSentimentOutput } from '@/ai/flows/social-sentiment-flow';
import { Container } from '@/design-system/layout/container';
import { Text } from '@/design-system/typography/text';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  MessageSquare, 
  Loader2, 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Info,
  Activity,
  ArrowRight,
  Sparkles,
  Heart,
  ShieldAlert,
  Zap,
  Globe
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

/**
 * AI Social Sentiment Dashboard.
 * Specialized tool for scanning real-time perception and market emotion.
 */
export default function SocialSentimentPage() {
  const [asset, setAsset] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SocialSentimentOutput | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asset.trim()) return;

    setLoading(true);
    setResult(null);
    
    try {
      const output = await generateSocialSentiment({ asset });
      setResult(output);
      toast({
        title: "Perception Audit Complete",
        description: `Social sentiment for ${asset.toUpperCase()} has been synthesized.`,
      });
    } catch (error) {
      console.error('AI Sentiment failure', error);
      toast({
        variant: "destructive",
        title: "Analysis Exception",
        description: "The AI engine failed to connect to the social pulse buffer.",
      });
    } finally {
      setLoading(false);
    }
  };

  const getScoreLabel = (score: number) => {
    if (score > 60) return { label: 'Extremely Bullish', color: 'text-emerald-500' };
    if (score > 20) return { label: 'Moderately Bullish', color: 'text-primary' };
    if (score > -20) return { label: 'Neutral / Mixed', color: 'text-muted-foreground' };
    if (score > -60) return { label: 'Moderately Bearish', color: 'text-amber-500' };
    return { label: 'Extremely Bearish', color: 'text-destructive' };
  };

  return (
    <main className="min-h-screen bg-background pb-20 pt-12">
      <Container>
        <header className="mb-12 max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary mb-6">
            <MessageSquare className="h-4 w-4" />
            <Text variant="label" className="text-[10px] font-bold uppercase tracking-widest">Psychology Index Node</Text>
          </div>
          <Text variant="h1" className="text-4xl lg:text-6xl font-bold mb-6 tracking-tight">Social Sentiment</Text>
          <Text variant="body" className="text-muted-foreground text-lg leading-relaxed">
            Scan the global social pulse. Identify trending narratives, bull-runs, and FUD (Fear, Uncertainty, Doubt) before they hit the charts.
          </Text>
        </header>

        <div className="max-w-2xl mx-auto mb-16">
          <Card className="glass-card shadow-2xl border-primary/20 overflow-hidden">
            <CardContent className="p-6">
              <form onSubmit={handleGenerate} className="flex gap-3">
                <div className="relative flex-1 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input 
                    placeholder="Enter asset (e.g. BTC, TSLA, Gold)..." 
                    value={asset}
                    onChange={(e) => setAsset(e.target.value)}
                    className="h-14 pl-12 bg-background/50 border-white/10 rounded-2xl text-lg"
                    disabled={loading}
                  />
                </div>
                <Button 
                  size="lg" 
                  type="submit" 
                  disabled={loading || !asset.trim()} 
                  className="h-14 px-8 rounded-2xl font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all scale-[1.02] active:scale-100"
                >
                  {loading ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : <Sparkles className="mr-2 h-5 w-5" />}
                  {loading ? 'Listening...' : 'Scan Pulse'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {loading && !result && (
          <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-500">
            <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-6 border border-primary/20 relative">
              <div className="absolute inset-0 rounded-3xl border-2 border-primary/20 animate-ping opacity-20" />
              <Globe className="h-10 w-10 text-primary animate-pulse" />
            </div>
            <Text variant="h3" className="font-bold mb-2">Aggregating Social Metadata</Text>
            <Text variant="bodySmall" className="text-muted-foreground text-center max-w-sm">
              Processing mentions from X, Reddit, and Discord for {asset.toUpperCase()}...
            </Text>
          </div>
        )}

        {result && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Score & Summary */}
              <div className="lg:col-span-4 space-y-8">
                <Card className="glass-card border-none shadow-2xl bg-card/30 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <Heart className="h-32 w-32" />
                  </div>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Net Sentiment Score</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    <div className="flex flex-col items-center text-center">
                      <div className={cn("text-7xl font-bold tracking-tighter mb-2", getScoreLabel(result.overall_sentiment_score).color)}>
                        {result.overall_sentiment_score > 0 ? '+' : ''}{result.overall_sentiment_score}
                      </div>
                      <Text variant="h4" className={cn("font-bold uppercase tracking-widest", getScoreLabel(result.overall_sentiment_score).color)}>
                        {getScoreLabel(result.overall_sentiment_score).label}
                      </Text>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground">
                        <span>Reliability</span>
                        <span>{result.confidence_score}%</span>
                      </div>
                      <Progress value={result.confidence_score} className="h-2 bg-muted/20" />
                    </div>

                    <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                      <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase mb-2">
                        <Info className="h-3 w-3" /> Analysis Note
                      </div>
                      <Text variant="caption" className="italic text-muted-foreground leading-relaxed">
                        Perception is weighted based on recent influencer density and high-engagement social threads.
                      </Text>
                    </div>
                  </CardContent>
                </Card>

                <div className="p-8 rounded-[3rem] border border-secondary/20 bg-secondary/5 space-y-4">
                  <Text variant="label" className="text-secondary font-bold">Psychology Hedge</Text>
                  <Text variant="h3" className="mb-4">Sentiment Divergence</Text>
                  <Text variant="bodySmall" className="text-muted-foreground leading-relaxed">
                    Watch for price action that moves opposite to social sentiment. This often signals institutional distribution or accumulation cycles.
                  </Text>
                  <Button variant="link" className="p-0 h-auto text-secondary font-bold text-xs group/btn" asChild>
                    <a href="/ai-analyst/risk-detection">
                      Run Risk Audit <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover/btn:translate-x-1" />
                    </a>
                  </Button>
                </div>
              </div>

              {/* Right Column: Drivers Matrix */}
              <div className="lg:col-span-8 space-y-8">
                <Card className="glass-card border-none shadow-2xl overflow-hidden">
                  <CardHeader className="bg-primary/5 border-b border-white/5 p-8">
                    <div className="flex justify-between items-start mb-4">
                      <Badge className="bg-primary text-white border-none px-3 py-1 font-bold uppercase tracking-widest text-[10px]">
                        Social Intelligence
                      </Badge>
                      <div className="flex items-center gap-2 text-primary font-bold text-xs">
                        <Activity className="h-4 w-4" /> Pulse Monitoring Active
                      </div>
                    </div>
                    <CardTitle className="text-3xl font-bold leading-tight">Sentiment Audit: {asset.toUpperCase()}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <Text variant="body" className="text-lg leading-relaxed text-foreground/80 mb-10 pb-10 border-b border-white/5">
                      {result.overview}
                    </Text>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Positive Drivers */}
                      <div className="space-y-6">
                        <div className="flex items-center gap-2 text-emerald-500 font-bold text-sm uppercase tracking-widest">
                          <TrendingUp className="h-4 w-4" /> Bullish Drivers
                        </div>
                        <div className="space-y-3">
                          {result.positive_sentiment.map((point, i) => (
                            <div key={i} className="flex gap-3 items-start p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                              <Zap className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                              <Text variant="bodySmall" className="text-muted-foreground leading-relaxed">{point}</Text>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Negative Drivers */}
                      <div className="space-y-6">
                        <div className="flex items-center gap-2 text-destructive font-bold text-sm uppercase tracking-widest">
                          <TrendingDown className="h-4 w-4" /> Bearish Drivers
                        </div>
                        <div className="space-y-3">
                          {result.negative_sentiment.map((point, i) => (
                            <div key={i} className="flex gap-3 items-start p-4 rounded-xl bg-destructive/5 border border-destructive/10">
                              <ShieldAlert className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                              <Text variant="bodySmall" className="text-muted-foreground leading-relaxed">{point}</Text>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-10 pt-10 border-t border-white/5 space-y-6">
                      <div className="flex items-center gap-2 text-muted-foreground font-bold text-sm uppercase tracking-widest">
                        <Minus className="h-4 w-4" /> Neutral / Informational Nodes
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {result.neutral_sentiment.map((point, i) => (
                          <div key={i} className="flex gap-3 items-center p-3 rounded-lg bg-muted/20">
                            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground shrink-0" />
                            <Text variant="caption" className="text-muted-foreground leading-relaxed">{point}</Text>
                          </div>
                        ))}
                      </div>
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
