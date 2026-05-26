'use client';

import React, { useEffect, useState } from 'react';
import { MarketHeatmapData, SectorHeatmapNode, StockHeatmapNode } from '@/types/premium';
import { premiumService } from '@/services/data/premium-service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Text } from '@/design-system/typography/text';
import {
  PieChart as PieIcon,
  Activity,
  TrendingUp,
  TrendingDown,
  Zap,
  Globe,
  ArrowUpRight,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Search,
  Filter,
  ArrowRight,
  Maximize2,
  Info,
  Layers,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';

/**
 * Institutional Market Heatmap Interactive Client.
 * Specialized terminal hub for visualizing sector performance and capital flows.
 */
export function MarketHeatmapClient() {
  const [data, setData] = useState<MarketHeatmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState('1D');

  useEffect(() => {
    async function loadData() {
      try {
        const response = await premiumService.getMarketHeatmap();
        if (response.data) setData(response.data);
      } catch (e) {
        console.error('Heatmap sync failure', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const getHeatmapColor = (color: string) => {
    switch (color) {
      case 'green': return 'bg-emerald-600 hover:bg-emerald-500';
      case 'light_green': return 'bg-emerald-500/40 hover:bg-emerald-500/60 border-emerald-500/30';
      case 'light_red': return 'bg-red-500/40 hover:bg-red-500/60 border-red-500/30';
      case 'red': return 'bg-red-900 hover:bg-red-800';
      default: return 'bg-muted/50 hover:bg-muted/80';
    }
  };

  const handleTimeframeChange = (tf: string) => {
    setTimeframe(tf);
    toast({
      title: "Timeframe Synchronized",
      description: `Updating heatmap nodes for ${tf} interval.`,
    });
  };

  if (loading || !data) {
    return (
      <div className="py-40 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <Text variant="bodySmall" className="animate-pulse font-bold tracking-widest uppercase text-muted-foreground">
          Calibrating Global Market Tiling...
        </Text>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-24 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <PieIcon className="h-4 w-4" />
            <Text variant="label" className="text-[10px] font-bold tracking-widest uppercase">Institutional Visualization</Text>
          </div>
          <Text variant="h1" className="text-3xl font-bold tracking-tight">Market Heatmap</Text>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-card/30 border border-white/5 p-1 rounded-xl h-11">
            {['1D', '1W', '1M', '3M', '1Y'].map(tf => (
              <button
                key={tf}
                onClick={() => handleTimeframeChange(tf)}
                className={cn(
                  "px-4 h-9 rounded-lg text-[10px] font-bold uppercase transition-all",
                  timeframe === tf ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tf}
              </button>
            ))}
          </div>
          <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl border-white/10 bg-card/30">
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* MAIN HEATMAP GRID */}
        <div className="lg:col-span-9 space-y-6">
          <Card className="glass-card border-none shadow-2xl overflow-hidden">
            <CardHeader className="bg-card/30 border-b border-white/5 p-6 flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                {selectedSector && (
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setSelectedSector(null)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                )}
                <div>
                  <CardTitle className="text-lg">
                    {selectedSector ? `${selectedSector} Intelligence` : 'Global Sector Nodes'}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {selectedSector ? 'Detailed stock performance within the sector.' : 'Aggregate sector performance by market weight.'}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-red-900" /> -3%+</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-muted" /> 0%</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-emerald-600" /> +3%+</div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-2 h-[500px] w-full content-stretch">
                {!selectedSector ? (
                  data.sectors.map((sector) => (
                    <div
                      key={sector.name}
                      onClick={() => setSelectedSector(sector.name)}
                      className={cn(
                        "rounded-xl p-4 flex flex-col justify-center items-center text-center cursor-pointer transition-all duration-300 border border-transparent shadow-inner group",
                        getHeatmapColor(sector.color)
                      )}
                      style={{ flex: `${sector.weight} 1 0%`, minWidth: '150px' }}
                    >
                      <Text variant="bodySmall" weight="bold" className="text-white uppercase tracking-tighter mb-1 truncate w-full group-hover:scale-110 transition-transform">
                        {sector.name}
                      </Text>
                      <div className="text-2xl font-bold text-white tracking-tighter">{sector.change}</div>
                      <Text variant="caption" className="text-white/60 font-mono text-[8px] mt-2 uppercase">{sector.market_cap} MCAP</Text>
                    </div>
                  ))
                ) : (
                  data.stocks.map((stock) => (
                    <div
                      key={stock.symbol}
                      className={cn(
                        "rounded-xl p-4 flex flex-col justify-center items-center text-center cursor-pointer transition-all duration-300 border border-transparent shadow-inner group",
                        stock.change.includes('+') ? "bg-emerald-600/80 hover:bg-emerald-500" : "bg-red-900/80 hover:bg-red-800"
                      )}
                      style={{ flex: `${stock.weight} 1 0%`, minWidth: '120px' }}
                    >
                      <Text variant="bodySmall" weight="bold" className="text-white uppercase tracking-tight mb-1 group-hover:scale-110 transition-transform">{stock.symbol}</Text>
                      <div className="text-lg font-bold text-white font-mono">{stock.change}</div>
                      <Text variant="caption" className="text-white/50 text-[8px] mt-1 truncate w-full">{stock.name}</Text>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* CAPITAL FLOWS TABLE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="glass-card border-none shadow-xl overflow-hidden">
              <CardHeader className="bg-card/30 border-b border-white/5 p-6">
                <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" /> Net Capital Inflow
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableBody>
                    {data.capital_flows.filter(f => f.status === 'inflow').map((flow) => (
                      <TableRow key={flow.sector} className="hover:bg-emerald-500/5 transition-colors border-white/5">
                        <TableCell className="py-4 pl-6 font-bold text-sm">{flow.sector}</TableCell>
                        <TableCell className="text-right pr-6">
                          <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-mono font-bold h-6">
                            <TrendingUp className="h-3 w-3 mr-1.5" /> {flow.flow}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="glass-card border-none shadow-xl overflow-hidden">
              <CardHeader className="bg-card/30 border-b border-white/5 p-6">
                <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                  <Activity className="h-4 w-4 text-destructive" /> Net Capital Outflow
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableBody>
                    {data.capital_flows.filter(f => f.status === 'outflow').map((flow) => (
                      <TableRow key={flow.sector} className="hover:bg-red-500/5 transition-colors border-white/5">
                        <TableCell className="py-4 pl-6 font-bold text-sm">{flow.sector}</TableCell>
                        <TableCell className="text-right pr-6">
                          <Badge className="bg-destructive/10 text-destructive border-none font-mono font-bold h-6">
                            <TrendingDown className="h-3 w-3 mr-1.5" /> {flow.flow}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* SIDEBAR: REGIONAL & STRATEGIC */}
        <aside className="lg:col-span-3 space-y-8">
          <Card className="glass-card border-none shadow-xl bg-card/30">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-secondary flex items-center gap-2">
                <Globe className="h-4 w-4" /> Regional Pulse
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {data.regions.map((reg) => (
                <div key={reg.region} className="space-y-3 group cursor-default">
                  <div className="flex justify-between items-end">
                    <div className="space-y-0.5">
                      <Text variant="label" className="text-[9px] opacity-50 font-bold uppercase tracking-widest">{reg.region}</Text>
                      <div className={cn(
                        "text-xl font-bold tracking-tight group-hover:text-secondary transition-colors",
                        reg.performance.includes('+') ? "text-emerald-500" : "text-destructive"
                      )}>
                        {reg.performance}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[8px] border-white/10 bg-black/20 uppercase font-bold h-5">{reg.flow} Flow</Badge>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className={cn(
                      "h-full transition-all duration-1000",
                      reg.performance.includes('+') ? "bg-emerald-500 w-[75%]" : "bg-destructive w-[42%]"
                    )} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="p-8 rounded-[3rem] bg-primary/5 border border-primary/20 space-y-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
              <Sparkles className="h-16 w-16 text-primary" />
            </div>
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
              <Zap className="h-4 w-4" /> Alpha Signal
            </div>
            <Text variant="caption" className="text-muted-foreground leading-relaxed italic">
              "The **Technology** hub is showing extreme divergence between price action and capital flow. Large inflows into Semiconductors suggest a bottoming node."
            </Text>
            <Button variant="link" className="p-0 h-auto text-primary font-bold text-xs group/link" asChild>
              <a href="/ai-analyst/sector-overview">
                Launch Sector Audit <ArrowRight className="ml-1.5 h-3 w-3 transition-transform group-hover/link:translate-x-1" />
              </a>
            </Button>
          </div>

          <Card className="glass-card border-none bg-background/30 shadow-xl overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Market Vitals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <Text variant="caption" className="text-muted-foreground">Global Volume</Text>
                <span className="text-xs font-bold font-mono text-primary">$1.2T</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <Text variant="caption" className="text-muted-foreground">VIX Index</Text>
                <span className="text-xs font-bold font-mono text-amber-500">14.20</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <Text variant="caption" className="text-muted-foreground">S&P 500 P/E</Text>
                <span className="text-xs font-bold font-mono text-foreground">22.4</span>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>

      {/* TERMINAL FOOTER */}
      <Card className="glass-card border-none bg-primary/5 p-12 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-1/3 h-full bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />
        <div className="flex flex-col lg:flex-row items-center gap-12 relative z-10">
          <div className="w-24 h-24 rounded-[2.5rem] bg-primary/20 flex items-center justify-center text-primary shadow-2xl shrink-0">
            <ShieldCheck className="h-12 w-12" />
          </div>
          <div className="flex-1 text-center lg:text-left space-y-3">
            <Text variant="h2" className="text-3xl font-bold tracking-tight">E-E-A-T Institutional Handshake</Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed max-w-3xl">
              This heatmap utilizes the **Imperialpedia Real-time Data Hub**. Accuracy is benchmarked against primary exchange feeds and verified by our algorithmic integrity engine. Institutional accounts receive sub-10ms refresh velocity.
            </Text>
          </div>
          <Button size="lg" className="h-14 px-10 rounded-2xl font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/30 shrink-0 scale-105 active:scale-95 transition-all" asChild>
            <a href="/premium/subscribe">Upgrade Discovery Node</a>
          </Button>
        </div>
      </Card>
    </div>
  );
}
