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
  Trophy,
  TrendingUp,
  ArrowLeft,
  ArrowUpRight,
  ShieldCheck,
  Loader2,
  Search,
  Filter,
  BarChart3,
  Calendar,
  Download,
  DollarSign,
  ChevronRight,
  Users,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { creatorsService } from "@/services/data/creators-service";
import { TopCreator } from "@/types/analytics";
import { Input } from "@/components/ui/input";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

/**
 * Top Performing Creators Leaderboard.
 * Visualizes the elite tier of the expert network by reach and revenue.
 */
export default function TopCreatorsLeaderboardPage() {
  const [data, setData] = useState<TopCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const response = await creatorsService.getTopCreators();
        if (response.data) setData(response.data);
      } catch (e) {
        console.error("Failed to sync creator leaderboard", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredData = data.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.category && c.category.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="py-40 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <Text
          variant="bodySmall"
          className="text-muted-foreground animate-pulse font-bold tracking-widest uppercase"
        >
          Ranking Expert Intelligence...
        </Text>
      </div>
    );
  }

  const formatCompact = (val: number) =>
    new Intl.NumberFormat("en-US", { notation: "compact" }).format(val);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(val);

  // Growth trend mock for the elite cohort
  const growthTrends = [
    { date: "2024-03-01", networkReach: 1250000 },
    { date: "2024-03-02", networkReach: 1320000 },
    { date: "2024-03-03", networkReach: 1280000 },
    { date: "2024-03-04", networkReach: 1450000 },
    { date: "2024-03-05", networkReach: 1680000 },
    { date: "2024-03-06", networkReach: 1590000 },
    { date: "2024-03-07", networkReach: 1820000 },
  ];

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
              <Trophy className="h-4 w-4" />
              <Text
                variant="label"
                className="text-[10px] font-bold tracking-widest uppercase"
              >
                Elite Network Audit
              </Text>
            </div>
            <Text variant="h1" className="text-3xl font-bold">
              Top Performing Creators
            </Text>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl border-white/10 bg-card/30"
          >
            <Calendar className="mr-2 h-4 w-4" /> 30 Day Rank
          </Button>
          <Button
            size="sm"
            className="rounded-xl shadow-lg shadow-primary/20 font-bold bg-primary"
          >
            <Download className="mr-2 h-4 w-4" /> Export Leaderboard
          </Button>
        </div>
      </header>

      {/* Aggregate Network Impact */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass-card border-none shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Total Network Reach
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCompact(
                data.reduce((acc, c) => acc + (c.followers || 0), 0)
              )}
            </div>
            <div className="flex items-center text-[10px] text-emerald-500 font-bold mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" /> +12.4% expansion
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Avg. Engagement
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(
                data.reduce((acc, c) => acc + c.engagementRate, 0) / data.length
              ).toFixed(1)}
              %
            </div>
            <div className="flex items-center text-[10px] text-emerald-500 font-bold mt-1">
              <Sparkles className="h-3 w-3 mr-1" /> Viral velocity active
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Expert Accrual
            </CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                data.reduce((acc, c) => acc + (c.revenue || 0), 0)
              )}
            </div>
            <div className="flex items-center text-[10px] text-muted-foreground font-bold mt-1">
              Platform-wide distribution
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Verified Experts
            </CardTitle>
            <ShieldCheck className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.filter((c) => c.verified).length}
            </div>
            <div className="flex items-center text-[10px] text-emerald-500 font-bold mt-1">
              100% Vetting Compliance
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Network Reach Momentum */}
        <Card className="lg:col-span-8 glass-card border-none shadow-2xl overflow-hidden">
          <CardHeader className="bg-card/30 border-b border-white/5 p-6 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Elite Reach Momentum</CardTitle>
              <CardDescription>
                Aggregate impression velocity across the top 10 experts.
              </CardDescription>
            </div>
            <Badge
              variant="outline"
              className="border-primary/20 bg-primary/5 text-primary text-[10px] font-bold"
            >
              LIVE SYNC
            </Badge>
          </CardHeader>
          <CardContent className="p-8 h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthTrends}>
                <defs>
                  <linearGradient id="colorReach" x1="0" y1="0" x2="0" y2="1">
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
                  tickFormatter={(val) => val.split("-")[2]}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`}
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
                  dataKey="networkReach"
                  stroke="#8272F2"
                  fillOpacity={1}
                  fill="url(#colorReach)"
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Strategy Context Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="glass-card border-none shadow-xl bg-primary/5">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> Algorithmic Peak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Text
                variant="caption"
                className="italic text-muted-foreground leading-relaxed"
              >
                "Experts publishing in the **Fixed Income** taxonomy are seeing
                a 45% higher share-to-view ratio. We recommend featuring these
                creators in the Q2 Intelligence Highlights."
              </Text>
              <Button
                variant="link"
                className="p-0 text-primary h-auto text-xs font-bold mt-4"
                asChild
              >
                <Link href="/admin/analytics/content">
                  View Taxonomy Audit <ChevronRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-card border-none shadow-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Revenue Leaders</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.slice(0, 3).map((creator, i) => (
                <div
                  key={creator.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-muted-foreground w-4">
                      #{i + 1}
                    </span>
                    <Text
                      variant="bodySmall"
                      weight="bold"
                      className="truncate max-w-[120px]"
                    >
                      {creator.name}
                    </Text>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-emerald-500/10 text-emerald-500 border-none font-mono text-[10px]"
                  >
                    {formatCurrency(creator.revenue || 0)}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Leaderboard Matrix */}
      <Card className="glass-card border-none shadow-2xl overflow-hidden">
        <CardHeader className="bg-card/30 border-b border-white/5 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl">
              Expert Performance Leaderboard
            </CardTitle>
            <CardDescription>
              Auditing individual impact and network expansion.
            </CardDescription>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search experts..."
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
                <TableHead className="w-16 text-center font-bold text-[10px] uppercase tracking-widest">
                  Rank
                </TableHead>
                <TableHead className="pl-6 font-bold text-[10px] uppercase tracking-widest">
                  Expert Identity
                </TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest">
                  Taxonomy
                </TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">
                  Nodes
                </TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-right">
                  Audience
                </TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">
                  Engagement
                </TableHead>
                <TableHead className="text-right pr-6 font-bold text-[10px] uppercase tracking-widest">
                  Revenue Impact
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((creator, index) => (
                <TableRow
                  key={creator.id}
                  className="group hover:bg-muted/10 transition-colors border-b border-white/5"
                >
                  <TableCell className="text-center font-mono text-xs font-bold text-muted-foreground">
                    {index + 1}
                  </TableCell>
                  <TableCell className="py-5 pl-6">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 rounded-xl border border-white/10">
                        <AvatarImage src={creator.avatar} />
                        <AvatarFallback>
                          {creator.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold flex items-center gap-1.5">
                          {creator.name}
                          {creator.verified && (
                            <ShieldCheck className="h-3 w-3 text-secondary" />
                          )}
                        </span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-tighter">
                          Verified Creator
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="bg-primary/5 text-primary border-primary/20 text-[8px] font-bold uppercase h-5"
                    >
                      {creator.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center font-bold text-xs">
                    {creator.totalContent}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs font-bold">
                    {formatCompact(creator.followers || 0)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant="secondary"
                      className="bg-emerald-500/10 text-emerald-500 border-none font-mono font-bold text-xs px-2"
                    >
                      {creator.engagementRate}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-bold text-emerald-500">
                        {formatCurrency(creator.revenue || 0)}
                      </span>
                      <span className="text-[9px] text-muted-foreground uppercase">
                        Lifetime Earned
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
  );
}
