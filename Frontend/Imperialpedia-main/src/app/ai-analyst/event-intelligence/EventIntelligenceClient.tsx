'use client';

import React, { useEffect, useState } from 'react';
import { EventIntelligenceData, CatalystEvent, EarningsSummaryDetail } from '@/types/analytics';
import { analyticsService } from '@/services/data/analytics-service';
import { Container } from '@/design-system/layout/container';
import { Text } from '@/design-system/typography/text';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Zap, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  AlertTriangle, 
  Calendar, 
  PieChart, 
  Activity, 
  BarChart3,
  Loader2,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  Info,
  DollarSign,
  Target
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  Legend
} from 'recharts';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

/**
 * AI Event Intelligence Dashboard Client.
 * Specialized hub for monitoring market catalysts and corporate earnings summaries.
 */
export function EventIntelligenceClient() {
  const [data, setData] = useState<EventIntelligenceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await analyticsService.getEventIntelligence();
        if (response.data) setData(response.data);
      } catch (e) {
        console.error('Failed to sync event intelligence', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading || !data) {
    return (
      <div className="py-40 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <Text variant="bodySmall" className="animate-pulse font-bold tracking-widest uppercase text-muted-foreground">
          Establishing Intelligence Handshake...
        </Text>
      </div>
    );
  }

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'High':
        return <Badge variant="destructive" className="font-bold uppercase text-[9px] px-2 h-5">High Impact</Badge>;
      case 'Medium':
        return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 font-bold uppercase text-[9px] px-2 h-5">Medium</Badge>;
      default:
        return <Badge variant="outline" className="text-muted-foreground border-white/10 text-[9px] font-bold uppercase px-2 h-5">Low</Badge>;
    }
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'High': return <Zap className="h-4 w-4 text-destructive" />;
      case 'Medium': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      default: return <Info className="h-4 w-4 text-primary" />;
    }
  };

  const earningsChartData = data.earnings_summaries.map(e => ({
    name: e.symbol,
    Estimated: e.estimated_eps,
    Actual: e.actual_eps
  }));

  return (
    <div className="space-y-10 pb-24 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <Calendar className="h-4 w-4" />
            <Text variant="label" className="text-[10px] font-bold tracking-widest uppercase">System Events Matrix</Text>
          </div>
          <Text variant="h1" className="text-3xl font-bold tracking-tight">Event Intelligence Hub</Text>
          <Text variant="bodySmall" className="text-muted-foreground mt-1">
            Synthesized overview of high-velocity catalysts and fiscal audits.
          </Text>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl h-11 border-white/10 bg-card/30">
            <Activity className="mr-2 h-4 w-4" /> Real-time Feed
          </Button>
          <Button className="rounded-xl h-11 px-8 font-bold shadow-lg shadow-primary/20 bg-primary">
            Export Intelligence
          </Button>
        </div>
      </header>

      <Tabs defaultValue="catalysts" className="space-y-10">
        <TabsList className="bg-card/30 border border-white/5 p-1 h-14 rounded-2xl w-full md:w-auto justify-start">
          <TabsTrigger value="catalysts" className="px-8 h-12 gap-2 text-sm font-bold rounded-xl data-[state=active]:bg-primary">
            <Zap className="h-4 w-4" /> Upcoming Catalysts ({data.catalysts.length})
          </TabsTrigger>
          <TabsTrigger value="earnings" className="px-8 h-12 gap-2 text-sm font-bold rounded-xl data-[state=active]:bg-primary">
            <DollarSign className="h-4 w-4" /> Fiscal Audits ({data.earnings_summaries.length})
          </TabsTrigger>
        </TabsList>

        {/* CATALYSTS TAB */}
        <TabsContent value="catalysts" className="mt-0 space-y-8 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {data.catalysts.map((event, i) => (
              <Card key={i} className="glass-card border-none transition-all hover:translate-y-[-4px] group">
                <CardHeader className="bg-card/30 border-b border-white/5 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 rounded-2xl bg-background/50 border border-white/5 text-primary group-hover:bg-primary group-hover:text-white transition-all">
                      {getImpactIcon(event.impact)}
                    </div>
                    {getImpactBadge(event.impact)}
                  </div>
                  <div className="space-y-1">
                    <Text variant="body" weight="bold" className="group-hover:text-primary transition-colors">{event.asset_name}</Text>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-[9px] border-white/10">{event.symbol}</Badge>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{event.type}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-background/40 border border-white/5">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-bold">{format(new Date(event.date), 'MMM d, yyyy')}</span>
                    </div>
                    <Text variant="caption" className="text-primary font-bold uppercase tracking-tighter">Scheduled</Text>
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0 border-t border-white/5 bg-card/10 mt-2">
                  <Button variant="ghost" size="sm" className="w-full text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary mt-2 group/btn">
                    Set Probability Hedge <ChevronRight className="ml-1 h-3 w-3 transition-transform group-hover/btn:translate-x-1" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          <div className="p-8 rounded-[3rem] border-2 border-dashed border-white/5 bg-card/10 text-center space-y-4">
            <div className="w-16 h-16 rounded-[2rem] bg-muted/20 flex items-center justify-center mx-auto mb-2">
              <Plus className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <Text variant="h4" className="font-bold">Missing an event node?</Text>
            <Text variant="bodySmall" className="text-muted-foreground max-w-sm mx-auto">
              Pro users can submit manual catalyst requests for institutional audit by platform leads.
            </Text>
            <Button variant="outline" className="rounded-xl border-primary/20 text-primary hover:bg-primary/5 font-bold h-11 px-8">
              Request Manual Node
            </Button>
          </div>
        </TabsContent>

        {/* EARNINGS TAB */}
        <TabsContent value="earnings" className="mt-0 space-y-10 animate-in fade-in duration-500">
          {/* Variance Chart */}
          <Card className="glass-card border-none shadow-2xl overflow-hidden">
            <CardHeader className="bg-card/30 border-b border-white/5 p-8 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl">EPS Variance Matrix</CardTitle>
                <CardDescription>Visualizing performance against analyst expectations for this cycle.</CardDescription>
              </div>
              <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary text-[10px] font-bold h-6 px-3">FISCAL Q1</Badge>
            </CardHeader>
            <CardContent className="p-8 h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={earningsChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis dataKey="name" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#1C1822', border: '1px solid #ffffff10', borderRadius: '12px' }} />
                  <Legend verticalAlign="top" height={36} />
                  <Bar dataKey="Estimated" fill="#69B9FF" radius={[4, 4, 0, 0]} barSize={30} />
                  <Bar dataKey="Actual" fill="#8272F2" radius={[4, 4, 0, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {data.earnings_summaries.map((earn, i) => {
              const isBeat = earn.actual_eps >= earn.estimated_eps;
              return (
                <Card key={i} className="glass-card border-none overflow-hidden hover:border-primary/30 transition-all group">
                  <CardHeader className="p-8 pb-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <Text variant="h3" className="font-bold group-hover:text-primary transition-colors">{earn.asset_name}</Text>
                        <Text variant="caption" className="text-muted-foreground uppercase font-bold tracking-widest">{earn.symbol} • {earn.date}</Text>
                      </div>
                      <Badge className={cn(
                        "border-none text-[10px] font-bold px-3 h-6 uppercase",
                        isBeat ? "bg-emerald-500 text-white" : "bg-destructive text-white"
                      )}>
                        {isBeat ? 'EPS Beat' : 'EPS Miss'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8 pt-4 space-y-8">
                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <Text variant="label" className="text-[9px] opacity-50 font-bold uppercase">EPS Audit</Text>
                        <div className="flex items-end gap-3">
                          <span className="text-2xl font-bold font-mono">${earn.actual_eps}</span>
                          <span className="text-xs text-muted-foreground mb-1 italic">est. ${earn.estimated_eps}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Text variant="label" className="text-[9px] opacity-50 font-bold uppercase">Revenue Hub</Text>
                        <div className="flex items-end gap-3">
                          <span className="text-2xl font-bold font-mono">{earn.actual_revenue}</span>
                          <span className="text-xs text-muted-foreground mb-1 italic">est. {earn.estimated_revenue}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-background/50 border border-white/5 space-y-3">
                      <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase">
                        <Target className="h-3.5 w-3.5" /> Analyst Memo
                      </div>
                      <Text variant="caption" className="text-muted-foreground leading-relaxed italic block">
                        "{earn.notes}"
                      </Text>
                    </div>
                  </CardContent>
                  <CardFooter className="px-8 py-4 bg-muted/10 border-t border-white/5">
                    <Button variant="link" className="p-0 h-auto text-primary text-xs font-bold group/link" asChild>
                      <a href={`/articles/${earn.symbol.toLowerCase()}-audit`}>
                        Full Fiscal Analysis <ArrowRight className="ml-1.5 h-3 w-3 transition-transform group-hover/link:translate-x-1" />
                      </a>
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Strategic Directive Footer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="glass-card bg-primary/5 border-primary/20 p-8 flex flex-col gap-4">
          <div className="p-4 rounded-[2rem] bg-primary/10 w-fit text-primary">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <div>
            <Text variant="h3" className="mb-2 text-xl font-bold">Event Volatility Logic</Text>
            <Text variant="bodySmall" className="text-muted-foreground leading-relaxed">
              Catalyst impacts are weighted against **Institutional Liquidity Depth** and historical return variance during similar cycle events. 'High' impact nodes typically trigger a ±5% shift in primary discovery clusters.
            </Text>
          </div>
        </Card>
        
        <Card className="glass-card border-secondary/20 p-8 flex flex-col gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <BarChart3 className="h-24 w-24 text-secondary rotate-12" />
          </div>
          <div className="p-4 rounded-[2rem] bg-secondary/10 w-fit text-secondary">
            <Target className="h-8 w-8" />
          </div>
          <div>
            <Text variant="h3" className="mb-2 text-xl font-bold">Execution Alpha</Text>
            <Text variant="bodySmall" className="text-muted-foreground leading-relaxed">
              Always cross-reference earnings summaries with the **Scenario Modeler** to identify post-fiscal floor levels. EPS beats accompanied by guidance revisions are currently yielding 2.4x higher alpha in the Tech taxonomy.
            </Text>
          </div>
        </Card>
      </div>
    </div>
  );
}

import { Plus } from 'lucide-react';
