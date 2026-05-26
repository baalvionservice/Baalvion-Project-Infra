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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Share2,
  ShieldCheck,
  Zap,
  Globe,
  Monitor,
  Target,
  Clock,
  ArrowLeft,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Link from "next/link";
import { analyticsService } from "@/services/data/analytics-service";
import { FullAnalyticsOverview } from "@/types/analytics";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  Cell,
} from "recharts";

/**
 * Full Analytics Mission Control.
 * Aggregates all primary telemetry modules into a single summary view.
 */
export default function FullAnalyticsOverviewPage() {
  const [data, setData] = useState<FullAnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await analyticsService.getFullAnalyticsOverview();
        if (response.data) setData(response.data);
      } catch (e) {
        console.error("Failed to sync global intelligence", e);
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
          Aggregating Ecosystem Intelligence...
        </Text>
      </div>
    );
  }

  const formatCompact = (val: number) =>
    new Intl.NumberFormat("en-US", { notation: "compact" }).format(val);

  const COLORS = ["#8272F2", "#69B9FF", "#10b981", "#f59e0b", "#ef4444"];

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <BarChart3 className="h-4 w-4" />
            <Text
              variant="label"
              className="text-[10px] font-bold tracking-widest uppercase"
            >
              Mission Control
            </Text>
          </div>
          <Text variant="h1" className="text-3xl font-bold tracking-tight">
            Full Analytics Overview
          </Text>
          <Text variant="bodySmall" className="text-muted-foreground mt-1">
            Orchestrating growth across the Imperialpedia programmatic index.
          </Text>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl border-white/10 bg-card/30 h-11 px-6"
          >
            <Calendar className="mr-2 h-4 w-4" /> 30 Day Outlook
          </Button>
          <Button
            size="sm"
            className="rounded-xl shadow-lg shadow-primary/20 font-bold bg-primary hover:bg-primary/90 h-11 px-6"
          >
            <Download className="mr-2 h-4 w-4" /> Export Report
          </Button>
        </div>
      </header>

      {/* Primary Aggregate Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass-card border-none shadow-xl group hover:border-primary/20 transition-all">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Global Reach
            </CardTitle>
            <Activity className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCompact(data.platformOverview.totalTraffic)}
            </div>
            <div className="flex items-center text-[10px] text-emerald-500 font-bold mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" /> +18.2% session velocity
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl group hover:border-secondary/20 transition-all">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Vetted Experts
            </CardTitle>
            <Users className="h-4 w-4 text-secondary group-hover:scale-110 transition-transform" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.platformOverview.activeCreators}
            </div>
            <div className="flex items-center text-[10px] text-emerald-500 font-bold mt-1">
              <ShieldCheck className="h-3 w-3 mr-1" /> 100% compliance
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Intelligence Nodes
            </CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.platformOverview.totalContent.toLocaleString()}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Indexed this cycle
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Total Readers
            </CardTitle>
            <Target className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCompact(data.platformOverview.totalUsers)}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Accumulated audience
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Momentum Chart */}
        <Card className="lg:col-span-8 glass-card border-none shadow-2xl overflow-hidden">
          <CardHeader className="bg-card/30 border-b border-white/5 p-8 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl">Engagement Momentum</CardTitle>
              <CardDescription>
                Daily Active Users (DAU) vs Engagement Events.
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
              <AreaChart data={data.dailyActiveUsers}>
                <defs>
                  <linearGradient id="colorDau" x1="0" y1="0" x2="0" y2="1">
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
                  dataKey="activeUsers"
                  stroke="#8272F2"
                  fillOpacity={1}
                  fill="url(#colorDau)"
                  strokeWidth={3}
                  name="Active Nodes"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Performers Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="glass-card border-none shadow-xl bg-primary/5">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" /> Top Intelligence
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.topContent.slice(0, 3).map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between group"
                >
                  <div className="min-w-0">
                    <Text
                      variant="bodySmall"
                      weight="bold"
                      className="truncate block group-hover:text-primary transition-colors"
                    >
                      {item.title}
                    </Text>
                    <Text
                      variant="caption"
                      className="text-[10px] opacity-50 uppercase"
                    >
                      {item.category}
                    </Text>
                  </div>
                  <Badge
                    variant="outline"
                    className="ml-2 border-white/10 text-[9px] font-bold"
                  >
                    #{idx + 1}
                  </Badge>
                </div>
              ))}
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-primary font-bold text-[10px] mt-2 group"
                asChild
              >
                <Link href="/admin/analytics/content">
                  View Full Index{" "}
                  <ChevronRight className="ml-1 h-3 w-3 transition-transform group-hover/btn:translate-x-1" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-card border-none shadow-xl">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-secondary" /> Elite Experts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.topCreators.slice(0, 3).map((creator) => (
                <div key={creator.id} className="flex items-center gap-3">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={creator.avatar} />
                    <AvatarFallback>{creator.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <Text
                      variant="bodySmall"
                      weight="bold"
                      className="truncate block"
                    >
                      {creator.name}
                    </Text>
                    <Text
                      variant="caption"
                      className="text-[9px] text-emerald-500 font-bold uppercase"
                    >
                      {creator.engagementRate}% ROI
                    </Text>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Detailed Drill-down Matrix */}
      <Accordion type="single" collapsible className="w-full space-y-4">
        <AccordionItem value="traffic" className="border-none">
          <Card className="glass-card overflow-hidden">
            <AccordionTrigger className="px-8 hover:no-underline">
              <div className="flex items-center gap-4 text-left">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Globe className="h-5 w-5" />
                </div>
                <div>
                  <Text variant="h4" className="font-bold">
                    Traffic & Discovery Drills
                  </Text>
                  <Text variant="caption" className="text-muted-foreground">
                    Hardware distribution and geographic density.
                  </Text>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="p-8 border-t border-white/5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <Text
                    variant="label"
                    className="text-[10px] text-muted-foreground font-bold"
                  >
                    Hardware Taxonomy
                  </Text>
                  <div className="space-y-4">
                    {data.trafficTrends.deviceBreakdown.map((device: any) => (
                      <div key={device.device} className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium">{device.device}</span>
                          <span className="font-bold">{device.percent}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-muted/20 rounded-full overflow-hidden">
                          <div
                            className="bg-primary h-full transition-all duration-1000"
                            style={{ width: `${device.percent}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-6">
                  <Text
                    variant="label"
                    className="text-[10px] text-muted-foreground font-bold"
                  >
                    International Penetration
                  </Text>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableBody>
                        {data.trafficTrends.countryVisits
                          .slice(0, 4)
                          .map((country: any) => (
                            <TableRow
                              key={country.country}
                              className="hover:bg-transparent border-white/5"
                            >
                              <TableCell className="pl-0 py-3 font-medium text-sm">
                                {country.country}
                              </TableCell>
                              <TableCell className="text-right py-3 font-mono text-xs">
                                {formatCompact(country.visits)}
                              </TableCell>
                              <TableCell className="text-right pr-0 py-3">
                                <Badge className="bg-emerald-500/10 text-emerald-500 border-none text-[9px] font-bold">
                                  +{country.change}%
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </Card>
        </AccordionItem>

        <AccordionItem value="engagement" className="border-none">
          <Card className="glass-card overflow-hidden">
            <AccordionTrigger className="px-8 hover:no-underline">
              <div className="flex items-center gap-4 text-left">
                <div className="p-2 rounded-lg bg-secondary/10 text-secondary">
                  <Heart className="h-5 w-5" />
                </div>
                <div>
                  <Text variant="h4" className="font-bold">
                    Interaction Velocity Matrix
                  </Text>
                  <Text variant="caption" className="text-muted-foreground">
                    Longitudinal sentiment and viral propagation tracking.
                  </Text>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="p-8 border-t border-white/5">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.engagementTrends.combined.slice(-7)}>
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
                      tickFormatter={(val) => val.split("-")[2]}
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
                    <Line
                      type="monotone"
                      dataKey="likes"
                      stroke="#8272F2"
                      strokeWidth={2}
                      dot={false}
                      name="Likes"
                    />
                    <Line
                      type="monotone"
                      dataKey="comments"
                      stroke="#69B9FF"
                      strokeWidth={2}
                      dot={false}
                      name="Comments"
                    />
                    <Line
                      type="monotone"
                      dataKey="shares"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={false}
                      name="Shares"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </AccordionContent>
          </Card>
        </AccordionItem>
      </Accordion>

      {/* Strategic Directives Footer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-[2rem] bg-emerald-500/5 border border-emerald-500/20 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500">
            <Zap className="h-6 w-6" />
          </div>
          <div>
            <Text variant="bodySmall" weight="bold">
              System Health
            </Text>
            <Text variant="caption" className="text-muted-foreground">
              Operational • 42ms latency
            </Text>
          </div>
        </div>

        <div className="p-6 rounded-[2rem] bg-primary/5 border border-primary/20 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-primary/10 text-primary">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <Text variant="bodySmall" weight="bold">
              pSEO Compliance
            </Text>
            <Text variant="caption" className="text-muted-foreground">
              98.2% Sitemap Health
            </Text>
          </div>
        </div>

        <div className="p-6 rounded-[2rem] bg-secondary/5 border border-secondary/20 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-secondary/10 w-fit text-secondary">
            <Target className="h-6 w-6" />
          </div>
          <div>
            <Text variant="bodySmall" weight="bold">
              Growth Strategy
            </Text>
            <Text variant="caption" className="text-muted-foreground">
              Q2 Target: 2M Pages
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
}
