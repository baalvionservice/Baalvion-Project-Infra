'use client';

import React, { useState } from 'react';
import { generateDailyBriefing, DailyBriefingOutput } from '@/ai/flows/daily-briefing-flow';
import { Container } from '@/design-system/layout/container';
import { Text } from '@/design-system/typography/text';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Sparkles, 
  Loader2, 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  MessageSquare, 
  Info,
  ArrowRight,
  Globe,
  Newspaper,
  Target,
  BarChart3,
  Calendar
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

/**
 * AI Daily Briefing Dashboard.
 * Specialized tool for generating a structured digest of market intelligence.
 */
export default function DailyBriefingPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DailyBriefingOutput | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const output = await generateDailyBriefing({ scope: 'Global Markets' });
      setResult(output);
      toast({
        title: "Briefing Synchronized",
        description: "Today's AI Intelligence Digest is ready for review.",
      });
    } catch (error) {
      console.error('AI Briefing failure', error);
      toast({
        variant: "destructive",
        title: "Dispatch Exception",
        description: "The AI engine failed to connect to the global news buffer.",
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
            <Calendar className="h-4 w-4" />
            <Text variant="label" className="text-[10px] font-bold uppercase tracking-widest">
              {format(new Date(), 'MMMM d, yyyy')} • Daily Digest Node
            </Text>
          </div>
          <Text variant="h1" className="text-4xl lg:text-6xl font-bold mb-6 tracking-tight">Daily AI Briefing</Text>
          <Text variant="body" className="text-muted-foreground text-lg leading-relaxed">
            Your daily strategic advantage. AI-synthesized intelligence covering market shifts, social trends, and institutional-grade directives.
          </Text>
          <div className="mt-10">
            <Button 
              size="lg" 
              onClick={handleGenerate} 
              disabled={loading}
              className="h-14 px-10 rounded-2xl font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all scale-[1.05] active:scale-95"
            >
              {loading ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : <Sparkles className="mr-2 h-5 w-5" />}
              {loading ? 'Synthesizing Digest...' : 'Generate Today\'s Briefing'}
            </Button>
          </div>
        </header>

        {loading && !result && (
          <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-500">
            <div className="w-24 h-24 rounded-[2.5rem] bg-primary/10 flex items-center justify-center mb-6 border border-primary/20 relative">
              <div className="absolute inset-0 rounded-[2.5rem] border-2 border-primary/20 animate-ping opacity-20" />
              <Globe className="h-10 w-10 text-primary animate-pulse" />
            </div>
            <Text variant="h3" className="font-bold mb-2 text-primary">Aggregating Global Signals</Text>
            <Text variant="bodySmall" className="text-muted-foreground text-center max-w-sm">
              Processing real-time news, social sentiment nodes, and asset performance metrics...
            </Text>
          </div>
        )}

        {result && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Overview Card */}
            <Card className="glass-card border-none shadow-2xl overflow-hidden bg-primary/5">
              <CardHeader className="bg-primary/5 border-b border-white/5 p-8">
                <div className="flex justify-between items-start mb-4">
                  <Badge className="bg-primary text-white border-none px-3 py-1 font-bold uppercase tracking-widest text-[10px]">
                    Executive Summary
                  </Badge>
                  <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-tighter">
                    <Zap className="h-4 w-4" /> Strategic Pulse Active
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold italic leading-relaxed">
                  "{result.overview}"
                </CardTitle>
              </CardHeader>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Gainers, Losers, and News */}
              <div className="lg:col-span-8 space-y-8">
                {/* Performance Nodes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="glass-card border-none shadow-xl">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-sm font-bold uppercase tracking-widest text-emerald-500 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" /> Top Gainers
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {result.top_gainers.map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                          <Text variant="bodySmall" weight="bold">{item.asset}</Text>
                          <span className="text-sm font-mono font-bold text-emerald-500">{item.change}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card className="glass-card border-none shadow-xl">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-sm font-bold uppercase tracking-widest text-destructive flex items-center gap-2">
                        <TrendingDown className="h-4 w-4" /> Top Losers
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {result.top_losers.map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-destructive/5 border border-destructive/10">
                          <Text variant="bodySmall" weight="bold">{item.asset}</Text>
                          <span className="text-sm font-mono font-bold text-destructive">{item.change}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                {/* Global Event Stream */}
                <Card className="glass-card border-none shadow-xl">
                  <CardHeader className="bg-card/30 border-b border-white/5">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Newspaper className="h-5 w-5 text-primary" /> Key News & Events
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    {result.key_news_events.map((event, i) => (
                      <div key={i} className="flex gap-4 items-start group">
                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0 group-hover:scale-150 transition-transform" />
                        <Text variant="bodySmall" className="text-muted-foreground group-hover:text-foreground transition-colors leading-relaxed">
                          {event}
                        </Text>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Right Column: Sentiment & Recommendations */}
              <div className="lg:col-span-4 space-y-8">
                {/* Confidence Card */}
                <Card className="glass-card border-none shadow-xl bg-card/30">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Briefing Conviction</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-end mb-1">
                      <div className="text-4xl font-bold text-primary">{result.confidence_score}</div>
                      <Text variant="label" className="text-[10px] opacity-50">Score / 100</Text>
                    </div>
                    <Progress value={result.confidence_score} className="h-2" />
                  </CardContent>
                </Card>

                {/* Sentiment Highlights */}
                <Card className="glass-card border-none shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-widest text-secondary">
                      <MessageSquare className="h-4 w-4" /> Social Pulse
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {result.social_sentiment_highlights.map((highlight, i) => (
                      <div key={i} className="p-4 rounded-xl bg-secondary/5 border border-secondary/10 italic text-xs text-muted-foreground leading-relaxed">
                        "{highlight}"
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* AI Recommendations */}
                <Card className="glass-card border-none shadow-2xl bg-primary/5 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                    <Target className="h-16 w-16 text-primary" />
                  </div>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                      <Zap className="h-4 w-4" /> Actionable Intelligence
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {result.ai_recommendations.map((rec, i) => (
                      <div key={i} className="flex gap-3 items-start">
                        <div className="mt-1 w-4 h-4 rounded bg-primary/20 flex items-center justify-center text-primary shrink-0">
                          <ArrowRight className="h-2.5 w-2.5" />
                        </div>
                        <Text variant="caption" className="font-bold leading-relaxed">{rec}</Text>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <div className="p-8 rounded-[3rem] border border-secondary/20 bg-secondary/5 text-center space-y-4">
                  <Text variant="label" className="text-secondary font-bold">Deep Discovery</Text>
                  <Text variant="h4" className="font-bold">Need Asset Specifics?</Text>
                  <Text variant="caption" className="text-muted-foreground leading-relaxed block">
                    Target individual assets for high-fidelity bull and bear case modeling.
                  </Text>
                  <Button variant="link" className="text-secondary font-bold text-xs" asChild>
                    <a href="/ai-analyst/bull-case">Explore Analyst Suite <ArrowRight className="ml-1 h-3 w-3" /></a>
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
