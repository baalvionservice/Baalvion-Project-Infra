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
  Globe,
  TrendingUp,
  Search,
  ArrowLeft,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Calendar,
  Download,
  BarChart3,
  MousePointer2,
  Filter,
  Activity,
} from "lucide-react";
import Link from "next/link";
import { analyticsService } from "@/services/data/analytics-service";
import { TopKeyword } from "@/types/analytics";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Input } from "@/components/ui/input";

/**
 * Top Keywords Analytics Dashboard.
 * Monitors organic search authority and keyword-level performance for the Intelligence Index.
 */
export default function TopKeywordsPage() {
  const [data, setData] = useState<TopKeyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const response = await analyticsService.getTopKeywords();
        if (response.data) setData(response.data);
      } catch (e) {
        console.error("Failed to sync keyword intelligence", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="py-40 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <Text
          variant="bodySmall"
          className="animate-pulse font-bold tracking-widest uppercase text-muted-foreground"
        >
          Scanning Organic Matrix...
        </Text>
      </div>
    );
  }

  const filteredData = data.filter(
    (k) =>
      k.keyword.toLowerCase().includes(search.toLowerCase()) ||
      k.page.toLowerCase().includes(search.toLowerCase())
  );

  const formatCompact = (val: number) =>
    new Intl.NumberFormat("en-US", { notation: "compact" }).format(val);

  // Aggregate stats
  const totalImpressions = data.reduce(
    (acc, curr) => acc + curr.impressions,
    0
  );
  const avgCtr = (
    data.reduce((acc, curr) => acc + curr.ctr, 0) / data.length
  ).toFixed(1);

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
              <Globe className="h-4 w-4" />
              <Text
                variant="label"
                className="text-[10px] font-bold tracking-widest uppercase"
              >
                Organic Authority
              </Text>
            </div>
            <Text variant="h1" className="text-3xl font-bold tracking-tight">
              Keyword Analytics
            </Text>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl border-white/10 bg-card/30 h-11 px-6"
          >
            <Calendar className="mr-2 h-4 w-4" /> 7 Day Outlook
          </Button>
          <Button
            size="sm"
            className="rounded-xl shadow-lg shadow-primary/20 font-bold bg-primary hover:bg-primary/90 h-11 px-6"
          >
            <Download className="mr-2 h-4 w-4" /> Export SEO Audit
          </Button>
        </div>
      </header>

      {/* Aggregate SEO Pulse */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass-card border-none shadow-xl">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Total Impressions
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCompact(totalImpressions)}
            </div>
            <div className="flex items-center text-[10px] text-emerald-500 font-bold mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" /> +12.4% reach velocity
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Average CTR
            </CardTitle>
            <MousePointer2 className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgCtr}%</div>
            <div className="flex items-center text-[10px] text-muted-foreground font-bold mt-1">
              Stable vs baseline
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Top Rank
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">#1.2</div>
            <p className="text-[10px] text-emerald-500 font-bold mt-1">
              Dominant in 'Economics'
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Active Queries
            </CardTitle>
            <Search className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.length}</div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Indexed this cycle
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Visibility Momentum Visualization */}
      <Card className="glass-card border-none shadow-2xl overflow-hidden">
        <CardHeader className="bg-card/30 border-b border-white/5 p-8 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl">Impression Momentum</CardTitle>
            <CardDescription>
              Aggregate impression velocity for the top 5 search queries.
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className="border-primary/20 bg-primary/5 text-primary text-[10px] font-bold uppercase tracking-widest"
          >
            LIVE SYNC
          </Badge>
        </CardHeader>
        <CardContent className="p-8 h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data[0]?.history || []}>
              <defs>
                <linearGradient id="colorImp" x1="0" y1="0" x2="0" y2="1">
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
                dataKey="impressions"
                stroke="#8272F2"
                fillOpacity={1}
                fill="url(#colorImp)"
                strokeWidth={3}
                name="Aggregate Impressions"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Keyword Performance Matrix */}
      <Card className="glass-card border-none shadow-2xl overflow-hidden">
        <CardHeader className="bg-card/30 border-b border-white/5 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl">Search Discovery Matrix</CardTitle>
            <CardDescription>
              Auditing individual keyword rankings and node-level conversion.
            </CardDescription>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by keyword or slug..."
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
                  Search Query (Keyword)
                </TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest">
                  Discovery Node (Page)
                </TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">
                  Avg. Rank
                </TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-right">
                  Impressions
                </TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-right">
                  Clicks
                </TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">
                  CTR
                </TableHead>
                <TableHead className="text-right pr-6 font-bold text-[10px] uppercase tracking-widest">
                  Trajectory
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item) => (
                <TableRow
                  key={item.id}
                  className="group hover:bg-muted/10 transition-colors border-b border-white/5"
                >
                  <TableCell className="py-5 pl-6">
                    <span className="text-sm font-bold text-foreground">
                      {item.keyword}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-mono text-primary hover:underline cursor-pointer">
                      {item.page}
                    </span>
                  </TableCell>
                  <TableCell className="text-center font-mono text-xs font-bold">
                    #{item.rank}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs text-muted-foreground">
                    {item.impressions.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs font-bold text-foreground">
                    {item.clicks.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant="outline"
                      className="bg-primary/5 text-primary border-primary/20 text-[10px] font-bold"
                    >
                      {item.ctr}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex justify-end items-center gap-2">
                      <Badge
                        className={cn(
                          "border-none text-[9px] font-bold uppercase h-5 px-2",
                          item.trend === "Up"
                            ? "bg-emerald-500/10 text-emerald-500"
                            : "bg-destructive/10 text-destructive"
                        )}
                      >
                        {item.trend === "Up" ? (
                          <ArrowUpRight className="h-2.5 w-2.5 mr-1" />
                        ) : (
                          <ArrowDownRight className="h-2.5 w-2.5 mr-1" />
                        )}
                        {item.trend}
                      </Badge>
                    </div>
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
            <Activity className="h-8 w-8" />
          </div>
          <div>
            <Text variant="h3" className="mb-2 text-xl font-bold">
              E-E-A-T Signal Audit
            </Text>
            <Text
              variant="bodySmall"
              className="text-muted-foreground leading-relaxed"
            >
              We identified a **15% lift in rankings** for nodes associated with
              verified expert profiles. Programmatic nodes in the 'Investing'
              hub require additional citation depth to maintain Q2 positions.
            </Text>
          </div>
        </Card>

        <Card className="glass-card border-secondary/20 p-8 flex flex-col gap-4">
          <div className="p-4 rounded-[2rem] bg-secondary/10 w-fit text-secondary">
            <Search className="h-8 w-8" />
          </div>
          <div>
            <Text variant="h3" className="mb-2 text-xl font-bold">
              Search Intent Analysis
            </Text>
            <Text
              variant="bodySmall"
              className="text-muted-foreground leading-relaxed"
            >
              Queries for **'Compound Interest Engine'** show 2.4x higher
              conversion than standard articles. Recommend cross-linking from
              all basic finance definitions to interactive tools.
            </Text>
          </div>
        </Card>
      </div>
    </div>
  );
}
