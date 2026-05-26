"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
import { Progress } from "@/components/ui/progress";
import { Text } from "@/design-system/typography/text";
import {
  BarChart3,
  TrendingUp,
  Users,
  FileText,
  Activity,
  ArrowUpRight,
  Loader2,
  Calendar,
  Download,
  ChevronRight,
  Eye,
  MousePointer2,
  Heart,
  MessageSquare,
  ShieldCheck,
  Zap,
  Globe,
  Monitor,
  Target,
  AlertTriangle,
  Flame,
  Layout,
  Clock,
  ShieldAlert,
} from "lucide-react";
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
  Legend,
} from "recharts";
import { analyticsService } from "@/services/data/analytics-service";
import { PlatformCommandCenterData } from "@/types/analytics";
import { cn } from "@/lib/utils";

/**
 * Platform Analytics Command Center Client.
 * Unified dashboard for orchestrating platform growth, content reach, and system health.
 */
export function AnalyticsCommandCenterClient() {
  const [data, setData] = useState<PlatformCommandCenterData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await analyticsService.getPlatformCommandCenter();
        if (response.data) setData(response.data);
      } catch (e) {
        console.error("Command center handshake failure", e);
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
        <Text
          variant="bodySmall"
          className="animate-pulse font-bold tracking-widest uppercase text-muted-foreground"
        >
          Calibrating Intelligence Command Node...
        </Text>
      </div>
    );
  }

  const formatCompact = (val: number) =>
    new Intl.NumberFormat("en-US", { notation: "compact" }).format(val);

  const COLORS = [
    "#8272F2",
    "#69B9FF",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#6366f1",
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* GLOBAL KPI MATRIX */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[
          {
            label: "Published",
            value: formatCompact(data.platform_metrics.total_articles),
            icon: FileText,
            color: "text-primary",
          },
          {
            label: "Total Users",
            value: formatCompact(data.platform_metrics.total_users),
            icon: Users,
            color: "text-secondary",
          },
          {
            label: "MAU",
            value: formatCompact(data.platform_metrics.monthly_active_users),
            icon: Activity,
            color: "text-emerald-500",
          },
          {
            label: "Page Views",
            value: formatCompact(data.platform_metrics.page_views),
            icon: Eye,
            color: "text-primary",
          },
          {
            label: "Avg Session",
            value: data.platform_metrics.avg_session_duration,
            icon: Clock,
            color: "text-secondary",
          },
          {
            label: "Engagement",
            value: data.platform_metrics.engagement_rate,
            icon: Zap,
            color: "text-amber-500",
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
        {/* TRAFFIC & GROWTH COLUMN */}
        <div className="lg:col-span-8 space-y-8">
          {/* Main Growth Trajectory */}
          <Card className="glass-card border-none shadow-2xl overflow-hidden">
            <CardHeader className="bg-card/30 border-b border-white/5 p-8 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" /> Growth
                  Momentum
                </CardTitle>
                <CardDescription>
                  Correlation of intelligence production and user acquisition
                  nodes.
                </CardDescription>
              </div>
              <Badge
                variant="outline"
                className="border-primary/20 bg-primary/5 text-primary text-[10px] font-bold h-7 px-4"
              >
                LONGITUDINAL INDEX
              </Badge>
            </CardHeader>
            <CardContent className="p-8 h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.growth_trends.articles}>
                  <defs>
                    <linearGradient
                      id="colorGrowth"
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
                    dataKey="count"
                    name="Published Articles"
                    stroke="#8272F2"
                    fillOpacity={1}
                    fill="url(#colorGrowth)"
                    strokeWidth={3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Performance Matrix */}
          <Card className="glass-card border-none shadow-2xl overflow-hidden">
            <CardHeader className="bg-card/30 border-b border-white/5 p-8 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Flame className="h-5 w-5 text-primary" /> High-Impact
                  Intelligence
                </CardTitle>
                <CardDescription>
                  Published research driving maximum discovery reach.
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-primary font-bold text-xs uppercase group"
              >
                Full Index Audit{" "}
                <ChevronRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </Button>
            </CardHeader>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/20 border-b border-white/5">
                    <TableHead className="pl-8 font-bold text-[10px] uppercase tracking-widest py-6">
                      Intelligence Headline
                    </TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest">
                      Taxonomy
                    </TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">
                      Reach (Views)
                    </TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">
                      Eng. Score
                    </TableHead>
                    <TableHead className="text-right pr-8 font-bold text-[10px] uppercase tracking-widest">
                      Read Depth
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.top_articles.map((article) => (
                    <TableRow
                      key={article.title}
                      className="group hover:bg-white/5 transition-colors border-b border-white/5"
                    >
                      <TableCell className="py-5 pl-8">
                        <span className="text-sm font-bold text-foreground/90 truncate max-w-[300px] block">
                          {article.title}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="text-[8px] font-bold border-primary/20 bg-primary/5 text-primary uppercase h-5 px-2"
                        >
                          {article.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-mono text-xs font-bold text-foreground/80">
                        {formatCompact(article.views)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-xs font-bold text-emerald-500 font-mono">
                            {article.engagement}
                          </span>
                          <div className="w-12 h-1 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500"
                              style={{ width: article.engagement }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <span className="text-xs font-medium text-muted-foreground">
                          {article.read_time}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>

        {/* SIDEBAR: SOURCES & ALERTS */}
        <aside className="lg:col-span-4 space-y-8">
          {/* Traffic Sources Pie */}
          <Card className="glass-card border-none shadow-xl bg-card/30">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                <Globe className="h-4 w-4" /> Discovery Channels
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 h-[280px] flex flex-col justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.traffic_sources}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={8}
                    dataKey="value"
                    nameKey="source"
                  >
                    {data.traffic_sources.map((entry, index) => (
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
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-4 mt-6">
                {data.traffic_sources.map((source, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    />
                    <Text
                      variant="label"
                      className="text-[8px] font-bold uppercase truncate"
                    >
                      {source.source}
                    </Text>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Regional Density Table */}
          <Card className="glass-card border-none shadow-xl bg-card/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-secondary flex items-center gap-2">
                <Monitor className="h-4 w-4" /> Global Audience Density
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {data.regional_users.slice(0, 4).map((reg) => (
                <div
                  key={reg.region}
                  className="space-y-2 group cursor-default"
                >
                  <div className="flex justify-between items-end">
                    <Text
                      variant="bodySmall"
                      weight="bold"
                      className="group-hover:text-secondary transition-colors"
                    >
                      {reg.region}
                    </Text>
                    <div className="text-right">
                      <div className="text-sm font-bold font-mono">
                        {reg.count}
                      </div>
                      <Text
                        variant="label"
                        className="text-[8px] opacity-50 uppercase"
                      >
                        {reg.percent}% Share
                      </Text>
                    </div>
                  </div>
                  <Progress value={reg.percent} className="h-1 bg-white/5" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* System Triage Alerts */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 px-2">
              <div className="p-2 rounded-xl bg-destructive/10 text-destructive">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <Text
                variant="h4"
                className="font-bold text-xs uppercase tracking-widest"
              >
                Instructional Anomaly Triage
              </Text>
            </div>

            <div className="space-y-4">
              {data.system_alerts.map((alert) => (
                <Card
                  key={alert.id}
                  className={cn(
                    "glass-card border-none transition-all group relative overflow-hidden",
                    alert.severity === "high"
                      ? "bg-destructive/5 hover:bg-destructive/10"
                      : "bg-primary/5 hover:bg-primary/10"
                  )}
                >
                  <div
                    className={cn(
                      "absolute top-0 left-0 w-1 h-full opacity-50",
                      alert.severity === "high"
                        ? "bg-destructive"
                        : "bg-primary"
                    )}
                  />
                  <CardContent className="p-5 flex items-start gap-4">
                    <div
                      className={cn(
                        "p-2.5 rounded-xl shrink-0 mt-1",
                        alert.severity === "high"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-primary/10 text-primary"
                      )}
                    >
                      {alert.type === "traffic" ? (
                        <Activity className="h-4 w-4" />
                      ) : alert.type === "trending" ? (
                        <Flame className="h-4 w-4" />
                      ) : (
                        <ShieldAlert className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <Badge
                          variant="outline"
                          className="text-[7px] font-bold uppercase h-4 px-1.5 border-white/10"
                        >
                          {alert.type}
                        </Badge>
                        <Text
                          variant="caption"
                          className="text-[8px] opacity-50 font-mono"
                        >
                          {alert.timestamp}
                        </Text>
                      </div>
                      <Text
                        variant="caption"
                        weight="bold"
                        className="leading-relaxed block text-foreground/90"
                      >
                        "{alert.message}"
                      </Text>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* STRATEGIC HUB FOOTER */}
      <Card className="glass-card border-none bg-primary/5 p-12 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-1/3 h-full bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />
        <div className="flex flex-col lg:flex-row items-center gap-12 relative z-10">
          <div className="w-24 h-24 rounded-[2.5rem] bg-primary/20 flex items-center justify-center text-primary shadow-2xl shrink-0">
            <Layout className="h-12 w-12" />
          </div>
          <div className="flex-1 text-center lg:text-left space-y-3">
            <Text variant="h2" className="text-3xl font-bold tracking-tight">
              Enterprise Triage Capacity
            </Text>
            <Text
              variant="body"
              className="text-muted-foreground leading-relaxed max-w-3xl"
            >
              This Command Center utilized the **Institutional Analytics Hub**.
              Data nodes are synchronized every 60 seconds across the global
              production ring. High-impact anomaly detection is active for all
              1M+ indexable research paths.
            </Text>
          </div>
          <Button
            size="lg"
            className="h-14 px-10 rounded-2xl font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/30 shrink-0 group scale-105 active:scale-95 transition-all"
          >
            Launch Data Audit Cycle
          </Button>
        </div>
      </Card>
    </div>
  );
}
