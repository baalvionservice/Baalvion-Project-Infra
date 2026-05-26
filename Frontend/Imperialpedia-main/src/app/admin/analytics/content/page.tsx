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
  FileText,
  Eye,
  Heart,
  Share2,
  MessageSquare,
  Clock,
  BarChart3,
  TrendingUp,
  ArrowLeft,
  ArrowUpRight,
  Download,
  Loader2,
  Layers,
  Search,
  CheckCircle2,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { analyticsService } from "@/services/data/analytics-service";
import { ContentAnalyticsReport } from "@/types/analytics";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { Input } from "@/components/ui/input";

/**
 * Content Performance Dashboard.
 * Monitors engagement, reach, and SEO health for all published intelligence.
 */
export default function ContentPerformancePage() {
  const [data, setData] = useState<ContentAnalyticsReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const response = await analyticsService.getContentAnalytics();
        if (response.data) setData(response.data);
      } catch (e) {
        console.error("Failed to sync content intelligence", e);
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
          className="text-muted-foreground animate-pulse font-bold tracking-widest uppercase"
        >
          Syncing Content Performance Matrix...
        </Text>
      </div>
    );
  }

  const formatCompact = (val: number) =>
    new Intl.NumberFormat("en-US", { notation: "compact" }).format(val);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const filteredContent = data.topContent.filter(
    (item) =>
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase())
  );

  const COLORS = ["#8272F2", "#69B9FF", "#10b981", "#f59e0b", "#ef4444"];

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full" asChild>
            <Link href="/admin/analytics">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 text-primary mb-1">
              <FileText className="h-4 w-4" />
              <Text
                variant="label"
                className="text-[10px] font-bold tracking-widest uppercase"
              >
                Editorial Intelligence
              </Text>
            </div>
            <Text variant="h1" className="text-3xl font-bold">
              Content Performance
            </Text>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl border-white/10 bg-card/30"
          >
            <Download className="mr-2 h-4 w-4" /> Export Report
          </Button>
        </div>
      </header>

      {/* Aggregate Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass-card border-none shadow-xl group hover:border-primary/20 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Total Reach
            </CardTitle>
            <Eye className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCompact(data.totalViews)}
            </div>
            <div className="flex items-center text-[10px] text-emerald-500 font-bold mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" /> +12.4% growth
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl group hover:border-primary/20 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Avg. Engagement
            </CardTitle>
            <Heart className="h-4 w-4 text-secondary group-hover:scale-110 transition-transform" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.avgEngagement}%</div>
            <div className="flex items-center text-[10px] text-emerald-500 font-bold mt-1">
              <Zap className="h-3 w-3 mr-1" /> Viral velocity
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl group hover:border-primary/20 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Live Insights
            </CardTitle>
            <FileText className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.totalArticles.toLocaleString()}
            </div>
            <div className="flex items-center text-[10px] text-muted-foreground font-bold mt-1">
              Across 12 taxonomies
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl group hover:border-primary/20 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Avg. Session Depth
            </CardTitle>
            <Clock className="h-4 w-4 text-secondary group-hover:scale-110 transition-transform" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatTime(data.avgReadTime)}
            </div>
            <div className="flex items-center text-[10px] text-emerald-500 font-bold mt-1">
              <CheckCircle2 className="h-3 w-3 mr-1" /> High retention
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Top Content Bar Chart */}
        <Card className="lg:col-span-8 glass-card border-none shadow-2xl">
          <CardHeader className="bg-card/30 border-b border-white/5 p-6">
            <div>
              <CardTitle className="text-lg">High-Impact Research</CardTitle>
              <CardDescription>
                Top content nodes by view volume across the index.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-8 h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.topContent.slice(0, 5)}
                layout="vertical"
                margin={{ left: 40, right: 40 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#ffffff05"
                  horizontal={true}
                  vertical={false}
                />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="title"
                  type="category"
                  stroke="#888888"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  width={150}
                />
                <Tooltip
                  cursor={{ fill: "#ffffff05" }}
                  contentStyle={{
                    backgroundColor: "#1C1822",
                    border: "1px solid #ffffff10",
                    borderRadius: "12px",
                  }}
                />
                <Bar
                  dataKey="views"
                  fill="#8272F2"
                  radius={[0, 4, 4, 0]}
                  barSize={30}
                >
                  {data.topContent.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category breakdown Pie */}
        <Card className="lg:col-span-4 glass-card border-none shadow-2xl">
          <CardHeader className="bg-card/30 border-b border-white/5 p-6">
            <CardTitle className="text-lg">Taxonomy Reach</CardTitle>
            <CardDescription>
              Distribution across intelligence hubs.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.categoryBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="views"
                  nameKey="category"
                >
                  {data.categoryBreakdown.map((entry, index) => (
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
      </div>

      {/* Detailed Content Performance Matrix */}
      <Card className="glass-card border-none shadow-2xl overflow-hidden">
        <CardHeader className="bg-card/30 border-b border-white/5 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl">Intelligence Audit Matrix</CardTitle>
            <CardDescription>
              Article-level performance and SEO health metrics.
            </CardDescription>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search intelligence nodes..."
              className="pl-10 bg-background/50 h-10 rounded-xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20 hover:bg-muted/20 border-b border-white/5">
                <TableHead className="pl-6 font-bold text-[10px] uppercase tracking-widest">
                  Intelligence Title
                </TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">
                  Views
                </TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">
                  Likes
                </TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">
                  Shares
                </TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">
                  Comments
                </TableHead>
                <TableHead className="text-right pr-6 font-bold text-[10px] uppercase tracking-widest">
                  SEO Score
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContent.map((item) => (
                <TableRow
                  key={item.id}
                  className="group hover:bg-muted/10 transition-colors border-b border-white/5"
                >
                  <TableCell className="py-5 pl-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold truncate max-w-xs">
                        {item.title}
                      </span>
                      <div className="flex gap-2 mt-1">
                        <Badge
                          variant="outline"
                          className="bg-primary/5 text-primary border-primary/20 text-[8px] font-bold uppercase py-0 px-1.5 h-4"
                        >
                          {item.category}
                        </Badge>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-mono text-xs font-bold">
                    {item.views.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-center font-mono text-xs text-muted-foreground">
                    {item.likes.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-center font-mono text-xs text-muted-foreground">
                    {item.shares.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-center font-mono text-xs text-muted-foreground">
                    {item.comments.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <Badge
                      variant="secondary"
                      className={cn(
                        "border-none font-mono font-bold text-xs px-3 h-7",
                        item.seoScore > 90
                          ? "bg-emerald-500/10 text-emerald-500"
                          : "bg-amber-500/10 text-amber-500"
                      )}
                    >
                      {item.seoScore}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
