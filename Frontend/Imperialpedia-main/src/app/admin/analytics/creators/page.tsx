'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Text } from '@/design-system/typography/text';
import { 
  Users, 
  TrendingUp, 
  ArrowLeft, 
  ArrowUpRight, 
  FileText, 
  MousePointer2, 
  ShieldCheck, 
  Loader2,
  Search,
  Filter,
  BarChart3,
  Calendar,
  Download,
  ChevronRight,
  DollarSign
} from 'lucide-react';
import Link from 'next/link';
import { getAdminCreatorAnalytics } from '@/services/mock-api/creators';
import { AdminCreatorAnalytics } from '@/types';
import { Input } from '@/components/ui/input';
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
import { format } from 'date-fns';

/**
 * Creator Performance Dashboard.
 * Monitors engagement, audience growth, and monetization for the expert network.
 */
export default function CreatorPerformanceAnalyticsPage() {
  const [data, setData] = useState<AdminCreatorAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const response = await getAdminCreatorAnalytics();
        setData(response.data);
      } catch (e) {
        console.error('Creator intelligence sync failure', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredData = data.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.username.toLowerCase().includes(search.toLowerCase()) ||
    c.category.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="py-40 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <Text variant="bodySmall" className="text-muted-foreground animate-pulse font-bold uppercase tracking-widest">
          Syncing Creator Network Intelligence...
        </Text>
      </div>
    );
  }

  const formatCompact = (val: number) => 
    new Intl.NumberFormat('en-US', { notation: 'compact' }).format(val);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  const totalExpertReach = data.reduce((acc, curr) => acc + curr.totalViews, 0);
  const avgEngagement = (data.reduce((acc, curr) => acc + curr.engagementRate, 0) / data.length).toFixed(1);
  const totalRevenue = data.reduce((acc, curr) => acc + curr.totalRevenue, 0);

  // Mock trend data for network growth
  const growthTrends = [
    { date: '2024-03-01', creators: 142, growth: 2 },
    { date: '2024-03-02', creators: 145, growth: 3 },
    { date: '2024-03-03', creators: 145, growth: 0 },
    { date: '2024-03-04', creators: 148, growth: 3 },
    { date: '2024-03-05', creators: 152, growth: 4 },
    { date: '2024-03-06', creators: 155, growth: 3 },
    { date: '2024-03-07', creators: 156, growth: 1 },
  ];

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full" asChild>
            <Link href="/admin/analytics"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 text-primary mb-1">
              <Users className="h-4 w-4" />
              <Text variant="label" className="text-[10px] font-bold tracking-widest uppercase">Network Control</Text>
            </div>
            <Text variant="h1" className="text-3xl font-bold">Creator Performance</Text>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="rounded-xl border-white/10 bg-card/30">
            <Calendar className="mr-2 h-4 w-4" /> Monthly Audit
          </Button>
          <Button size="sm" className="rounded-xl shadow-lg shadow-primary/20 font-bold bg-primary">
            <Download className="mr-2 h-4 w-4" /> Export Report
          </Button>
        </div>
      </header>

      {/* High-Level Network Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass-card border-none shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Expert Reach</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCompact(totalExpertReach)}</div>
            <div className="flex items-center text-[10px] text-emerald-500 font-bold mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" /> +8.4% velocity
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Avg. Engagement</CardTitle>
            <MousePointer2 className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgEngagement}%</div>
            <div className="flex items-center text-[10px] text-emerald-500 font-bold mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" /> Stable across hubs
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Expert Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <div className="flex items-center text-[10px] text-emerald-500 font-bold mt-1">
              Platform-wide accrual
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Vetted Experts</CardTitle>
            <ShieldCheck className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.filter(c => c.verified).length}</div>
            <div className="flex items-center text-[10px] text-emerald-500 font-bold mt-1">
              <ShieldCheck className="h-3 w-3 mr-1" /> 100% compliance
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Network Growth Chart */}
        <Card className="lg:col-span-2 glass-card border-none shadow-2xl">
          <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 bg-card/30 p-6">
            <div>
              <CardTitle className="text-lg">Network Momentum</CardTitle>
              <CardDescription>Visualizing expert ecosystem expansion.</CardDescription>
            </div>
            <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary text-[10px] font-bold">DAILY UPDATES</Badge>
          </CardHeader>
          <CardContent className="p-8 h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthTrends}>
                <defs>
                  <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
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
                <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1C1822', border: '1px solid #ffffff10', borderRadius: '12px' }}
                  itemStyle={{ color: '#8272F2' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="creators" 
                  stroke="#8272F2" 
                  fillOpacity={1} 
                  fill="url(#colorGrowth)" 
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Action Sidebar */}
        <div className="space-y-6">
          <Card className="glass-card border-none shadow-xl bg-primary/5">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" /> Compliance Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-xl bg-card border border-white/5 space-y-2">
                <Text variant="caption" className="font-bold">Pending Vetting</Text>
                <div className="flex items-center justify-between">
                  <Text variant="bodySmall">3 Expert candidates</Text>
                  <Button size="sm" variant="ghost" className="h-7 text-xs text-primary font-bold" asChild>
                    <Link href="/admin/creators/verification">Review Hub <ChevronRight className="ml-1 h-3 w-3" /></Link>
                  </Button>
                </div>
              </div>
              <Text variant="caption" className="text-muted-foreground italic leading-relaxed">
                "Experts from the APAC region are showing 15% higher engagement rate growth compared to Q4 benchmarks."
              </Text>
            </CardContent>
          </Card>

          <div className="p-6 rounded-[2rem] border border-secondary/20 bg-secondary/5 space-y-4">
            <div className="flex items-center gap-2 text-secondary font-bold text-sm">
              <TrendingUp className="h-4 w-4" /> Strategy Insight
            </div>
            <Text variant="caption" className="text-muted-foreground leading-relaxed">
              Recruitment priority for March: **Fixed Income Specialists**. We have identified a 240% increase in user search volume for 'Bond Yields'.
            </Text>
          </div>
        </div>
      </div>

      {/* Detailed Creator Performance Matrix */}
      <Card className="glass-card border-none shadow-2xl overflow-hidden">
        <CardHeader className="bg-card/30 border-b border-white/5 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl">Expert Performance Matrix</CardTitle>
            <CardDescription>Individual impact metrics for the Imperialpedia Index.</CardDescription>
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
                <TableHead className="pl-6 font-bold text-[10px] uppercase tracking-widest">Expert Identity</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Nodes</TableHead>
                <TableHead className="text-right font-bold text-[10px] uppercase tracking-widest">Followers</TableHead>
                <TableHead className="text-right font-bold text-[10px] uppercase tracking-widest">Engagement</TableHead>
                <TableHead className="text-right font-bold text-[10px] uppercase tracking-widest">Revenue</TableHead>
                <TableHead className="text-right pr-6 font-bold text-[10px] uppercase tracking-widest">Global Reach</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((creator) => (
                <TableRow key={creator.id} className="group hover:bg-muted/10 transition-colors border-b border-white/5">
                  <TableCell className="py-5 pl-6">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 rounded-lg border border-white/10">
                        <AvatarImage src={creator.avatar} />
                        <AvatarFallback>{creator.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold flex items-center gap-1.5">
                          {creator.name}
                          {creator.verified && <ShieldCheck className="h-3 w-3 text-secondary" />}
                        </span>
                        <span className="text-[10px] text-muted-foreground uppercase">{creator.category}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-xs font-bold">{creator.contentCount}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-xs font-mono">{formatCompact(creator.followers)}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 border-none font-mono font-bold text-xs px-2">
                      {creator.engagementRate}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-xs font-mono font-bold">{formatCurrency(creator.totalRevenue)}</span>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-bold">{formatCompact(creator.totalViews)}</span>
                      <span className="text-[9px] text-muted-foreground uppercase tracking-tighter">Lifetime views</span>
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
