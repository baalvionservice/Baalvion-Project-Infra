"use client";

import React, { useEffect, useState } from "react";
import {
  PremiumDashboardData,
  PremiumAnalyticsKPI,
  PremiumReportNode,
  AdvancedMetricNode,
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Text } from "@/design-system/typography/text";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  DollarSign,
  Zap,
  Activity,
  BarChart3,
  Download,
  Share2,
  Clock,
  Search,
  Filter,
  Loader2,
  Calendar,
  ChevronRight,
  Target,
  Layers,
  Sparkles,
  FileText,
  ArrowRight,
  PieChart as PieIcon,
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

/**
 * Premium Analytics & Reporting Dashboard Client.
 * Specialized hub for monitoring business performance, user retention, and reporting dispatches.
 */
export function PremiumDashboardClient() {
  const [data, setData] = useState<PremiumDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">(
    "monthly"
  );

  useEffect(() => {
    async function loadData() {
      try {
        const response = await premiumService.getDashboardData();
        if (response.data) setData(response.data);
      } catch (e) {
        console.error("Premium dashboard sync failure", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleAction = (label: string) => {
    toast({
      title: "Action Initiated",
      description: `Targeting reporting node: ${label}`,
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
          Synthesizing Growth Matrix...
        </Text>
      </div>
    );
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "mock_up":
        return <TrendingUp className="h-3 w-3 text-emerald-500" />;
      case "mock_down":
        return <TrendingDown className="h-3 w-3 text-destructive" />;
      default:
        return <Minus className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "mock_ready":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-bold uppercase text-[8px] h-5 px-2">
            Ready
          </Badge>
        );
      case "mock_generating":
        return (
          <Badge className="bg-primary/10 text-primary border-none font-bold uppercase text-[8px] h-5 px-2 animate-pulse">
            Generating
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-10 pb-24 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <Sparkles className="h-4 w-4" />
            <Text
              variant="label"
              className="text-[10px] font-bold tracking-widest uppercase"
            >
              Premium Business Intelligence
            </Text>
          </div>
          <Text variant="h1" className="text-3xl font-bold tracking-tight">
            Performance Hub
          </Text>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-card/30 border border-white/5 p-1 rounded-xl h-11">
            {(["daily", "weekly", "monthly"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "px-4 h-9 rounded-lg text-[10px] font-bold uppercase transition-all",
                  period === p
                    ? "bg-primary text-white shadow-lg"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {p}
              </button>
            ))}
          </div>
          <Button
            size="sm"
            className="rounded-xl shadow-lg shadow-primary/20 font-bold bg-primary hover:bg-primary/90 h-11 px-6"
          >
            <Download className="mr-2 h-4 w-4" /> Export Master Report
          </Button>
        </div>
      </header>

      {/* Aggregate KPI Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {data.analytics_kpis.map((kpi) => (
          <Card
            key={kpi.metric}
            className="glass-card border-none shadow-xl group hover:border-primary/20 transition-all"
          >
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {kpi.metric}
              </CardTitle>
              {getTrendIcon(kpi.trend)}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight">
                {kpi.value}
              </div>
              <p
                className={cn(
                  "text-[9px] font-bold mt-1 uppercase tracking-tighter",
                  kpi.trend === "mock_up"
                    ? "text-emerald-500"
                    : kpi.trend === "mock_down"
                    ? "text-destructive"
                    : "text-muted-foreground"
                )}
              >
                {kpi.trend === "mock_up"
                  ? "+12.4% vs baseline"
                  : kpi.trend === "mock_down"
                  ? "-2.1% anomaly"
                  : "Stable trajectory"}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Momentum Chart */}
        <div className="lg:col-span-8 space-y-8">
          <Card className="glass-card border-none shadow-2xl overflow-hidden">
            <CardHeader className="bg-card/30 border-b border-white/5 p-8 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" /> Growth Velocity
                </CardTitle>
                <CardDescription>
                  Correlating monthly revenue cycles with active user nodes.
                </CardDescription>
              </div>
              <Badge
                variant="outline"
                className="border-primary/20 bg-primary/5 text-primary text-[10px] font-bold px-3"
              >
                PRO ANALYTICS
              </Badge>
            </CardHeader>
            <CardContent className="p-8 h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.growth_chart_data}>
                  <defs>
                    <linearGradient
                      id="colorRevenue"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
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
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1C1822",
                      border: "1px solid #ffffff10",
                      borderRadius: "12px",
                    }}
                  />
                  <Legend verticalAlign="top" height={36} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Net Revenue"
                    stroke="#8272F2"
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                    strokeWidth={3}
                  />
                  <Area
                    type="monotone"
                    dataKey="users"
                    name="Active Nodes"
                    stroke="#69B9FF"
                    fill="transparent"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Reporting Catalog */}
          <Card className="glass-card border-none shadow-2xl overflow-hidden">
            <CardHeader className="bg-card/30 border-b border-white/5 p-8 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" /> Reporting Hub
                </CardTitle>
                <CardDescription>
                  Scheduled audits and institutional-grade data exports.
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-primary font-bold text-xs"
              >
                View Archive
              </Button>
            </CardHeader>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/20 border-b border-white/5">
                    <TableHead className="pl-8 font-bold text-[10px] uppercase tracking-widest py-6">
                      Report Label
                    </TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">
                      Format
                    </TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">
                      Lifecycle Status
                    </TableHead>
                    <TableHead className="text-right pr-8 font-bold text-[10px] uppercase tracking-widest">
                      Handshake Time
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.reports.map((report) => (
                    <TableRow
                      key={report.report_name}
                      className="group hover:bg-white/5 transition-colors border-b border-white/5"
                    >
                      <TableCell className="py-5 pl-8">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-background/50 border border-white/5 text-muted-foreground group-hover:text-primary transition-all">
                            <FileText className="h-4 w-4" />
                          </div>
                          <span className="text-sm font-bold">
                            {report.report_name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className="text-[8px] font-mono border-white/10 uppercase"
                        >
                          {report.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center">
                          {getStatusBadge(report.status)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-xs font-bold text-foreground/70">
                            {report.last_generated.split(" ")[0]}
                          </span>
                          <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-tighter">
                            Verified Dispatch
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>

        {/* Advanced Metrics Sidebar */}
        <div className="lg:col-span-4 space-y-8">
          <Card className="glass-card border-none bg-primary/5 shadow-xl h-fit">
            <CardHeader className="p-8 border-b border-white/5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                  <Activity className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">Lifecycle Metrics</CardTitle>
              </div>
              <CardDescription>
                Advanced cohort analysis and retention telemetry.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              {data.advanced_metrics.map((metric) => (
                <div
                  key={metric.metric}
                  className="space-y-3 group cursor-default"
                >
                  <div className="flex justify-between items-end">
                    <div className="space-y-0.5">
                      <Text
                        variant="label"
                        className="text-[9px] opacity-50 font-bold uppercase tracking-widest"
                      >
                        {metric.metric}
                      </Text>
                      <Text
                        variant="h4"
                        className="text-xl font-bold group-hover:text-primary transition-colors"
                      >
                        {metric.value}
                      </Text>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-[8px] border-white/10 bg-black/20 uppercase font-bold h-5"
                    >
                      {metric.segment}
                    </Badge>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full transition-all duration-1000",
                        metric.metric.includes("Churn")
                          ? "bg-destructive w-[3%]"
                          : "bg-primary w-[92%]"
                      )}
                    />
                  </div>
                </div>
              ))}

              <div className="pt-6 border-t border-white/5">
                <div className="flex items-center gap-2 text-secondary font-bold text-[10px] uppercase mb-3">
                  <Target className="h-3 w-3" /> Strategic Directives
                </div>
                <Text
                  variant="caption"
                  className="text-muted-foreground leading-relaxed italic block"
                >
                  "Pro-tier retention remains high (92%). The churn spike in
                  standard tiers is correlated with the seasonal 'Taxonomy
                  Re-indexing' event."
                </Text>
              </div>
            </CardContent>
            <CardFooter className="p-4 bg-muted/10 flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-[9px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary rounded-xl"
                onClick={() => handleAction("Detailed Cohort Audit")}
              >
                Access Detailed Cohort Audit{" "}
                <ChevronRight className="ml-1 h-3 w-3" />
              </Button>
            </CardFooter>
          </Card>

          <Card className="glass-card border-none bg-secondary/5 border-secondary/20 p-8 flex flex-col gap-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <Layers className="h-16 w-16 text-secondary" />
            </div>
            <div className="flex items-center gap-2 text-secondary font-bold text-sm uppercase tracking-widest">
              <PieIcon className="h-4 w-4" /> Feature Utilization
            </div>
            <Text
              variant="caption"
              className="text-muted-foreground leading-relaxed"
            >
              **AI Outliner** adoption is up 45% following the deployment of the
              programmatic SEO v2 node. Users engaging with this feature show a
              **3.2x higher LTV**.
            </Text>
            <Button
              variant="link"
              className="p-0 h-auto w-fit text-secondary font-bold text-xs group/link"
            >
              View Feature Audit Matrix{" "}
              <ArrowRight className="ml-1.5 h-3 w-3 transition-transform group-hover/link:translate-x-1" />
            </Button>
          </Card>

          <div className="p-8 rounded-[3rem] bg-card/30 border border-white/5 text-center space-y-4">
            <div className="w-16 h-16 rounded-[1.5rem] bg-primary/10 flex items-center justify-center text-primary mx-auto">
              <Share2 className="h-8 w-8" />
            </div>
            <Text variant="bodySmall" weight="bold">
              Reporting Collaboration
            </Text>
            <Text
              variant="caption"
              className="text-muted-foreground leading-relaxed block"
            >
              Share institutional audits directly with your team or export to
              the **Admin Compliance Node**.
            </Text>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1 rounded-xl h-10 border-primary/20 text-primary font-bold text-[10px] uppercase"
                onClick={() => handleAction("Share via Email")}
              >
                Email
              </Button>
              <Button
                variant="outline"
                className="flex-1 rounded-xl h-10 border-primary/20 text-primary font-bold text-[10px] uppercase"
                onClick={() => handleAction("Share via Slack")}
              >
                Slack
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
