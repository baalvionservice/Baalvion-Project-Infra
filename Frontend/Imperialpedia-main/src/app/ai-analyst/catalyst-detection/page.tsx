'use client';

import React, { useState } from 'react';
import { detectCatalysts, CatalystDetectionOutput } from '@/ai/flows/catalyst-detection-flow';
import { Container } from '@/design-system/layout/container';
import { Text } from '@/design-system/typography/text';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Zap, 
  Loader2, 
  Search, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Info,
  Activity,
  ArrowRight,
  Target,
  BarChart3
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

/**
 * AI Catalyst Detection Dashboard.
 * Specialized tool for identifying key market drivers and upcoming events for an asset.
 */
export default function CatalystDetectionPage() {
  const [asset, setAsset] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CatalystDetectionOutput | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asset.trim()) return;

    setLoading(true);
    setResult(null);
    
    try {
      const output = await detectCatalysts({ asset });
      setResult(output);
      toast({
        title: "Intelligence Synchronized",
        description: `Catalyst matrix for ${asset.toUpperCase()} has been generated.`,
      });
    } catch (error) {
      console.error('AI Analyst failure', error);
      toast({
        variant: "destructive",
        title: "Generation Exception",
        description: "The AI engine encountered an error while scanning the catalyst index.",
      });
    } finally {
      setLoading(false);
    }
  };

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'Positive':
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-bold uppercase text-[9px] px-2 h-5">Bullish</Badge>;
      case 'Negative':
        return <Badge variant="destructive" className="font-bold uppercase text-[9px] px-2 h-5">Bearish</Badge>;
      default:
        return <Badge variant="outline" className="text-muted-foreground border-white/10 text-[9px] font-bold uppercase px-2 h-5">Neutral</Badge>;
    }
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'Positive': return <TrendingUp className="h-4 w-4 text-emerald-500" />;
      case 'Negative': return <TrendingDown className="h-4 w-4 text-destructive" />;
      default: return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <main className="min-h-screen bg-background pb-20 pt-12">
      <Container>
        <header className="mb-12 max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary mb-6">
            <Zap className="h-4 w-4" />
            <Text variant="label" className="text-[10px] font-bold uppercase tracking-widest">Market Driver Index</Text>
          </div>
          <Text variant="h1" className="text-4xl lg:text-6xl font-bold mb-6 tracking-tight">Catalyst Detection</Text>
          <Text variant="body" className="text-muted-foreground text-lg leading-relaxed">
            Identify upcoming events and macro factors that will drive price action. Stay ahead of earnings, regulatory shifts, and technological breakthroughs.
          </Text>
        </header>

        <div className="max-w-2xl mx-auto mb-16">
          <Card className="glass-card shadow-2xl border-primary/20 overflow-hidden">
            <CardContent className="p-6">
              <form onSubmit={handleGenerate} className="flex gap-3">
                <div className="relative flex-1 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input 
                    placeholder="Enter asset symbol (e.g. AAPL, BTC, Gold)..." 
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
                  {loading ? 'Scanning...' : 'Scan Catalysts'}
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
            <Text variant="h3" className="font-bold mb-2">Synthesizing Alpha Signals</Text>
            <Text variant="bodySmall" className="text-muted-foreground text-center max-w-sm">
              Analyzing earnings calendars, regulatory filings, and macro trends for {asset.toUpperCase()}...
            </Text>
          </div>
        )}

        {result && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Overview & Catalysts */}
              <div className="lg:col-span-8 space-y-8">
                <Card className="glass-card border-none shadow-2xl overflow-hidden">
                  <CardHeader className="bg-primary/5 border-b border-white/5 p-8">
                    <div className="flex justify-between items-start mb-4">
                      <Badge className="bg-primary text-white border-none px-3 py-1 font-bold uppercase tracking-widest text-[10px]">
                        Event Intelligence
                      </Badge>
                      <div className="flex items-center gap-2 text-primary font-bold text-xs">
                        <Activity className="h-4 w-4" /> Market Pulse Active
                      </div>
                    </div>
                    <CardTitle className="text-3xl font-bold leading-tight">Catalyst Analysis: {asset.toUpperCase()}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <Text variant="body" className="text-lg leading-relaxed text-foreground/80 mb-10 pb-10 border-b border-white/5">
                      {result.overview}
                    </Text>

                    <div className="space-y-6">
                      <div className="flex items-center gap-2 text-muted-foreground font-bold text-sm uppercase tracking-widest">
                        <Activity className="h-4 w-4" /> Strategic Drivers
                      </div>
                      <div className="space-y-4">
                        {result.catalysts.map((catalyst, idx) => (
                          <div key={idx} className="p-6 rounded-2xl bg-background/40 border border-white/5 space-y-4 group hover:border-primary/30 transition-all">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-background/50 border border-white/10">
                                  {getImpactIcon(catalyst.impact)}
                                </div>
                                <Text variant="body" weight="bold">{catalyst.description}</Text>
                              </div>
                              <div className="flex items-center gap-3">
                                {getImpactBadge(catalyst.impact)}
                                <Badge variant="outline" className="text-[10px] font-mono opacity-50">{catalyst.confidence_score}% Conf.</Badge>
                              </div>
                            </div>
                            
                            <div className="pl-11 border-l-2 border-white/5 ml-5">
                              <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10">
                                <Target className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                <div>
                                  <Text variant="label" className="text-primary mb-1">Recommended Action</Text>
                                  <Text variant="bodySmall" className="text-muted-foreground leading-relaxed">
                                    {catalyst.recommended_action}
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

              {/* Right Column: Context & Next Steps */}
              <div className="lg:col-span-4 space-y-8">
                <Card className="glass-card border-none shadow-xl bg-card/30">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Analyst Insight</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="p-6 rounded-[2rem] bg-primary/5 border border-primary/20 space-y-4">
                      <Text variant="label" className="text-primary font-bold">Execution Strategy</Text>
                      <Text variant="caption" className="text-muted-foreground leading-relaxed italic">
                        "The identified catalysts for {asset.toUpperCase()} suggest a period of high-volatility opportunity. Focus on the Positive drivers to capture asymmetric upside while utilizing tight stops against the Negative regulatory nodes."
                      </Text>
                    </div>

                    <div className="pt-4 border-t border-white/5 space-y-4">
                      <div className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Adjacent Analysis</div>
                      <div className="grid grid-cols-1 gap-2">
                        <Button variant="ghost" className="justify-between h-10 rounded-xl hover:bg-emerald-500/10 hover:text-emerald-500 text-xs font-bold" asChild>
                          <Link href="/ai-analyst/bull-case">
                            View Full Bull Case <ArrowRight className="h-3 w-3" />
                          </Link>
                        </Button>
                        <Button variant="ghost" className="justify-between h-10 rounded-xl hover:bg-destructive/10 hover:text-destructive text-xs font-bold" asChild>
                          <Link href="/ai-analyst/bear-case">
                            View Full Bear Case <ArrowRight className="h-3 w-3" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="p-8 rounded-[3rem] border border-secondary/20 bg-secondary/5 space-y-4 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                    <BarChart3 className="h-12 w-12 text-secondary" />
                  </div>
                  <Text variant="label" className="text-secondary font-bold">Risk Management</Text>
                  <Text variant="h3" className="mb-4">Anomaly Guard</Text>
                  <Text variant="bodySmall" className="text-muted-foreground leading-relaxed">
                    Protect your capital. Run a structural audit to detect price anomalies before the next catalyst event.
                  </Text>
                  <Button variant="link" className="p-0 h-auto text-secondary font-bold text-xs group/btn" asChild>
                    <Link href="/ai-analyst/risk-detection">
                      Launch Anomaly Scanner <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover/btn:translate-x-1" />
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

import Link from 'next/link';
