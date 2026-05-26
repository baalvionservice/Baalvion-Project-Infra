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
  ShieldCheck, 
  Loader2,
  Search,
  Filter,
  BarChart3,
  Calendar,
  Download,
  ChevronRight,
  Heart,
  MessageSquare,
  Share2,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { analyticsService } from '@/services/data/analytics-service';
import { CreatorEngagement } from '@/types/analytics';
import { Input } from '@/components/ui/input';
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
 * Creator Engagement Analytical Dashboard.
 * Monitors individual expert interaction volume and network growth velocity.
 */
export default function CreatorEngagementDashboard() {
  const [data, setData] = useState<CreatorEngagement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const response = await analyticsService.getCreatorEngagement();
        if (response.data) setData(response.data);
      } catch (e) {
        console.error('Creator engagement sync failure', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredData = data.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="py-40 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <Text variant="bodySmall" className="text-muted-foreground animate-pulse font-bold tracking-widest uppercase">
          Synthesizing Creator Engagement Matrix...
        </Text>
      </div>
    );
  }

  const formatCompact = (val: number) => 
    new Intl.NumberFormat('en-US', { notation: 'compact' }).format(val);

  // Mock trend data for network momentum
  const growthTrends = [
    { date: '2024-03-01', reach: 45000, engagement: 1200 },
    { date: '2024-03-02', reach: 52000, engagement: 1500 },
    { date: '2024-03-03', reach: 48000, engagement: 1100 },
    { date: '2024-03-04', reach: 61000, engagement: 1800 },
    { date: '2024-03-05', reach: 75000, engagement: 2200 },
    { date: '2024-03-06', reach: 68000, engagement: 1900 },
    { date: '2024-03-07', reach: 82000, engagement: 2500 },
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
              <Text variant="label" className="text-[10px] font-bold tracking-widest uppercase">Network Social Intelligence</Text>
            </div>
            <Text variant="h1" className="text-3xl font-bold">Creator Engagement</Text>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="rounded-xl border-white/10 bg-card/30">
            <Calendar className="mr-2 h-4 w-4" /> Monthly Review
          </Button>
          <Button size="sm" className="rounded-xl shadow-lg shadow-primary/20 font-bold bg-primary">
            <Download className="mr-2 h-4 w-4" /> Export Network Data
          </Button>
        </div>
      </header>

      {/* Aggregate Network Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass-card border-none shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Likes</CardTitle>
            <Heart className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCompact(data.reduce((acc, c) => acc + c.likes, 0))}</div>
            <div className="flex items-center text-[10px] text-emerald-500 font-bold mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" /> +8.4% velocity
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Avg. Engagement</CardTitle>
            <TrendingUp className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(data.reduce((acc, c) => acc + c.engagementRate, 0) / data.length).toFixed(1)}%
            </div>
            <div className="flex items-center text-[10px] text-emerald-500 font-bold mt-1">
              <Sparkles className="h-3 w-3 mr-1" /> High stability
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Shares</CardTitle>
            <Share2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCompact(data.reduce((acc, c) => acc + c.shares, 0))}</div>
            <div className="flex items-center text-[10px] text-muted-foreground font-bold mt-1">
              Viral propagation active
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Network Comments</CardTitle>
            <MessageSquare className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCompact(data.reduce((acc, c) => acc + c.comments, 0))}</div>
            <div className="flex items-center text-[10px] text-emerald-500 font-bold mt-1">
              Positive sentiment peak
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Network Growth & Momentum Chart */}
        <Card className="lg:col-span-8 glass-card border-none shadow-2xl">
          <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 bg-card/30 p-6">
            <div>
              <CardTitle className="text-lg">Network Interaction Momentum</CardTitle>
              <CardDescription>Daily engagement velocity across the expert ecosystem.</CardDescription>
            </div>
            <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary text-[10px] font-bold">LIVE SYNC</Badge>
          </CardHeader>
          <CardContent className="p-8 h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthTrends}>
                <defs>
                  <linearGradient id="colorEngage" x1="0" y1="0" x2="0" y2="1">
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
                  dataKey="engagement" 
                  stroke="#8272F2" 
                  fillOpacity={1} 
                  fill="url(#colorEngage)" 
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Strategic Interaction Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="glass-card border-none shadow-xl bg-primary/5">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" /> Viral Clusters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-xl bg-card border border-white/5 space-y-2">
                <Text variant="caption" className="font-bold">Trending Taxonomy</Text>
                <div className="flex items-center justify-between">
                  <Text variant="bodySmall">DeFi Institutional Yield</Text>
                  <Badge className="bg-emerald-500/10 text-emerald-500 border-none text-[9px] font-bold">HOT</Badge>
                </div>
              </div>
              <Text variant="caption" className="text-muted-foreground leading-relaxed italic">
                "Experts publishing in the **Macroeconomics** hub are seeing a 45% higher share-to-view ratio compared to last cycle benchmarks."
              </Text>
            </CardContent>
          </Card>

          <div className="p-6 rounded-[2rem] border border-secondary/20 bg-secondary/5 space-y-4">
            <div className="flex items-center gap-2 text-secondary font-bold text-sm">
              <Sparkles className="h-4 w-4" /> Strategic Peak
            </div>
            <Text variant="caption" className="text-muted-foreground leading-relaxed">
              Recommendation for March: **Cross-Expert Collaborations**. Insights authored by multiple verified experts are achieving 3.2x higher engagement velocity.
            </Text>
          </div>
        </div>
      </div>

      {/* Detailed Creator Engagement Matrix */}
      <Card className="glass-card border-none shadow-2xl overflow-hidden">
        <CardHeader className="bg-card/30 border-b border-white/5 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl">Expert Engagement Matrix</CardTitle>
            <CardDescription>Individual social impact metrics across the Imperialpedia Index.</CardDescription>
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
                <TableHead className="text-right font-bold text-[10px] uppercase tracking-widest">Likes</TableHead>
                <TableHead className="text-right font-bold text-[10px] uppercase tracking-widest">Comments</TableHead>
                <TableHead className="text-right font-bold text-[10px] uppercase tracking-widest">Shares</TableHead>
                <TableHead className="text-right pr-6 font-bold text-[10px] uppercase tracking-widest">Engagement Rate</TableHead>
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
                        <span className="text-[10px] text-muted-foreground uppercase tracking-tighter">Verified Expert</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-bold text-xs">{creator.totalContent}</TableCell>
                  <TableCell className="text-right font-mono text-xs">{formatCompact(creator.likes)}</TableCell>
                  <TableCell className="text-right font-mono text-xs text-muted-foreground">{formatCompact(creator.comments)}</TableCell>
                  <TableCell className="text-right font-mono text-xs text-muted-foreground">{formatCompact(creator.shares)}</TableCell>
                  <TableCell className="text-right pr-6">
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 border-none font-mono font-bold text-xs px-3 h-7">
                      {creator.engagementRate}%
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
