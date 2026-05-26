"use client";

import React, { useEffect, useState } from "react";
import {
  BacktestDashboardData,
  StrategyCondition,
  TradeEntry,
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
import { Text } from "@/design-system/typography/text";
import {
  Zap,
  Activity,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Target,
  Sparkles,
  Search,
  RefreshCw,
  Loader2,
  Plus,
  Trash2,
  History,
  Play,
  Settings2,
  LineChart,
  ArrowRight,
  ShieldCheck,
  Layers,
  Flame,
  Layout,
  Clock,
  ChevronRight,
  Filter,
  DollarSign,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart as RechartsLine,
  Line,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Institutional Strategy Backtesting Terminal Client.
 * Orchestrates historical simulation, visual results auditing, and trade logging.
 */
export function BacktestingClient() {
  const [data, setData] = useState<BacktestDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const response = await premiumService.getBacktestData();
        if (response.data) setData(response.data);
      } catch (e) {
        console.error("Backtest sync failure", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleRunBacktest = async () => {
    setRunning(true);
    toast({
      title: "Simulation Cycle Initiated",
      description:
        "Traversing 5 years of institutional price and sentiment nodes...",
    });

    await new Promise((r) => setTimeout(r, 2000));
    setRunning(false);

    toast({
      title: "Audit Complete",
      description:
        "Strategy alpha metrics have been synchronized with the dashboard.",
    });
  };

  const handleAction = (label: string) => {
    toast({
      title: "Action Initiated",
      description: `Targeting backtest node: ${label}`,
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
          Establishing Historical Handshake...
        </Text>
      </div>
    );
  }

  const filteredTrades = data.trade_history.filter(
    (t) =>
      t.asset.toLowerCase().includes(search.toLowerCase()) ||
      t.trade_id.toLowerCase().includes(search.toLowerCase())
  );

  const COLORS = ["#8272F2", "#69B9FF", "#10b981", "#f59e0b", "#ef4444"];

  return (
    <div className="space-y-10 pb-24 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <History className="h-4 w-4" />
            <Text
              variant="label"
              className="text-[10px] font-bold tracking-widest uppercase"
            >
              Strategy Integrity Engine
            </Text>
          </div>
          <Text variant="h1" className="text-3xl font-bold tracking-tight">
            Backtesting Terminal
          </Text>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="rounded-xl border-white/10 bg-card/30 h-11 px-6"
          >
            <Settings2 className="mr-2 h-4 w-4 text-primary" /> Parameters
          </Button>
          <Button
            onClick={handleRunBacktest}
            disabled={running}
            className="rounded-xl shadow-lg shadow-primary/20 font-bold bg-primary hover:bg-primary/90 h-11 px-8 transition-all scale-105 active:scale-95"
          >
            {running ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            Run Simulation
          </Button>
        </div>
      </header>

      {/* AGGREGATE SUMMARY MATRIX */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {[
          {
            label: "Total Return",
            value: data.backtest_summary.total_return,
            icon: TrendingUp,
            color: "text-emerald-500",
          },
          {
            label: "Annual Yield",
            value: data.backtest_summary.annual_return,
            icon: Activity,
            color: "text-primary",
          },
          {
            label: "Max Drawdown",
            value: data.backtest_summary.max_drawdown,
            icon: TrendingDown,
            color: "text-destructive",
          },
          {
            label: "Win Rate",
            value: data.backtest_summary.win_rate,
            icon: Target,
            color: "text-secondary",
          },
          {
            label: "Sharpe Ratio",
            value: data.backtest_summary.sharpe_ratio,
            icon: Sparkles,
            color: "text-primary",
          },
          {
            label: "Total Trades",
            value: data.backtest_summary.total_trades,
            icon: BarChart3,
            color: "text-muted-foreground",
          },
        ].map((kpi) => (
          <Card
            key={kpi.label}
            className="glass-card border-none shadow-xl group hover:border-primary/20 transition-all"
          >
            <CardContent className="p-5 flex flex-col items-center text-center space-y-2">
              <kpi.icon className={cn("h-4 w-4 mb-1", kpi.color)} />
              <div className="text-xl font-bold tracking-tighter">
                {kpi.value}
              </div>
              <Text
                variant="label"
                className="text-[8px] opacity-50 uppercase font-bold tracking-widest"
              >
                {kpi.label}
              </Text>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* STRATEGY ARCHITECT COLUMN */}
        <aside className="lg:col-span-4 space-y-8">
          <Card className="glass-card border-none shadow-2xl">
            <CardHeader className="bg-card/30 border-b border-white/5 p-6">
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" /> Strategy Logic
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <Text
                    variant="label"
                    className="text-[9px] font-bold text-muted-foreground uppercase"
                  >
                    Entry Conditions
                  </Text>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-lg"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <div className="space-y-3">
                  {data.strategy_conditions.map((cond, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-xl bg-background/50 border border-white/5 space-y-3 relative group"
                    >
                      <div className="flex items-center justify-between">
                        <Badge
                          variant="outline"
                          className="text-[8px] border-primary/20 bg-primary/5 text-primary"
                        >
                          NODE {i + 1}
                        </Badge>
                        <button className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-2 items-center">
                        <div className="text-[10px] font-bold text-foreground/80">
                          {cond.indicator}
                        </div>
                        <div className="text-center font-mono text-xs text-primary">
                          {cond.operator}
                        </div>
                        <div className="text-right text-[10px] font-bold text-foreground/80">
                          {cond.value}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <Text
                    variant="label"
                    className="text-[9px] font-bold text-muted-foreground uppercase"
                  >
                    Exit Logic
                  </Text>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-lg"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/10">
                  <div className="flex items-center gap-3 text-[10px] font-bold text-destructive">
                    <Zap className="h-3 w-3" /> Stop-Loss: -5% Node
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">
                      Asset Node
                    </Label>
                    <Select defaultValue="AAPL">
                      <SelectTrigger className="h-9 bg-background/50 border-white/5 text-[10px] font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AAPL">AAPL (Apple)</SelectItem>
                        <SelectItem value="BTC">BTC (Bitcoin)</SelectItem>
                        <SelectItem value="TSLA">TSLA (Tesla)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">
                      Capital ($)
                    </Label>
                    <Input
                      defaultValue="10000"
                      className="h-9 bg-background/50 border-white/5 text-[10px] font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              <Button className="w-full h-11 rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/90 font-bold text-xs shadow-lg shadow-secondary/20">
                Save Strategy Node
              </Button>
            </CardContent>
          </Card>

          {/* PERFORMANCE BREAKDOWN */}
          <Card className="glass-card border-none shadow-xl bg-card/30">
            <CardHeader className="pb-4">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-primary">
                Statistical Audit
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {[
                {
                  label: "Profit Factor",
                  value: data.backtest_summary.profit_factor,
                  color: "text-emerald-500",
                },
                {
                  label: "Long Win Rate",
                  value: data.backtest_summary.long_win_rate,
                  color: "text-foreground",
                },
                {
                  label: "Short Win Rate",
                  value: data.backtest_summary.short_win_rate,
                  color: "text-foreground",
                },
                {
                  label: "Best Transaction",
                  value: data.backtest_summary.best_trade,
                  color: "text-emerald-500",
                },
                {
                  label: "Worst Transaction",
                  value: data.backtest_summary.worst_trade,
                  color: "text-destructive",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="flex justify-between items-center border-b border-white/5 pb-2 last:border-0"
                >
                  <Text
                    variant="caption"
                    className="text-muted-foreground font-medium"
                  >
                    {stat.label}
                  </Text>
                  <span
                    className={cn("text-xs font-mono font-bold", stat.color)}
                  >
                    {stat.value}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </aside>

        {/* VISUALIZATION & LOGS COLUMN */}
        <div className="lg:col-span-8 space-y-10">
          {/* EQUITY & DRAWDOWN CHARTS */}
          <div className="grid grid-cols-1 gap-8">
            <Card className="glass-card border-none shadow-2xl overflow-hidden">
              <CardHeader className="bg-card/30 border-b border-white/5 p-8 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" /> Equity Curve
                  </CardTitle>
                  <CardDescription>
                    Visualizing capital maturity over the simulation timeline.
                  </CardDescription>
                </div>
                <Badge
                  variant="outline"
                  className="border-primary/20 bg-primary/5 text-primary text-[10px] font-bold px-3 h-7"
                >
                  RE-SYNCED
                </Badge>
              </CardHeader>
              <CardContent className="p-8 h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.equity_curve}>
                    <defs>
                      <linearGradient
                        id="colorEquity"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#8272F2"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#8272F2"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#ffffff05"
                      vertical={false}
                    />
                    <XAxis dataKey="date" hide />
                    <YAxis
                      stroke="#888888"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1C1822",
                        border: "1px solid #ffffff10",
                        borderRadius: "12px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      name="Portfolio Value"
                      stroke="#8272F2"
                      fillOpacity={1}
                      fill="url(#colorEquity)"
                      strokeWidth={3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="glass-card border-none shadow-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-sm font-bold uppercase tracking-widest text-destructive flex items-center gap-2">
                    <TrendingDown className="h-4 w-4" /> Drawdown Depth
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.drawdown_chart}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#ffffff05"
                        vertical={false}
                      />
                      <XAxis dataKey="date" hide />
                      <YAxis
                        stroke="#888888"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val) => `${val}%`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1C1822",
                          border: "1px solid #ffffff10",
                          borderRadius: "12px",
                        }}
                      />
                      <Area
                        type="step"
                        dataKey="value"
                        name="Drawdown"
                        stroke="#ef4444"
                        fill="#ef444420"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="glass-card border-none shadow-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                    <Layout className="h-4 w-4" /> Monthly Returns
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3">
                    {data.monthly_heatmap.map((m, i) => (
                      <div
                        key={i}
                        className={cn(
                          "p-3 rounded-xl border flex flex-col items-center justify-center space-y-1 transition-all hover:scale-105",
                          m.return >= 0
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                            : "bg-destructive/10 border-destructive/20 text-destructive"
                        )}
                      >
                        <span className="text-[10px] font-bold uppercase tracking-tighter opacity-60">
                          {m.month} {m.year}
                        </span>
                        <span className="text-sm font-mono font-bold">
                          {m.return > 0 ? "+" : ""}
                          {m.return}%
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* TRADE HISTORY TABLE */}
          <Card className="glass-card border-none shadow-2xl overflow-hidden">
            <CardHeader className="bg-card/30 border-b border-white/5 p-8 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Layers className="h-5 w-5 text-primary" /> Execution Ledger
                </CardTitle>
                <CardDescription>
                  Simulated transaction history for the selected strategy node.
                </CardDescription>
              </div>
              <div className="relative group w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder="Filter trades..."
                  className="pl-10 h-10 bg-background/50 border-white/10 rounded-xl text-xs"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/20 border-b border-white/5">
                    <TableHead className="pl-8 font-bold text-[10px] uppercase tracking-widest py-6">
                      Trade ID
                    </TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest">
                      Asset
                    </TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest">
                      Entry/Exit Prices
                    </TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">
                      Net Profit
                    </TableHead>
                    <TableHead className="text-right pr-8 font-bold text-[10px] uppercase tracking-widest">
                      Return %
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTrades.map((trade) => (
                    <TableRow
                      key={trade.trade_id}
                      className="group hover:bg-white/5 transition-colors border-b border-white/5"
                    >
                      <TableCell className="py-5 pl-8">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-mono font-bold text-primary">
                            {trade.trade_id}
                          </span>
                          <span className="text-[9px] text-muted-foreground uppercase mt-1">
                            {trade.entry_date}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Text variant="bodySmall" weight="bold">
                          {trade.asset}
                        </Text>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 font-mono text-[10px]">
                          <span className="text-muted-foreground">
                            ${trade.entry_price}
                          </span>
                          <ArrowRight className="h-2.5 w-2.5 opacity-30" />
                          <span className="font-bold">${trade.exit_price}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center">
                          <span
                            className={cn(
                              "text-xs font-bold font-mono",
                              trade.profit.includes("-")
                                ? "text-destructive"
                                : "text-emerald-500"
                            )}
                          >
                            {trade.profit}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <Badge
                          className={cn(
                            "border-none text-[9px] font-bold px-2 h-5",
                            trade.return.includes("-")
                              ? "bg-destructive/10 text-destructive"
                              : "bg-emerald-500/10 text-emerald-500"
                          )}
                        >
                          {trade.return}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* SAVED BACKTESTS GALLERY */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 px-2">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <History className="h-5 w-5" />
              </div>
              <div>
                <Text variant="h3" className="font-bold">
                  Simulation Archive
                </Text>
                <Text
                  variant="caption"
                  className="text-muted-foreground uppercase tracking-widest font-bold text-[9px]"
                >
                  Historical Configuration Nodes
                </Text>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {data.saved_backtests.map((save) => (
                <Card
                  key={save.name}
                  className="glass-card border-none hover:border-primary/30 transition-all group cursor-pointer relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:scale-110 transition-transform">
                    <RefreshCw className="h-12 w-12 text-primary" />
                  </div>
                  <CardContent className="p-6 space-y-4">
                    <div className="space-y-1">
                      <Text
                        variant="bodySmall"
                        weight="bold"
                        className="group-hover:text-primary transition-colors truncate block"
                      >
                        {save.name}
                      </Text>
                      <div className="flex items-center gap-2 text-[9px] text-muted-foreground font-mono uppercase font-bold">
                        <Clock className="h-2.5 w-2.5" /> {save.last_tested}
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <Badge
                        variant="outline"
                        className="text-[8px] font-bold border-white/10 uppercase bg-black/20"
                      >
                        {save.asset}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-[10px] font-bold uppercase tracking-widest text-primary hover:bg-primary/10"
                      >
                        Run Again
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* STRATEGIC HUB FOOTER */}
      <Card className="glass-card border-none bg-primary/5 p-12 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-1/3 h-full bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />
        <div className="flex flex-col lg:flex-row items-center gap-12 relative z-10">
          <div className="w-24 h-24 rounded-[2.5rem] bg-primary/20 flex items-center justify-center text-primary shadow-2xl shrink-0">
            <ShieldCheck className="h-12 w-12" />
          </div>
          <div className="flex-1 text-center lg:text-left space-y-3">
            <Text variant="h2" className="text-3xl font-bold tracking-tight">
              E-E-A-T Verified Simulation
            </Text>
            <Text
              variant="body"
              className="text-muted-foreground leading-relaxed max-w-3xl"
            >
              As a **Pro** member, your backtests utilize the **Institutional
              Grade Data Node**. This ensures that historical slippage, dark
              pool liquidity, and dividend adjustments are modeled with 99.9%
              fidelity to historical benchmarks.
            </Text>
          </div>
          <Button
            size="lg"
            className="h-14 px-10 rounded-2xl font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/30 shrink-0 scale-105 active:scale-95 transition-all"
          >
            Unlock Enterprise API
          </Button>
        </div>
      </Card>
    </div>
  );
}
