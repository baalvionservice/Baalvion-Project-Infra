"use client";

import React, { useEffect, useState } from "react";
import { PortfolioDeepDiveData, DeepDiveAsset } from "@/types/premium";
import { premiumService } from "@/services/data/premium-service";
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
import { Text } from "@/design-system/typography/text";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  ShieldCheck,
  BarChart3,
  Target,
  Sparkles,
  Info,
  Layers,
  Search,
  Filter,
  Loader2,
  ChevronRight,
  ArrowRight,
  Bookmark,
  FileText,
  PieChart as PieIcon,
  AlertTriangle,
  Flame,
  ArrowUpRight,
  GitCompare,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

/**
 * AI Portfolio Deep Dive Interactive Client.
 * Specialized hub for detailed asset analysis and risk diversification matrix.
 */
export function PremiumDeepDiveClient() {
  const [data, setData] = useState<PortfolioDeepDiveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const response = await premiumService.getPortfolioDeepDive();
        if (response.data) setData(response.data);
      } catch (e) {
        console.error("Deep dive sync failure", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleAction = (asset: string, action: string) => {
    toast({
      title: "Action Committed",
      description: `${action} successful for ${asset} node.`,
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
          Establishing Deep-Dive Handshake...
        </Text>
      </div>
    );
  }

  const COLORS = ["#8272F2", "#69B9FF", "#10b981", "#f59e0b", "#ef4444"];

  const allocationData = Object.entries(data.portfolio_summary.allocation).map(
    ([name, value]) => ({
      name,
      value: parseInt(value),
    })
  );

  const sectorData = Object.entries(
    data.risk_diversification.sector_exposure
  ).map(([name, value]) => ({
    name,
    value: parseInt(value),
  }));

  const getInsightIcon = (insight: string) => {
    switch (insight) {
      case "mock_up":
        return <TrendingUp className="h-3 w-3 text-emerald-500" />;
      case "mock_down":
        return <TrendingDown className="h-3 w-3 text-destructive" />;
      default:
        return <Minus className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const getRiskBadge = (alert: string) => {
    switch (alert) {
      case "mock_critical":
        return (
          <Badge
            variant="destructive"
            className="font-bold uppercase text-[8px] px-2 h-5 animate-pulse"
          >
            Critical
          </Badge>
        );
      case "mock_warning":
        return (
          <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 font-bold uppercase text-[8px] px-2 h-5">
            Warning
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="text-emerald-500 border-emerald-500/20 text-[8px] font-bold uppercase px-2 h-5"
          >
            Nominal
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Portfolio Overview Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="glass-card border-none bg-primary/5 shadow-xl relative overflow-hidden flex flex-col">
          <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
            <PieIcon className="h-32 w-32 text-primary" />
          </div>
          <CardHeader className="p-8">
            <div className="flex items-center gap-2 text-primary mb-2">
              <Activity className="h-4 w-4" />
              <Text
                variant="label"
                className="text-[10px] font-bold tracking-widest uppercase"
              >
                System Aggregate
              </Text>
            </div>
            <CardTitle className="text-3xl font-bold tracking-tight">
              Portfolio Pulse
            </CardTitle>
          </CardHeader>
          <CardContent className="px-8 pb-8 space-y-8 flex-grow">
            <div className="flex justify-between items-end">
              <div className="space-y-1">
                <Text
                  variant="label"
                  className="text-[9px] opacity-50 uppercase font-bold tracking-widest"
                >
                  Global Value
                </Text>
                <div className="text-4xl font-bold tracking-tighter">
                  {data.portfolio_summary.total_value}
                </div>
              </div>
              <div className="text-right space-y-1">
                <Text
                  variant="label"
                  className="text-[9px] opacity-50 uppercase font-bold tracking-widest"
                >
                  P&L Status
                </Text>
                <div className="text-xl font-bold text-emerald-500">
                  {data.portfolio_summary.profit_loss}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-white/5 space-y-4">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                <span>Risk Score</span>
                <span className="text-primary">
                  {data.portfolio_summary.risk_score}
                </span>
              </div>
              <Progress value={65} className="h-1.5 bg-white/5" />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 glass-card border-none shadow-2xl overflow-hidden">
          <CardHeader className="bg-card/30 border-b border-white/5 p-6 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5 text-secondary" /> Asset Allocation
                Matrix
              </CardTitle>
              <CardDescription>
                Current weight distribution across institutional nodes.
              </CardDescription>
            </div>
            <Badge
              variant="outline"
              className="border-secondary/20 bg-secondary/5 text-secondary text-[10px] font-bold px-3 h-7"
            >
              LIVE FEED
            </Badge>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={allocationData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={8}
                      dataKey="value"
                      nameKey="name"
                    >
                      {allocationData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                          stroke="rgba(255,255,255,0.05)"
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1C1822",
                        border: "1px solid #ffffff10",
                        borderRadius: "12px",
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      align="center"
                      iconType="circle"
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-5">
                {Object.entries(data.portfolio_summary.allocation).map(
                  ([name, value], idx) => (
                    <div key={name} className="space-y-2 group cursor-default">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground font-bold flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{
                              backgroundColor: COLORS[idx % COLORS.length],
                            }}
                          />
                          {name}
                        </span>
                        <span className="font-mono font-bold text-foreground group-hover:text-primary transition-colors">
                          {value}
                        </span>
                      </div>
                      <Progress
                        value={parseInt(value)}
                        className="h-1 bg-white/5"
                      />
                    </div>
                  )
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Asset-Level Analysis Table */}
      <Card className="glass-card border-none shadow-2xl overflow-hidden">
        <CardHeader className="bg-card/30 border-b border-white/5 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <CardTitle className="text-xl flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" /> Intelligence Registry
            </CardTitle>
            <CardDescription>
              Individual node analysis cross-referenced with AI Bull/Bear cases.
            </CardDescription>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Filter asset nodes..."
              className="pl-10 h-11 bg-background/50 border-white/10 rounded-xl text-xs"
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
                  Asset Node
                </TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">
                  Price
                </TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">
                  Weight
                </TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">
                  P&L Status
                </TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">
                  AI Signals
                </TableHead>
                <TableHead className="text-right pr-8 font-bold text-[10px] uppercase tracking-widest">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.assets
                .filter(
                  (a) =>
                    a.name.toLowerCase().includes(search.toLowerCase()) ||
                    a.ticker.toLowerCase().includes(search.toLowerCase())
                )
                .map((asset) => (
                  <TableRow
                    key={asset.ticker}
                    className="group hover:bg-white/5 transition-colors border-b border-white/5"
                  >
                    <TableCell className="py-5 pl-8">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-background/50 border border-white/5 flex items-center justify-center font-mono font-bold text-xs text-primary group-hover:border-primary/30 transition-all">
                          {asset.ticker}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-foreground/90">
                            {asset.name}
                          </span>
                          <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-tighter">
                            Market Cap Verified
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-mono text-sm font-bold">
                      {asset.current_price}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="secondary"
                        className="bg-primary/5 text-primary border-none font-mono font-bold h-6 px-3"
                      >
                        {asset.allocation}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={cn(
                          "text-sm font-bold font-mono",
                          asset["P&L"].includes("-")
                            ? "text-destructive"
                            : "text-emerald-500"
                        )}
                      >
                        {asset["P&L"]}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-4">
                        <div
                          className="flex items-center gap-1.5"
                          title="Bull Case"
                        >
                          {getInsightIcon(asset.ai_insights.bull_case)}
                          <span className="text-[8px] font-bold uppercase opacity-50">
                            Bull
                          </span>
                        </div>
                        <div
                          className="flex items-center gap-1.5"
                          title="Bear Case"
                        >
                          {getInsightIcon(asset.ai_insights.bear_case)}
                          <span className="text-[8px] font-bold uppercase opacity-50">
                            Bear
                          </span>
                        </div>
                        <div title="Risk Profile">
                          {getRiskBadge(asset.ai_insights.risk_alert)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg hover:text-primary transition-all"
                          onClick={() => handleAction(asset.ticker, "Bookmark")}
                        >
                          <Bookmark className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg hover:text-secondary transition-all"
                          onClick={() => handleAction(asset.ticker, "Add Note")}
                        >
                          <FileText className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Risk & Diversification Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 space-y-8">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-secondary/10 text-secondary">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <Text variant="h3" className="font-bold">
                  Diversification Audit
                </Text>
                <Text
                  variant="caption"
                  className="text-muted-foreground uppercase tracking-widest font-bold text-[9px]"
                >
                  Structural Imbalance Guard
                </Text>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Text
                variant="label"
                className="text-[10px] font-bold text-muted-foreground uppercase"
              >
                Score
              </Text>
              <div className="text-3xl font-bold text-emerald-500 tracking-tighter">
                {data.risk_diversification.diversification_score}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="glass-card border-none bg-card/30">
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" /> Sector Exposure
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-8 h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sectorData}
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      nameKey="name"
                    >
                      {sectorData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
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
              </CardContent>
            </Card>

            <Card className="glass-card border-none bg-card/30">
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <GitCompare className="h-4 w-4 text-secondary" /> Asset
                  Correlation Hub
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(
                  data.risk_diversification.asset_correlation
                ).map(([pair, value]) => (
                  <div
                    key={pair}
                    className="p-4 rounded-xl bg-background/50 border border-white/5 space-y-2 group hover:border-secondary/30 transition-all"
                  >
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-muted-foreground">
                        {pair}
                      </span>
                      <span
                        className={cn(
                          "font-mono font-bold",
                          parseFloat(value) > 0.5
                            ? "text-amber-500"
                            : "text-emerald-500"
                        )}
                      >
                        {value}
                      </span>
                    </div>
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full transition-all duration-1000",
                          parseFloat(value) > 0.5
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        )}
                        style={{ width: `${parseFloat(value) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-10">
          <div className="p-10 rounded-[3rem] bg-primary/5 border border-primary/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform duration-1000">
              <Sparkles className="h-32 w-32 text-primary" />
            </div>
            <div className="flex items-center gap-3 text-primary font-bold text-xs uppercase tracking-widest mb-4">
              <Zap className="h-4 w-4" /> Strategic Bull Case
            </div>
            <Text
              variant="body"
              className="text-foreground/90 leading-relaxed font-medium italic border-l-2 border-primary/20 pl-6 py-2"
            >
              "Your tech-heavy allocation is benefiting from the **AI
              Infrastructure super-cycle**. The current momentum node suggests a
              15% upside ceiling before the next rebalancing window."
            </Text>
            <Button className="mt-8 rounded-xl h-12 px-8 font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/30 transition-all">
              Launch Detailed Modeler
            </Button>
          </div>

          <Card className="glass-card border-none bg-destructive/5 hover:bg-destructive/10 transition-all group relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-destructive opacity-50" />
            <CardContent className="p-8 flex items-start gap-6">
              <div className="p-3 rounded-2xl bg-destructive/10 text-destructive shrink-0">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <Text
                  variant="bodySmall"
                  weight="bold"
                  className="text-destructive uppercase tracking-widest text-[10px]"
                >
                  Imbalance Warning
                </Text>
                <Text
                  variant="caption"
                  className="text-muted-foreground leading-relaxed italic block"
                >
                  "Correlation between **AAPL and GOOG** is currently at 0.75.
                  This indicates a redundant risk node. AI recommends
                  diversifying the 'Equities' hub to include defensive consumer
                  staples."
                </Text>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* STRATEGIC HUB FOOTER */}
      <Card className="glass-card border-none bg-primary/5 p-12 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-1/3 h-full bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />
        <div className="flex flex-col lg:flex-row items-center gap-12 relative z-10">
          <div className="w-24 h-24 rounded-[2.5rem] bg-primary/20 flex items-center justify-center text-primary shadow-2xl shrink-0">
            <BarChart3 className="h-12 w-12" />
          </div>
          <div className="flex-1 text-center lg:text-left space-y-2">
            <Text variant="h2" className="text-2xl font-bold">
              Deep-Dive Intelligence Verified
            </Text>
            <Text
              variant="bodySmall"
              className="text-muted-foreground leading-relaxed max-w-2xl"
            >
              As a **Pro** member, your portfolio is synchronized with the
              **Institutional Data Node** every 15 minutes. Analyst conviction
              scores are refined in real-time as new regulatory filings are
              ingested.
            </Text>
          </div>
          <Button
            variant="outline"
            className="h-12 px-8 rounded-xl font-bold border-primary/30 hover:bg-primary/5 shrink-0"
            asChild
          >
            <Link href="/ai-analyst/event-intelligence">
              Market Catalyst Index
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
