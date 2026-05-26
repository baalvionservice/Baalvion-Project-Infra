'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Text } from '@/design-system/typography/text';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  FileText, 
  Activity, 
  ArrowUpRight, 
  ArrowDownRight, 
  Loader2,
  Calendar,
  Download,
  ChevronRight,
  Eye,
  MousePointer2
} from 'lucide-react';
import Link from 'next/link';
import { analyticsService } from '@/services/data/analytics-service';
import { PlatformOverview } from '@/types/analytics';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

/**
 * Platform Overview Dashboard.
 * Provides high-level visual intelligence on platform scale and trajectory.
 */
export default function PlatformOverviewPage() {
  const [data, setData] = useState<PlatformOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await analyticsService.getPlatformOverview();
        if (response.data) setData(response.data);
      } catch (e) {
        console.error('Failed to sync platform intelligence', e);
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
        <Text variant="bodySmall" className="animate-pulse font-bold uppercase tracking-widest text-muted-foreground">
          Aggregating Platform Intelligence...
        </Text>
      </div>
    );
  }

  const formatCompact = (val: number) => 
    new Intl.NumberFormat('en-US', { notation: 'compact' }).format(val);

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <BarChart3 className="h-4 w-4" />
            <Text variant="label" className="text-[10px] font-bold tracking-widest uppercase">System Performance</Text>
          </div>
          <Text variant="h1" className="text-3xl font-bold tracking-tight">Platform Overview</Text>
          <Text variant="bodySmall" className="text-muted-foreground mt-1">
            Real-time monitoring of the Imperialpedia global ecosystem.
          </Text>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="rounded-xl border-white/10 bg-card/30">
            <Calendar className="mr-2 h-4 w-4" /> Monthly Audit
          </Button>
          <Button size="sm" className="rounded-xl shadow-lg shadow-primary/20 font-bold bg-primary hover:bg-primary/90">
            <Download className="mr-2 h-4 w-4" /> Export Report
          </Button>
        </div>
      </header>

      {/* Primary Metrics Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass-card border-none shadow-xl group hover:border-primary/20 transition-all">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Users</CardTitle>
            <Users className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalUsers.toLocaleString()}</div>
            <div className="flex items-center text-[10px] text-emerald-500 font-bold mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" /> +12.4% growth
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl group hover:border-primary/20 transition-all">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Active Experts</CardTitle>
            <TrendingUp className="h-4 w-4 text-secondary group-hover:scale-110 transition-transform" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.activeCreators}</div>
            <div className="flex items-center text-[10px] text-emerald-500 font-bold mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" /> +8 vetting pending
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl group hover:border-primary/20 transition-all">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Intelligence Nodes</CardTitle>
            <FileText className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalContent.toLocaleString()}</div>
            <div className="flex items-center text-[10px] text-muted-foreground font-bold mt-1">
              Across 12 taxonomies
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl group hover:border-primary/20 transition-all">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Global Reach</CardTitle>
            <Activity className="h-4 w-4 text-secondary group-hover:scale-110 transition-transform" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCompact(data.totalTraffic)}</div>
            <div className="flex items-center text-[10px] text-emerald-500 font-bold mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" /> +18.2% session velocity
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* User Growth Momentum */}
        <Card className="lg:col-span-8 glass-card border-none shadow-2xl overflow-hidden">
          <CardHeader className="bg-card/30 border-b border-white/5 p-6 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">User Momentum</CardTitle>
              <CardDescription>Visualizing ecosystem expansion over the last 30 days.</CardDescription>
            </div>
            <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary text-[10px] font-bold">LATEST UPDATES</Badge>
          </CardHeader>
          <CardContent className="p-8 h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.userGrowth}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8272F2" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8272F2" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#888888" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => val.split('-')[2]}
                />
                <YAxis 
                  stroke="#888888" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(val) => `${val / 1000}k`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1C1822', border: '1px solid #ffffff10', borderRadius: '12px' }}
                  itemStyle={{ color: '#8272F2' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="users" 
                  stroke="#8272F2" 
                  fillOpacity={1} 
                  fill="url(#colorUsers)" 
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Action Sidebar / System Insight */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="glass-card border-none shadow-xl bg-primary/5">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" /> Strategy Insight
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Text variant="caption" className="italic text-muted-foreground leading-relaxed">
                "Platform growth is currently being driven by **Institutional Macro** search intent. The conversion rate for verified expert profiles has spiked by 45% this week."
              </Text>
              <Button variant="link" className="p-0 text-primary h-auto text-xs font-bold mt-4" asChild>
                <Link href="/admin/analytics/content">View detailed content audit <ChevronRight className="ml-1 h-3 w-3" /></Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-card border-none shadow-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Strategic Directives</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { label: 'Review Moderation Queue', href: '/admin/moderation', badge: '5' },
                { label: 'Verify Expert Candidates', href: '/admin/creators/verification', badge: '3' },
                { label: 'Audit SEO Health', href: '/admin/seo-audit', badge: 'Alert' },
              ].map((item) => (
                <Button key={item.label} variant="ghost" className="w-full justify-between h-10 text-xs rounded-xl hover:bg-white/5" asChild>
                  <Link href={item.href}>
                    {item.label}
                    <Badge className="bg-primary/10 text-primary border-none text-[9px] font-bold">{item.badge}</Badge>
                  </Link>
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* High-Impact Content Performance Matrix */}
      <Card className="glass-card border-none shadow-2xl overflow-hidden">
        <CardHeader className="bg-card/30 border-b border-white/5 p-6 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl">High-Impact Intelligence</CardTitle>
            <CardDescription>Articles driving maximum reach across the index.</CardDescription>
          </div>
          <Button variant="ghost" size="sm" className="text-primary font-bold" asChild>
            <Link href="/admin/analytics/content">Full Matrix <ChevronRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20 hover:bg-muted/20 border-b border-white/5">
                <TableHead className="pl-6 font-bold text-[10px] uppercase tracking-widest">Intelligence Node</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Engagement</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Trajectory</TableHead>
                <TableHead className="text-right pr-6 font-bold text-[10px] uppercase tracking-widest">Global Reach</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.topContent.map((item) => (
                <TableRow key={item.id} className="group hover:bg-muted/10 transition-colors border-b border-white/5">
                  <TableCell className="py-5 pl-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold">{item.title}</span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-tighter">By {item.author}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center">
                      <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-mono font-bold text-[10px] px-3">
                        {item.engagement}%
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center">
                      <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 border-none font-bold text-[9px] uppercase tracking-widest">
                        {item.status}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-bold">{formatCompact(item.views)}</span>
                      <span className="text-[9px] text-muted-foreground uppercase">Unique views</span>
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
