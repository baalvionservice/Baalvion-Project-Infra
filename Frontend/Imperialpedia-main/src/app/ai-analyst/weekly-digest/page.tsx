'use client';

import React, { useState } from 'react';
import { generateWeeklyDigest, WeeklyDigestOutput } from '@/ai/flows/weekly-digest-flow';
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
  CalendarDays,
  History
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format, subDays } from 'date-fns';
import { cn } from '@/lib/utils';

/**
 * AI Weekly Digest Dashboard.
 * Specialized tool for generating a structured retrospective of market intelligence over a 7-day period.
 */
export default function WeeklyDigestPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WeeklyDigestOutput | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const output = await generateWeeklyDigest({ scope: 'Global Markets' });
      setResult(output);
      toast({
        title: "Intelligence Synchronized",
        description: "The Weekly AI Retrospective is ready for review.",
      });
    } catch (error) {
      console.error('AI Weekly Digest failure', error);
      toast({
        variant: "destructive",
        title: "Retrospective Exception",
        description: "The AI engine failed to aggregate the weekly data buffer.",
      });
    } finally {
      setLoading(false);
    }
  };

  const lastWeekRange = `${format(subDays(new Date(), 7), 'MMM d')} – ${format(new Date(), 'MMM d, yyyy')}`;

  return (
    <main className="min-h-screen bg-background pb-20 pt-12">
      <Container>
        <header className="mb-12 max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 border border-secondary/20 text-secondary mb-6">
            <CalendarDays className="h-4 w-4" />
            <Text variant="label" className="text-[10px] font-bold uppercase tracking-widest">
              {lastWeekRange} • Weekly Digest Node
            </Text>
          </div>
          <Text variant="h1" className="text-4xl lg:text-6xl font-bold mb-6 tracking-tight">Weekly AI Digest</Text>
          <Text variant="body" className="text-muted-foreground text-lg leading-relaxed">
            Your strategic retrospective. AI-synthesized intelligence capturing the last 7 days of market shifts, sector rotations, and institutional directives.
          </Text>
          <div className="mt-10">
            <Button 
              size="lg" 
              onClick={handleGenerate} 
              disabled={loading}
              className="h-14 px-10 rounded-2xl font-bold bg-secondary hover:bg-secondary/90 text-secondary-foreground shadow-xl shadow-secondary/20 transition-all scale-[1.05] active:scale-95"
            >
              {loading ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : <History className="mr-2 h-5 w-5" />}
              {loading ? 'Aggregating Cycle...' : 'Generate Weekly Retrospective'}
            </Button>
          </div>
        </header>

        {loading && !result && (
          <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-500">
            <div className="w-24 h-24 rounded-[2.5rem] bg-secondary/10 flex items-center justify-center mb-6 border border-secondary/20 relative">
              <div className="absolute inset-0 rounded-[2.5rem] border-2 border-secondary/20 animate-ping opacity-20" />
              <BarChart3 className="h-10 w-10 text-secondary animate-pulse" />
            </div>
            <Text variant="h3" className="font-bold mb-2 text-secondary">Aggregating Weekly Matrix</Text>
            <Text variant="bodySmall" className="text-muted-foreground text-center max-w-sm">
              Analyzing sector rotations, historical news buffers, and longitudinal sentiment shifts...
            </Text>
          </div>
        )}

        {result && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Overview Card */}
            <Card className="glass-card border-none shadow-2xl overflow-hidden bg-secondary/5">
              <CardHeader className="bg-secondary/5 border-b border-white/5 p-8">
                <div className="flex justify-between items-start mb-4">
                  <Badge className="bg-secondary text-secondary-foreground border-none px-3 py-1 font-bold uppercase tracking-widest text-[10px]">
                    Cycle Retrospective
                  </Badge>
                  <div className="flex items-center gap-2 text-secondary font-bold text-xs uppercase tracking-tighter">
                    <History className="h-4 w-4" /> 7-Day Context Active
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold italic leading-relaxed">
                  "{result.overview}"
                </CardTitle>
              </CardHeader>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Performance & News */}
              <div className="lg:col-span-8 space-y-8">
                {/* Performance Matrix */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="glass-card border-none shadow-xl">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-sm font-bold uppercase tracking-widest text-emerald-500 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" /> Top Weekly Performance
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {result.top_performing_assets.map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                          <Text variant="bodySmall" weight="bold">{item.asset}</Text>
                          <span className="text-sm font-mono font-bold text-emerald-500">{item.weekly_change}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card className="glass-card border-none shadow-xl">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-sm font-bold uppercase tracking-widest text-destructive flex items-center gap-2">
                        <TrendingDown className="h-4 w-4" /> Worst Weekly Performance
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {result.worst_performing_assets.map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-destructive/5 border border-destructive/10">
                          <Text variant="bodySmall" weight="bold">{item.asset}</Text>
                          <span className="text-sm font-mono font-bold text-destructive">{item.weekly_change}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                {/* News & Macro Stream */}
                <Card className="glass-card border-none shadow-xl">
                  <CardHeader className="bg-card/30 border-b border-white/5">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Newspaper className="h-5 w-5 text-secondary" /> Significant Cycle Events
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    {result.key_news_events.map((event, i) => (
                      <div key={i} className="flex gap-4 items-start group">
                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-secondary shrink-0 group-hover:scale-150 transition-transform" />
                        <Text variant="bodySmall" className="text-muted-foreground group-hover:text-foreground transition-colors leading-relaxed">
                          {event}
                        </Text>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Right Column: Trends & Directives */}
              <div className="lg:col-span-4 space-y-8">
                {/* Confidence Card */}
                <Card className="glass-card border-none shadow-xl bg-card/30">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Retrospective Conviction</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-end mb-1">
                      <div className="text-4xl font-bold text-secondary">{result.confidence_score}</div>
                      <Text variant="label" className="text-[10px] opacity-50">Score / 100</Text>
                    </div>
                    <Progress value={result.confidence_score} className="h-2 bg-secondary/20" />
                  </CardContent>
                </Card>

                {/* Sentiment Drift */}
                <Card className="glass-card border-none shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-widest text-primary">
                      <MessageSquare className="h-4 w-4" /> Sentiment Drift
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {result.social_sentiment_trends.map((trend, i) => (
                      <div key={i} className="p-4 rounded-xl bg-primary/5 border border-primary/10 italic text-xs text-muted-foreground leading-relaxed">
                        "{trend}"
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* AI Insights */}
                <Card className="glass-card border-none shadow-2xl bg-secondary/5 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                    <Target className="h-16 w-16 text-secondary" />
                  </div>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-sm font-bold uppercase tracking-widest text-secondary flex items-center gap-2">
                      <Zap className="h-4 w-4" /> Strategic Directives
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {result.ai_insights_recommendations.map((rec, i) => (
                      <div key={i} className="flex gap-3 items-start">
                        <div className="mt-1 w-4 h-4 rounded bg-secondary/20 flex items-center justify-center text-secondary shrink-0">
                          <ArrowRight className="h-2.5 w-2.5" />
                        </div>
                        <Text variant="caption" className="font-bold leading-relaxed">{rec}</Text>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <div className="p-8 rounded-[3rem] border border-primary/20 bg-primary/5 text-center space-y-4">
                  <Text variant="label" className="text-primary font-bold">Cycle Preparation</Text>
                  <Text variant="h4" className="font-bold">Next Cycle Outlook?</Text>
                  <Text variant="bodySmall" className="text-muted-foreground leading-relaxed block">
                    Use the Daily Briefing node to stay updated on real-time shifts starting tomorrow morning.
                  </Text>
                  <Button variant="link" className="text-primary font-bold text-xs" asChild>
                    <a href="/ai-analyst/daily-briefing">Access Daily Briefing <ArrowRight className="ml-1 h-3 w-3" /></a>
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
