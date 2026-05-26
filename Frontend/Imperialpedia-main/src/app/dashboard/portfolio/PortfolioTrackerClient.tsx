"use client";

import React, { useState } from "react";
import { UserPortfolioData, WatchlistItem } from "@/types/user-system";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Text } from "@/design-system/typography/text";
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Star,
  Zap,
  Clock,
  Bell,
  ChevronRight,
  ArrowUpRight,
  PieChart as PieIcon,
  Activity,
  Search,
  Download,
  Trash2,
  Filter,
  Layers,
  Target,
  AlertCircle,
  MoreVertical,
  Briefcase,
  History,
  DollarSign,
} from "lucide-react";
import Link from "next/link";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PortfolioTrackerClientProps {
  data: UserPortfolioData;
}

export function PortfolioTrackerClient({ data }: PortfolioTrackerClientProps) {
  const [activeWatchlist, setActiveWatchlist] = useState(data.watchlists[0].id);
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);

  const COLORS = ["#8272F2", "#69B9FF", "#10b981", "#f59e0b", "#ef4444"];

  const currentWatchlist = data.watchlists.find(
    (w) => w.id === activeWatchlist
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Top Value Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-card border-none bg-primary/5 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
            <DollarSign className="h-24 w-24" />
          </div>
          <CardContent className="p-8">
            <Text variant="label" className="text-primary mb-2">
              Aggregate Value
            </Text>
            <div className="text-4xl font-bold tracking-tighter">
              {data.portfolio_summary.total_value}
            </div>
            <div className="flex items-center text-emerald-500 font-bold mt-2">
              <ArrowUpRight className="h-4 w-4 mr-1" />{" "}
              {data.portfolio_summary.total_gain_loss_percent} lifetime
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-none bg-secondary/5 shadow-xl">
          <CardContent className="p-8">
            <Text variant="label" className="text-secondary mb-2">
              Realized Profit/Loss
            </Text>
            <div className="text-4xl font-bold tracking-tighter text-emerald-500">
              {data.portfolio_summary.total_gain_loss}
            </div>
            <Text
              variant="caption"
              className="text-muted-foreground mt-2 block"
            >
              Calculated across 12 completed cycles
            </Text>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl flex flex-col justify-center items-center p-8 bg-card/30">
          <Dialog open={isTradeModalOpen} onOpenChange={setIsTradeModalOpen}>
            <DialogTrigger asChild>
              <Button
                size="lg"
                className="w-full h-14 rounded-2xl font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 scale-[1.02] active:scale-100 transition-all"
              >
                <Plus className="mr-2 h-5 w-5" /> Log New Transaction
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card border-white/10 max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">
                  Log Portfolio Node
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Manual entry for tracking off-platform asset execution.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Asset Node
                    </Label>
                    <Input
                      placeholder="e.g. BTC"
                      className="bg-background/50 h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Action
                    </Label>
                    <Select defaultValue="buy">
                      <SelectTrigger className="bg-background/50 h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="buy">Buy (Accumulate)</SelectItem>
                        <SelectItem value="sell">Sell (Distribute)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Execution Price ($)
                    </Label>
                    <Input
                      type="number"
                      placeholder="64200"
                      className="bg-background/50 h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Quantity
                    </Label>
                    <Input
                      type="number"
                      placeholder="0.5"
                      className="bg-background/50 h-11"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter className="gap-3">
                <Button
                  variant="ghost"
                  onClick={() => setIsTradeModalOpen(false)}
                >
                  Discard
                </Button>
                <Button
                  className="bg-primary hover:bg-primary/90 rounded-xl px-8 font-bold"
                  onClick={() => setIsTradeModalOpen(false)}
                >
                  Synchronize State
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <div className="flex gap-4 mt-4 w-full">
            <Button
              variant="outline"
              className="flex-1 rounded-xl h-11 border-white/10 bg-background/30 text-xs font-bold"
            >
              <Download className="mr-2 h-3.5 w-3.5" /> Export Logs
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-11 w-11 rounded-xl border-white/10 bg-background/30"
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Performance & History Column */}
        <div className="lg:col-span-8 space-y-8">
          {/* Longitudinal Performance */}
          <Card className="glass-card border-none shadow-2xl overflow-hidden">
            <CardHeader className="bg-card/30 border-b border-white/5 p-8 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" /> Performance
                  Trajectory
                </CardTitle>
                <CardDescription>
                  Aggregate value momentum over the last 30 cycles.
                </CardDescription>
              </div>
              <Badge
                variant="outline"
                className="bg-primary/5 text-primary border-primary/20 text-[10px] font-bold h-6"
              >
                30 DAY WINDOW
              </Badge>
            </CardHeader>
            <CardContent className="p-8 h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.portfolio_summary.performance_chart_data}>
                  <defs>
                    <linearGradient id="colorPerf" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8272F2" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8272F2" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#ffffff05"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    stroke="#888888"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => val.split("-").slice(1).join("/")}
                  />
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
                    itemStyle={{ color: "#8272F2" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#8272F2"
                    fillOpacity={1}
                    fill="url(#colorPerf)"
                    strokeWidth={3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Allocation Matrix */}
          <Card className="glass-card border-none shadow-2xl overflow-hidden">
            <CardHeader className="bg-card/30 border-b border-white/5 p-8">
              <CardTitle className="text-xl flex items-center gap-2">
                <PieIcon className="h-5 w-5 text-secondary" /> Allocation
                Intelligence
              </CardTitle>
              <CardDescription>
                Current weight distribution across asset nodes.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.portfolio_summary.allocation}
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={8}
                        dataKey="percentage"
                        nameKey="asset"
                      >
                        {data.portfolio_summary.allocation.map(
                          (entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                              stroke="rgba(255,255,255,0.05)"
                            />
                          )
                        )}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1C1822",
                          border: "1px solid #ffffff10",
                          borderRadius: "12px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-6">
                  {data.portfolio_summary.allocation.map((item, idx) => (
                    <div key={item.asset} className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground font-bold flex items-center gap-2">
                          <div
                            className="w-2.5 h-2.5 rounded-full"
                            style={{
                              backgroundColor: COLORS[idx % COLORS.length],
                            }}
                          />
                          {item.asset}
                        </span>
                        <span className="font-mono font-bold text-foreground">
                          {item.percentage}%
                        </span>
                      </div>
                      <Progress
                        value={item.percentage}
                        className="h-1 bg-white/5"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Trade Log */}
          <Card className="glass-card border-none shadow-2xl overflow-hidden">
            <CardHeader className="bg-card/30 border-b border-white/5 p-8 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" /> Execution Log
                </CardTitle>
                <CardDescription>
                  Historical record of portfolio transactions.
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-primary font-bold text-xs"
              >
                View Full Ledger
              </Button>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-muted/30 border-b border-white/5">
                  <tr>
                    <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Asset Node
                    </th>
                    <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Action
                    </th>
                    <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Price
                    </th>
                    <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Quantity
                    </th>
                    <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right">
                      Timestamp
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {data.trade_history.map((trade) => (
                    <tr
                      key={trade.id}
                      className="hover:bg-white/5 transition-colors group"
                    >
                      <td className="px-8 py-5">
                        <span className="text-sm font-bold text-primary group-hover:text-foreground transition-colors">
                          {trade.asset}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[9px] font-bold uppercase h-5",
                            trade.type === "Buy"
                              ? "border-emerald-500/30 text-emerald-500 bg-emerald-500/5"
                              : "border-destructive/30 text-destructive bg-destructive/5"
                          )}
                        >
                          {trade.type}
                        </Badge>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-xs font-mono text-foreground/80">
                          {trade.price}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-xs font-mono text-foreground/80">
                          {trade.quantity}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-xs font-bold">
                            {format(new Date(trade.date), "MMM d, yyyy")}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {format(new Date(trade.date), "HH:mm")}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right Column: Watchlists & Alerts */}
        <div className="lg:col-span-4 space-y-8">
          {/* Watchlist Hub */}
          <Card className="glass-card border-none shadow-xl overflow-hidden">
            <Tabs
              value={activeWatchlist}
              onValueChange={setActiveWatchlist}
              className="w-full"
            >
              <CardHeader className="pb-4 bg-card/30 border-b border-white/5">
                <div className="flex items-center justify-between mb-4">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Star className="h-4 w-4 text-amber-500 fill-amber-500" />{" "}
                    Watchlist Hub
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <TabsList className="bg-background/50 border border-white/5 p-1 h-9 rounded-lg w-full justify-start overflow-x-auto no-scrollbar">
                  {data.watchlists.map((w) => (
                    <TabsTrigger
                      key={w.id}
                      value={w.id}
                      className="text-[10px] px-4 font-bold uppercase rounded-md"
                    >
                      {w.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-white/5">
                  {currentWatchlist?.assets.map((asset) => (
                    <div
                      key={asset.id}
                      className="p-5 hover:bg-white/5 transition-all group cursor-pointer"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-background/50 border border-white/5 flex items-center justify-center font-mono font-bold text-xs group-hover:border-primary/30 transition-all">
                            {asset.symbol}
                          </div>
                          <div>
                            <Text variant="bodySmall" weight="bold">
                              {asset.asset}
                            </Text>
                            <Badge
                              variant="secondary"
                              className={cn(
                                "text-[8px] font-bold h-4 px-1.5 border-none mt-1",
                                asset.sentiment === "Bullish"
                                  ? "text-emerald-500 bg-emerald-500/5"
                                  : asset.sentiment === "Bearish"
                                  ? "text-destructive bg-destructive/5"
                                  : "text-muted-foreground bg-muted/10"
                              )}
                            >
                              {asset.sentiment}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold font-mono">
                            {asset.currentValue}
                          </div>
                          <div
                            className={cn(
                              "text-[10px] font-bold flex items-center justify-end mt-0.5",
                              asset.isPositive
                                ? "text-emerald-500"
                                : "text-destructive"
                            )}
                          >
                            {asset.isPositive ? (
                              <TrendingUp className="h-2.5 w-2.5 mr-1" />
                            ) : (
                              <TrendingDown className="h-2.5 w-2.5 mr-1" />
                            )}
                            {asset.change}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-2">
                        <div className="flex items-center gap-4 text-[9px] text-muted-foreground uppercase font-bold tracking-tighter">
                          <div className="flex items-center gap-1">
                            <Activity className="h-2.5 w-2.5" /> Vol:{" "}
                            {asset.volume}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  className="w-full h-12 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary rounded-none border-t border-white/5"
                >
                  <Search className="mr-2 h-3.5 w-3.5" /> Find Assets to Watch
                </Button>
              </CardContent>
            </Tabs>
          </Card>

          {/* Alert Center */}
          <Card className="glass-card border-none shadow-xl">
            <CardHeader className="pb-4 border-b border-white/5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Bell className="h-4 w-4 text-primary" /> Active Alerts
                </CardTitle>
                <Badge
                  variant="secondary"
                  className="bg-primary/10 text-primary border-none text-[9px] font-bold"
                >
                  3 ACTIVE
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-white/5">
                {data.alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          "p-2 rounded-lg",
                          alert.triggered
                            ? "bg-emerald-500/10 text-emerald-500"
                            : "bg-primary/10 text-primary"
                        )}
                      >
                        {alert.type === "price" ? (
                          <DollarSign className="h-4 w-4" />
                        ) : alert.type === "sentiment" ? (
                          <Activity className="h-4 w-4" />
                        ) : (
                          <Layers className="h-4 w-4" />
                        )}
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <Text variant="caption" weight="bold">
                            {alert.asset}
                          </Text>
                          <span className="text-[10px] text-muted-foreground uppercase">
                            {alert.type} alert
                          </span>
                        </div>
                        <Text
                          variant="caption"
                          className="text-muted-foreground block text-[10px]"
                        >
                          Threshold:{" "}
                          <span className="text-foreground font-bold">
                            {alert.threshold}
                          </span>
                        </Text>
                      </div>
                    </div>
                    {alert.triggered ? (
                      <Badge className="bg-emerald-500 text-white border-none animate-pulse text-[8px] h-5 px-2">
                        TRIGGERED
                      </Badge>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            alert.status === "active" ? "outline" : "secondary"
                          }
                          className="text-[8px] h-5 uppercase"
                        >
                          {alert.status}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-white/5 bg-primary/5">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <Text
                    variant="caption"
                    className="text-muted-foreground leading-relaxed italic"
                  >
                    "Alerts use the **Standard Intelligence Buffer**. Typical
                    latency is under 180ms across primary exchange nodes."
                  </Text>
                </div>
              </div>
              <Button className="w-full h-12 rounded-none bg-primary hover:bg-primary/90 font-bold text-xs">
                Create Precision Alert
              </Button>
            </CardContent>
          </Card>

          {/* Strategic Context */}
          <div className="p-8 rounded-[2.5rem] border border-secondary/20 bg-secondary/5 space-y-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <Target className="h-16 w-16 text-secondary" />
            </div>
            <div className="flex items-center gap-2 text-secondary font-bold text-sm uppercase tracking-widest">
              <Zap className="h-4 w-4" /> Portfolio Insight
            </div>
            <Text
              variant="caption"
              className="text-muted-foreground leading-relaxed"
            >
              Your portfolio concentration in **Equities (45%)** is currently
              yielding 2.4x historical benchmarks. The AI recommends rebalancing
              5% into **Fixed Income** to mitigate upcoming macro volatility.
            </Text>
            <Button
              variant="link"
              className="p-0 h-auto text-secondary text-xs font-bold group/link"
              asChild
            >
              <Link href="/ai-analyst/macro-summary">
                Analyze Rebalance Macro{" "}
                <ChevronRight className="ml-1 h-3 w-3 transition-transform group-hover/link:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
