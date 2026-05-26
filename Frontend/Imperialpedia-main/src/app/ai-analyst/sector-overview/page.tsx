'use client';

import React, { useState } from 'react';
import { generateSectorOverview, SectorOverviewOutput } from '@/ai/flows/sector-overview-flow';
import { Container } from '@/design-system/layout/container';
import { Text } from '@/design-system/typography/text';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Layers, 
  Loader2, 
  Search, 
  TrendingUp, 
  Activity, 
  Zap, 
  Info,
  ArrowRight,
  BarChart3,
  Users,
  Sparkles,
  ShieldAlert,
  ArrowUpRight,
  Target
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

/**
 * AI Sector Overview Dashboard.
 * Specialized tool for generating structured industry intelligence.
 */
export default function SectorOverviewPage() {
  const [sector, setSector] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SectorOverviewOutput | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sector.trim()) return;

    setLoading(true);
    setResult(null);
    
    try {
      const output = await generateSectorOverview({ sector });
      setResult(output);
      toast({
        title: "Industry Audit Complete",
        description: `Sector overview for ${sector.toUpperCase()} has been synthesized.`,
      });
    } catch (error) {
      console.error('AI Sector Engine failure', error);
      toast({
        variant: "destructive",
        title: "Analysis Exception",
        description: "The AI engine encountered an error while scanning the industry landscape.",
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
            <Layers className="h-4 w-4" />
            <Text variant="label" className="text-[10px] font-bold uppercase tracking-widest">Industry Intelligence Node</Text>
          </div>
          <Text variant="h1" className="text-4xl lg:text-6xl font-bold mb-6 tracking-tight">Sector Overview</Text>
          <Text variant="body" className="text-muted-foreground text-lg leading-relaxed">
            Generate high-fidelity industry summaries. Analyze market leaders, performance benchmarks, and emerging risks across any economic sector.
          </Text>
        </header>

        <div className="max-w-2xl mx-auto mb-16">
          <Card className="glass-card shadow-2xl border-primary/20 overflow-hidden">
            <CardContent className="p-6">
              <form onSubmit={handleGenerate} className="flex gap-3">
                <div className="relative flex-1 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input 
                    placeholder="Enter industry or sector (e.g. Semiconductors, DeFi)..." 
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                    className="h-14 pl-12 bg-background/50 border-white/10 rounded-2xl text-lg focus:ring-primary/40 focus:border-primary"
                    disabled={loading}
                  />
                </div>
                <Button 
                  size="lg" 
                  type="submit" 
                  disabled={loading || !sector.trim()} 
                  className="h-14 px-8 rounded-2xl font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all scale-[1.02] active:scale-100"
                >
                  {loading ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : <Sparkles className="mr-2 h-5 w-5" />}
                  {loading ? 'Analyzing...' : 'Scan Sector'}
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
            <Text variant="h3" className="font-bold mb-2">Traversing Industry Segments</Text>
            <Text variant="bodySmall" className="text-muted-foreground text-center max-w-sm">
              Analyzing market concentration, growth benchmarks, and structural headwinds for {sector.toUpperCase()}...
            </Text>
          </div>
        )}

        {result && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Core Analysis */}
              <div className="lg:col-span-8 space-y-8">
                <Card className="glass-card border-none shadow-2xl overflow-hidden">
                  <CardHeader className="bg-primary/5 border-b border-white/5 p-8">
                    <div className="flex justify-between items-start mb-4">
                      <Badge className="bg-primary text-white border-none px-3 py-1 font-bold uppercase tracking-widest text-[10px]">
                        Sector Intelligence
                      </Badge>
                      <div className="flex items-center gap-2 text-primary font-bold text-xs">
                        <Activity className="h-4 w-4" /> Market Pulse Active
                      </div>
                    </div>
                    <CardTitle className="text-3xl font-bold leading-tight">Industry Audit: {sector.toUpperCase()}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <Text variant="body" className="text-lg leading-relaxed text-foreground/80 mb-10 pb-10 border-b border-white/5 italic">
                      {result.overview}
                    </Text>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                      <div className="space-y-6">
                        <div className="flex items-center gap-2 text-secondary font-bold text-sm uppercase tracking-widest">
                          <Users className="h-4 w-4" /> Key Market Players
                        </div>
                        <div className="space-y-3">
                          {result.key_players.map((player, i) => (
                            <div key={i} className="p-4 rounded-xl bg-background/40 border border-white/5 flex items-center justify-between group hover:border-secondary/30 transition-colors">
                              <Text variant="bodySmall" weight="bold">{player}</Text>
                              <Badge variant="outline" className="text-[8px] border-secondary/20 text-secondary">LEADER</Badge>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-widest">
                          <BarChart3 className="h-4 w-4" /> Performance Metrics
                        </div>
                        <div className="space-y-4">
                          <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                            <Text variant="label" className="text-[10px] text-muted-foreground block mb-1">Sector Index</Text>
                            <Text variant="body" weight="bold">{result.performance_metrics.sector_index}</Text>
                          </div>
                          <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                            <Text variant="label" className="text-[10px] text-muted-foreground block mb-1">Growth Velocity (YoY)</Text>
                            <Text variant="body" weight="bold" className="text-emerald-500">{result.performance_metrics.growth_rate}</Text>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-10 pt-10 border-t border-white/5 space-y-6">
                      <div className="flex items-center gap-2 text-muted-foreground font-bold text-sm uppercase tracking-widest">
                        <TrendingUp className="h-4 w-4" /> Recent Industry Trends
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {result.performance_metrics.recent_trends.map((trend, i) => (
                          <div key={i} className="flex gap-3 items-start p-3 rounded-lg bg-muted/20 border border-transparent hover:border-white/5">
                            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                            <Text variant="caption" className="text-muted-foreground leading-relaxed">{trend}</Text>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column: Opportunities & Risks */}
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
                        Conviction is weighted against market concentration and barrier-to-entry benchmarks.
                      </Text>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card border-none">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Zap className="h-5 w-5 text-secondary" /> Opportunity Matrix
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {result.opportunities.map((opt, i) => (
                      <div key={i} className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 flex gap-4 items-start group hover:bg-emerald-500/10 transition-colors">
                        <ArrowUpRight className="h-4 w-4 text-emerald-500 shrink-0 mt-1" />
                        <Text variant="bodySmall" className="text-muted-foreground group-hover:text-foreground transition-colors leading-relaxed">
                          {opt}
                        </Text>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="glass-card border-none">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ShieldAlert className="h-5 w-5 text-destructive" /> Structural Risks
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {result.risks.map((risk, i) => (
                      <div key={i} className="p-4 rounded-xl bg-destructive/5 border border-destructive/10 flex gap-4 items-start group hover:bg-destructive/10 transition-colors">
                        <Target className="h-4 w-4 text-destructive shrink-0 mt-1" />
                        <Text variant="bodySmall" className="text-muted-foreground group-hover:text-foreground transition-colors leading-relaxed">
                          {risk}
                        </Text>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <div className="p-8 rounded-[3rem] border border-primary/20 bg-primary/5 space-y-4 relative overflow-hidden group text-center">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                    <TrendingUp className="h-12 w-12 text-primary" />
                  </div>
                  <Text variant="label" className="text-primary font-bold uppercase">Adjacent Intelligence</Text>
                  <Text variant="h3" className="mb-4">Macro Correlator</Text>
                  <Text variant="bodySmall" className="text-muted-foreground leading-relaxed">
                    How do global economic shifts influence this sector? Run a macro audit to cross-reference interest rates and GDP data.
                  </Text>
                  <Button variant="link" className="p-0 h-auto text-primary font-bold text-xs group/btn" asChild>
                    <a href="/ai-analyst/macro-summary">
                      Launch Macro Scanner <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover/btn:translate-x-1" />
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
