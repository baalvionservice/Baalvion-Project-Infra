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
import { Text } from "@/design-system/typography/text";
import { cn } from "@/lib/utils";
import {
  Activity,
  Globe,
  Smartphone,
  ArrowLeft,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Download,
  Calendar,
  MapPin,
  TrendingUp,
  Zap,
  MousePointer2,
} from "lucide-react";
import Link from "next/link";
import { analyticsService } from "@/services/data/analytics-service";
import { TrafficTrends } from "@/types/analytics";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";

/**
 * Platform Traffic Trends Dashboard.
 * Visualizes longitudinal visit data, device taxonomy, and geographic density.
 */
export default function PlatformTrafficTrendsPage() {
  const [data, setData] = useState<TrafficTrends | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await analyticsService.getTrafficTrends();
        if (response.data) setData(response.data);
      } catch (e) {
        console.error("Failed to sync traffic intelligence", e);
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
          Synthesizing Global Traffic Nodes...
        </Text>
      </div>
    );
  }

  const formatCompact = (val: number) =>
    new Intl.NumberFormat("en-US", { notation: "compact" }).format(val);

  const COLORS = ["#8272F2", "#69B9FF", "#10b981"];

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full h-12 w-12"
            asChild
          >
            <Link href="/admin/analytics">
              <ArrowLeft className="h-6 w-6" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 text-primary mb-1">
              <Activity className="h-4 w-4" />
              <Text
                variant="label"
                className="text-[10px] font-bold tracking-widest uppercase"
              >
                Network Telemetry
              </Text>
            </div>
            <Text variant="h1" className="text-3xl font-bold tracking-tight">
              Platform Traffic Trends
            </Text>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl border-white/10 bg-card/30 h-11 px-6"
          >
            <Calendar className="mr-2 h-4 w-4" /> 30 Day Window
          </Button>
          <Button
            size="sm"
            className="rounded-xl shadow-lg shadow-primary/20 font-bold bg-primary hover:bg-primary/90 h-11 px-6"
          >
            <Download className="mr-2 h-4 w-4" /> Export Dataset
          </Button>
        </div>
      </header>

      {/* Aggregate Vital Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass-card border-none shadow-xl group hover:border-primary/20 transition-all">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Monthly Reach
            </CardTitle>
            <Globe className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCompact(425000)}</div>
            <div className="flex items-center text-[10px] text-emerald-500 font-bold mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" /> +12.4% scaling
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl group hover:border-secondary/20 transition-all">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Mobile Velocity
            </CardTitle>
            <Smartphone className="h-4 w-4 text-secondary group-hover:scale-110 transition-transform" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">35.2%</div>
            <div className="flex items-center text-[10px] text-emerald-500 font-bold mt-1">
              <TrendingUp className="h-3 w-3 mr-1" /> High optimization
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Regional Diversity
            </CardTitle>
            <MapPin className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">124</div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Countries localized
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Peak Concurrency
            </CardTitle>
            <Zap className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,420</div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Live nodes active
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Momentum Chart */}
        <Card className="lg:col-span-8 glass-card border-none shadow-2xl overflow-hidden">
          <CardHeader className="bg-card/30 border-b border-white/5 p-8 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl">Visit Momentum</CardTitle>
              <CardDescription>
                Visualizing longitudinal traffic trajectory across the
                programmatic index.
              </CardDescription>
            </div>
            <Badge
              variant="outline"
              className="border-primary/20 bg-primary/5 text-primary text-[10px] font-bold"
            >
              LIVE SYNC
            </Badge>
          </CardHeader>
          <CardContent className="p-8 h-[450px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.dailyVisits}>
                <defs>
                  <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
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
                  tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
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
                  dataKey="visits"
                  stroke="#8272F2"
                  fillOpacity={1}
                  fill="url(#colorVisits)"
                  strokeWidth={3}
                  name="Daily Visits"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Device Breakdown Visualization */}
        <Card className="lg:col-span-4 glass-card border-none shadow-2xl overflow-hidden">
          <CardHeader className="bg-card/30 border-b border-white/5 p-6">
            <CardTitle className="text-lg">Device Taxonomy</CardTitle>
            <CardDescription>
              Hardware distribution across the audience network.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 h-[400px] flex flex-col justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.deviceBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={8}
                  dataKey="percent"
                  nameKey="device"
                  animationBegin={0}
                  animationDuration={1500}
                >
                  {data.deviceBreakdown.map((_, index) => (
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
                  height={36}
                  iconType="circle"
                  formatter={(value) => (
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Global Density Matrix */}
      <Card className="glass-card border-none shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5 bg-card/30 flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Geographic Density Matrix</CardTitle>
            <CardDescription>
              Auditing audience reach by international market node.
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className="border-secondary/20 bg-secondary/5 text-secondary text-[10px] font-bold uppercase px-3"
          >
            MARKET COVERAGE
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20 hover:bg-muted/20 border-b border-white/5">
                <TableHead className="pl-6 font-bold text-[10px] uppercase tracking-widest">
                  Market Node (Country)
                </TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-right">
                  Aggregate Visits
                </TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-right">
                  Market Share
                </TableHead>
                <TableHead className="text-right pr-6 font-bold text-[10px] uppercase tracking-widest">
                  Trajectory
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.countryVisits.map((item) => (
                <TableRow
                  key={item.country}
                  className="group hover:bg-muted/10 transition-colors border-b border-white/5"
                >
                  <TableCell className="py-5 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-background/50 border border-white/5 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-bold">{item.country}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs font-bold text-foreground">
                    {item.visits.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-xs text-muted-foreground font-medium">
                      {((item.visits / 285400) * 100).toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <Badge
                      variant="secondary"
                      className={cn(
                        "border-none font-mono font-bold text-xs gap-1 px-3 h-7",
                        item.change >= 0
                          ? "bg-emerald-500/10 text-emerald-500"
                          : "bg-destructive/10 text-destructive"
                      )}
                    >
                      {item.change >= 0 ? (
                        <ArrowUpRight className="h-3 w-3" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3" />
                      )}
                      {Math.abs(item.change)}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Strategic Insight Footer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="glass-card bg-primary/5 border-primary/20 p-8 flex flex-col gap-4">
          <div className="p-4 rounded-[2rem] bg-primary/10 w-fit text-primary">
            <MousePointer2 className="h-8 w-8" />
          </div>
          <div>
            <Text variant="h3" className="mb-2 text-xl font-bold">
              Optimization Strategy
            </Text>
            <Text
              variant="bodySmall"
              className="text-muted-foreground leading-relaxed"
            >
              Mobile traffic has spiked by **12%** following the release of the
              'Wealth ROI' interactive tool. Recommend prioritizing touch-state
              refinements for the Creator Dashboard mobile view.
            </Text>
          </div>
        </Card>

        <Card className="glass-card border-secondary/20 p-8 flex flex-col gap-4">
          <div className="p-4 rounded-[2rem] bg-secondary/10 w-fit text-secondary">
            <Globe className="h-8 w-8" />
          </div>
          <div>
            <Text variant="h3" className="mb-2 text-xl font-bold">
              Market Expansion
            </Text>
            <Text
              variant="bodySmall"
              className="text-muted-foreground leading-relaxed"
            >
              The APAC region, specifically Singapore and India, is showing a
              **24% lift** in session depth. The system recommends surfacing
              more 'Global Macro' research to these nodes.
            </Text>
          </div>
        </Card>
      </div>
    </div>
  );
}
