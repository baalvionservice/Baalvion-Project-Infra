"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Text } from '@/design-system/typography/text';
import { 
  Users, 
  Eye, 
  Activity, 
  ArrowUpRight, 
  ArrowDownRight, 
  Loader2, 
  Download, 
  Calendar,
  BarChart3,
  TrendingUp,
  MousePointer2,
  Clock,
  ChevronRight
} from 'lucide-react';
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
  Cell
} from 'recharts';
import { analyticsService } from '@/lib/services/analyticsService';
import { VisitorStats, TrafficTrendNode, PageStats, UserActivityNode } from '@/types/analytics';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function AnalyticsDashboardPage() {
  const [stats, setStats] = useState<VisitorStats | null>(null);
  const [trends, setTrends] = useState<TrafficTrendNode[]>([]);
  const [topPages, setTopPages] = useState<PageStats[]>([]);
  const [userActivity, setUserActivity] = useState<UserActivityNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [v, t, p, a] = await Promise.all([
          analyticsService.getVisitors(),
          analyticsService.getTrafficTrend(),
          analyticsService.getTopPages(),
          analyticsService.getUserActivity()
        ]);
        setStats(v);
        setTrends(t);
        setTopPages(p);
        setUserActivity(a);
      } catch (e) {
        console.error('Analytics sync failure', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading || !stats) {
    return (
      <div className="py-40 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <Text variant="bodySmall" className="animate-pulse font-bold tracking-widest uppercase text-muted-foreground">
          Establishing Telemetry Handshake...
        </Text>
      </div>
    );
  }

  const formatCompact = (val: number) =>
    new Intl.NumberFormat("en-US", { notation: "compact" }).format(val);

  return (
    <div className="space-y-10 pb-24 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <BarChart3 className="h-4 w-4" />
            <Text variant="label" className="text-[10px] font-bold tracking-widest uppercase">System Performance</Text>
          </div>
          <Text variant="h1" className="text-3xl font-bold tracking-tight">Visitor Analytics</Text>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl border-white/10 bg-card/30 h-11 px-6">
            <Calendar className="mr-2 h-4 w-4" /> 30 Day Window
          </Button>
          <Button className="rounded-xl shadow-lg shadow-primary/20 font-bold bg-primary hover:bg-primary/90 h-11 px-8 transition-all scale-105 active:scale-95">
            <Download className="mr-2 h-4 w-4" /> Export Datasets
          </Button>
        </div>
      </header>

      {/* Vitals Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Visitors', value: formatCompact(stats.totalVisitors), prev: stats.prevTotalVisitors, icon: Users, color: 'text-primary' },
          { label: 'Active Users', value: stats.activeUsers, prev: stats.prevActiveUsers, icon: Activity, color: 'text-emerald-500' },
          { label: 'Page Views', value: formatCompact(stats.pageViews), prev: stats.prevPageViews, icon: Eye, color: 'text-secondary' },
          { label: 'Bounce Rate', value: `${stats.bounceRate}%`, prev: 35, icon: MousePointer2, color: 'text-amber-500' },
        ].map((kpi) => {
          const isUp = true; // Mock comparison logic
          return (
            <Card key={kpi.label} className="glass-card border-none shadow-xl group hover:border-primary/20 transition-all">
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{kpi.label}</CardTitle>
                <kpi.icon className={cn("h-4 w-4", kpi.color)} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tracking-tighter">{kpi.value}</div>
                <div className={cn("flex items-center text-[10px] font-bold mt-1 uppercase", isUp ? "text-emerald-500" : "text-destructive")}>
                  {isUp ? <ArrowUpRight className="h-2.5 w-2.5 mr-1" /> : <ArrowDownRight className="h-2.5 w-2.5 mr-1" />}
                  12.4% vs baseline
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Traffic Trend Chart */}
        <Card className="lg:col-span-8 glass-card border-none shadow-2xl overflow-hidden">
          <CardHeader className="bg-card/30 border-b border-white/5 p-8 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" /> Discovery Momentum
              </CardTitle>
              <CardDescription>Visualizing visitor trajectory across the last 7 cycles.</CardDescription>
            </div>
            <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary text-[10px] font-bold px-3 h-7">LIVE SYNC</Badge>
          </CardHeader>
          <CardContent className="p-8 h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends}>
                <defs>
                  <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8272F2" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8272F2" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="date" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => val.split('-')[2]} />
                <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#1C1822', border: '1px solid #ffffff10', borderRadius: '12px' }} itemStyle={{ color: '#8272F2' }} />
                <Area type="monotone" dataKey="visitors" name="Visitors" stroke="#8272F2" fillOpacity={1} fill="url(#colorVisits)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* User Activity Bar Chart */}
        <Card className="lg:col-span-4 glass-card border-none shadow-xl flex flex-col">
          <CardHeader className="bg-card/30 border-b border-white/5 p-6">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
              <Clock className="h-4 w-4" /> Hourly Intensity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 flex-grow">
            <div className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={userActivity.filter((_, i) => i % 2 === 0)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis dataKey="hour" stroke="#888888" fontSize={8} tickLine={false} axisLine={false} />
                  <Bar dataKey="users" fill="#69B9FF" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
          <CardFooter className="p-4 bg-muted/10 border-t border-white/5">
            <Text variant="caption" className="text-muted-foreground italic text-center w-full">
              Peak activity detected at 14:00 UTC.
            </Text>
          </CardFooter>
        </Card>
      </div>

      {/* Top Pages Matrix */}
      <Card className="glass-card border-none shadow-2xl overflow-hidden">
        <CardHeader className="bg-card/30 border-b border-white/5 p-8 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl">Entry Point Performance</CardTitle>
            <CardDescription>Auditing high-velocity intelligence nodes across the index.</CardDescription>
          </div>
          <Button variant="ghost" size="sm" className="text-primary font-bold text-xs group">
            Full Index Audit <ChevronRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" />
          </Button>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20 border-b border-white/5">
                <TableHead className="pl-8 py-6 font-bold text-[10px] uppercase tracking-widest">Page Node (URL)</TableHead>
                <TableHead className="text-center font-bold text-[10px] uppercase tracking-widest">Views</TableHead>
                <TableHead className="text-center font-bold text-[10px] uppercase tracking-widest">Unique</TableHead>
                <TableHead className="text-center font-bold text-[10px] uppercase tracking-widest">Avg. Time</TableHead>
                <TableHead className="text-right pr-8 font-bold text-[10px] uppercase tracking-widest">Bounce Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topPages.map((page) => (
                <TableRow key={page.url} className="group hover:bg-white/5 transition-colors border-b border-white/5">
                  <TableCell className="py-5 pl-8">
                    <span className="text-xs font-mono font-medium text-primary group-hover:text-foreground transition-colors">{page.url}</span>
                  </TableCell>
                  <TableCell className="text-center font-mono text-xs font-bold">{page.views.toLocaleString()}</TableCell>
                  <TableCell className="text-center font-mono text-xs text-muted-foreground">{page.uniqueVisitors.toLocaleString()}</TableCell>
                  <TableCell className="text-center font-mono text-xs">{page.avgTimeOnPage}</TableCell>
                  <TableCell className="text-right pr-8">
                    <Badge variant="secondary" className="bg-primary/5 text-primary border-none font-mono text-[10px] h-6 px-3">{page.bounceRate}%</Badge>
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
