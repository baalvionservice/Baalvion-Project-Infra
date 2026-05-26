"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  ScreenerDashboardData,
  ScreenerAsset,
  ScreenerNode,
  CustomStrategy,
} from "@/types/premium";
import { premiumService } from "@/services/data/premium-service";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Text } from "@/design-system/typography/text";
import {
  Search,
  Filter,
  Zap,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Activity,
  Star,
  ChevronRight,
  ArrowUpRight,
  Plus,
  Trash2,
  Settings2,
  Sparkles,
  Layers,
  Database,
  ShieldCheck,
  RefreshCw,
  Loader2,
  Bookmark,
  ArrowRight,
  Info,
  Flame,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

/**
 * Advanced Asset Screener & Strategy Builder Dashboard Client.
 * Specialized terminal interface for institutional-grade market discovery.
 */
export function ScreenerClient() {
  const [data, setData] = useState<ScreenerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeStrategy, setActiveStrategy] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await premiumService.getScreenerData();
        if (response.data) setData(response.data);
      } catch (e) {
        console.error("Screener sync failure", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleAction = (label: string) => {
    toast({
      title: "Action Initiated",
      description: `Targeting discovery node: ${label}`,
    });
  };

  const toggleStrategy = (name: string) => {
    if (!data) return;
    setData({
      ...data,
      strategies: data.strategies.map((s) =>
        s.strategy_name === name
          ? {
              ...s,
              status:
                s.status === "mock_active" ? "mock_inactive" : "mock_active",
            }
          : s
      ),
    });
    toast({
      title: "Strategy State Shifted",
      description: `Instructional logic for "${name}" has been synchronized.`,
    });
  };

  if (loading || !data) {
    return (
      <div className="py-40 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <Text
          variant="bodySmall"
          className="animate-pulse font-bold tracking-widest uppercase text-muted-foreground"
        >
          Calibrating Discovery Matrix...
        </Text>
      </div>
    );
  }

  const filteredAssets = data.assets.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.symbol.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-10 pb-24 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <Search className="h-4 w-4" />
            <Text
              variant="label"
              className="text-[10px] font-bold tracking-widest uppercase"
            >
              Pro Discovery Hub
            </Text>
          </div>
          <Text variant="h1" className="text-3xl font-bold tracking-tight">
            Advanced Asset Screener
          </Text>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="rounded-xl border-white/10 bg-card/30 h-11 px-6"
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Synchronize Feed
          </Button>
          <Button className="rounded-xl shadow-lg shadow-primary/20 font-bold bg-primary hover:bg-primary/90 h-11 px-8 transition-all scale-105 active:scale-95">
            <Plus className="mr-2 h-4 w-4" /> Save New Screener
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* FILTER SIDEBAR & PRESETS */}
        <aside className="lg:col-span-3 space-y-8">
          <Card className="glass-card border-none shadow-xl">
            <CardHeader className="bg-card/30 border-b border-white/5 p-6">
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                <Filter className="h-4 w-4 text-primary" /> Filter Matrix
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
              {/* Category: Market Data */}
              <div className="space-y-4">
                <Text
                  variant="label"
                  className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider"
                >
                  Market Dynamics
                </Text>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-bold">
                      Market Cap Range
                    </Label>
                    <Select defaultValue="large">
                      <SelectTrigger className="h-9 bg-background/50 border-white/5 text-[10px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="large">
                          Mega/Large (&gt;$10B)
                        </SelectItem>
                        <SelectItem value="mid">
                          Mid-Cap ($2B - $10B)
                        </SelectItem>
                        <SelectItem value="small">
                          Small-Cap (&lt;$2B)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-bold">
                      24h Price Variance
                    </Label>
                    <Select defaultValue="positive">
                      <SelectTrigger className="h-9 bg-background/50 border-white/5 text-[10px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="positive">
                          Bullish (&gt;0%)
                        </SelectItem>
                        <SelectItem value="negative">
                          Bearish (&lt;0%)
                        </SelectItem>
                        <SelectItem value="vol">High Vol (&gt;5%)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Category: Financial Metrics */}
              <div className="space-y-4">
                <Text
                  variant="label"
                  className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider"
                >
                  Financial Vitals
                </Text>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-bold">
                      Max P/E Ratio
                    </Label>
                    <Input
                      placeholder="e.g. 25"
                      className="h-9 bg-background/50 border-white/5 text-[10px]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-bold">
                      Min Revenue Growth (%)
                    </Label>
                    <Input
                      placeholder="e.g. 15"
                      className="h-9 bg-background/50 border-white/5 text-[10px]"
                    />
                  </div>
                </div>
              </div>

              {/* Category: Sentiment Pulses */}
              <div className="space-y-4">
                <Text
                  variant="label"
                  className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider"
                >
                  Psychology Pulses
                </Text>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-background/50 border border-white/5">
                    <Text variant="caption" weight="bold">
                      Social Sentiment
                    </Text>
                    <Switch checked />
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-background/50 border border-white/5">
                    <Text variant="caption" weight="bold">
                      Retail Momentum
                    </Text>
                    <Switch />
                  </div>
                </div>
              </div>

              <Button className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 font-bold text-xs shadow-lg shadow-primary/20">
                Run Discovery Engine
              </Button>
            </CardContent>
          </Card>

          {/* Saved Screeners List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <Text
                variant="h4"
                className="font-bold text-xs uppercase tracking-widest text-muted-foreground"
              >
                Saved Presets
              </Text>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Settings2 className="h-3 w-3" />
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {data.screeners.map((screener) => (
                <Card
                  key={screener.name}
                  className="glass-card border-none hover:border-primary/20 transition-all cursor-pointer group"
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="space-y-1">
                      <Text
                        variant="bodySmall"
                        weight="bold"
                        className="group-hover:text-primary transition-colors"
                      >
                        {screener.name}
                      </Text>
                      <div className="flex items-center gap-2 text-[8px] text-muted-foreground font-mono uppercase">
                        <Activity className="h-2 w-2" /> {screener.results}{" "}
                        Nodes Found
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </aside>

        {/* MAIN RESULTS & STRATEGY SECTION */}
        <div className="lg:col-span-9 space-y-10">
          {/* STRATEGY BUILDER CONSOLE */}
          <Card className="glass-card border-none bg-primary/5 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
              <Sparkles className="h-48 w-48 text-primary" />
            </div>
            <CardHeader className="p-8 border-b border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                    <Target className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">
                      Custom Strategy Architect
                    </CardTitle>
                    <CardDescription>
                      Synthesize automated discovery logic using instructional
                      nodes.
                    </CardDescription>
                  </div>
                </div>
                <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px] font-bold tracking-widest px-3 h-7">
                  ALPHA BUILDER
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-10">
              {/* Visual Rule Builder Mocks */}
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="bg-background/50 px-4 py-2 rounded-lg border border-white/5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    IF
                  </div>
                  <div className="flex-1 p-4 rounded-2xl bg-background/40 border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-secondary/10 text-secondary">
                        <Activity className="h-4 w-4" />
                      </div>
                      <Text variant="bodySmall" weight="bold">
                        Relative Strength Index (RSI)
                      </Text>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-bold text-primary">
                        &lt;
                      </span>
                      <Input
                        defaultValue="30"
                        className="w-16 h-8 bg-background/50 border-white/5 text-center font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="bg-primary/20 px-4 py-2 rounded-lg border border-primary/20 text-[10px] font-bold text-primary uppercase tracking-widest">
                    AND
                  </div>
                  <div className="flex-1 p-4 rounded-2xl bg-background/40 border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                        <Flame className="h-4 w-4" />
                      </div>
                      <Text variant="bodySmall" weight="bold">
                        Social Sentiment Score
                      </Text>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-bold text-primary">
                        &gt;
                      </span>
                      <Input
                        defaultValue="70"
                        className="w-16 h-8 bg-background/50 border-white/5 text-center font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-center pt-2">
                  <Button
                    variant="outline"
                    className="h-10 px-6 border-dashed border-primary/20 text-primary hover:bg-primary/5 rounded-xl text-[10px] font-bold uppercase gap-2"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Condition Node
                  </Button>
                </div>
              </div>

              {/* Actions & Insights */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-8 border-t border-white/5">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 text-secondary font-bold text-[10px] uppercase mb-1">
                    <Info className="h-3.5 w-3.5" /> Backtest Simulation
                  </div>
                  <Text
                    variant="caption"
                    className="text-muted-foreground leading-relaxed italic block"
                  >
                    "This strategy node achieves a 14.5% historical return
                    across the 2024 tech cluster with a Sharpe ratio of 1.82."
                  </Text>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="ghost"
                    className="rounded-xl h-12 px-6 font-bold text-xs"
                  >
                    Discard Logic
                  </Button>
                  <Button className="h-12 px-10 rounded-xl font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all scale-105 active:scale-95">
                    Synchronize Strategy
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ACTIVE RESULTS MATRIX */}
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-secondary/10 text-secondary">
                  <Database className="h-5 w-5" />
                </div>
                <div>
                  <Text variant="h3" className="font-bold">
                    Screener Result Matrix
                  </Text>
                  <Text
                    variant="caption"
                    className="text-muted-foreground uppercase tracking-widest font-bold text-[9px]"
                  >
                    High-Fidelity Discovery Nodes
                  </Text>
                </div>
              </div>
              <div className="relative group w-full md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder="Filter matrix results..."
                  className="pl-10 h-10 bg-card/30 border-white/5 rounded-xl text-xs"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <Card className="glass-card border-none shadow-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/20 border-b border-white/5">
                      <TableHead className="pl-8 font-bold text-[10px] uppercase tracking-widest py-6">
                        Asset Intelligence
                      </TableHead>
                      <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">
                        Price
                      </TableHead>
                      <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">
                        24h Variance
                      </TableHead>
                      <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">
                        Sentiment
                      </TableHead>
                      <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">
                        Momentum
                      </TableHead>
                      <TableHead className="text-right pr-8 font-bold text-[10px] uppercase tracking-widest">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAssets.map((asset) => (
                      <TableRow
                        key={asset.symbol}
                        className="group hover:bg-white/5 transition-colors border-b border-white/5"
                      >
                        <TableCell className="py-5 pl-8">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-background/50 border border-white/5 flex items-center justify-center font-mono font-bold text-xs text-primary group-hover:border-primary/30 transition-all">
                              {asset.symbol}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-foreground/90">
                                {asset.name}
                              </span>
                              <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-tighter">
                                MCAP: {asset.market_cap}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-mono text-sm font-bold text-foreground/80">
                          ${asset.price}
                        </TableCell>
                        <TableCell>
                          <div
                            className={cn(
                              "flex items-center justify-center gap-1.5 text-xs font-bold font-mono",
                              asset.change_24h.includes("-")
                                ? "text-destructive"
                                : "text-emerald-500"
                            )}
                          >
                            {asset.change_24h.includes("-") ? (
                              <TrendingDown className="h-3 w-3" />
                            ) : (
                              <TrendingUp className="h-3 w-3" />
                            )}
                            {asset.change_24h}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col items-center gap-1.5">
                            <span className="text-xs font-bold font-mono text-secondary">
                              {asset.sentiment}
                            </span>
                            <div className="w-12 h-1 bg-white/5 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-secondary"
                                style={{ width: `${asset.sentiment}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col items-center gap-1.5">
                            <span className="text-xs font-bold font-mono text-primary">
                              {asset.momentum}
                            </span>
                            <div className="w-12 h-1 bg-white/5 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary"
                                style={{ width: `${asset.momentum}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg hover:text-primary transition-all"
                              onClick={() =>
                                handleAction(`Bookmark ${asset.symbol}`)
                              }
                            >
                              <Bookmark className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg hover:text-secondary transition-all"
                            >
                              <ArrowUpRight className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>

          {/* DYNAMIC STRATEGY TRACKER */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="glass-card border-none bg-background/30 p-8 flex flex-col gap-4 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                <ShieldCheck className="h-16 w-16 text-emerald-500" />
              </div>
              <div className="flex items-center gap-2 text-muted-foreground font-bold text-xs uppercase tracking-widest">
                <Target className="h-4 w-4 text-emerald-500" /> Instructional
                Integrity
              </div>
              <Text
                variant="caption"
                className="text-muted-foreground leading-relaxed"
              >
                Strategies utilizing the **Sentiment Engine** are benchmarked
                against trailing 30-day social clusters. Thresholds are
                auto-adjusted based on institutional buy-side metrics.
              </Text>
              <Button
                variant="link"
                className="p-0 h-auto w-fit text-primary font-bold text-[10px] uppercase group/link"
                asChild
              >
                <button onClick={() => handleAction("Audit All Strategies")}>
                  Review Governance Logs{" "}
                  <ArrowRight className="ml-1.5 h-3 w-3 transition-transform group-hover/link:translate-x-1" />
                </button>
              </Button>
            </Card>

            <Card className="glass-card border-none shadow-xl bg-card/30">
              <CardHeader className="pb-4">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-primary">
                  Active Strategy Nodes
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-white/5">
                  {data.strategies.map((strategy) => (
                    <div
                      key={strategy.strategy_name}
                      className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                    >
                      <div className="space-y-1">
                        <Text variant="bodySmall" weight="bold">
                          {strategy.strategy_name}
                        </Text>
                        <div className="flex gap-2">
                          {strategy.conditions.map((c) => (
                            <Badge
                              key={c}
                              variant="outline"
                              className="text-[7px] border-white/10 uppercase font-mono"
                            >
                              {c}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Switch
                        checked={strategy.status === "mock_active"}
                        onCheckedChange={() =>
                          toggleStrategy(strategy.strategy_name)
                        }
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
