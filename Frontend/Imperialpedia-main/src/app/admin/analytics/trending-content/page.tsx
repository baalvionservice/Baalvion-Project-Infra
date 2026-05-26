'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Text } from '@/design-system/typography/text';
import { 
  Flame, 
  TrendingUp, 
  Eye, 
  Heart, 
  MessageSquare, 
  Share2, 
  ArrowLeft, 
  Download, 
  Loader2,
  Calendar,
  ChevronRight,
  ArrowUpRight,
  Sparkles,
  Search,
  Filter
} from 'lucide-react';
import Link from 'next/link';
import { analyticsService } from '@/services/data/analytics-service';
import { TrendingContent } from '@/types/analytics';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { Input } from '@/components/ui/input';

/**
 * Content Trending Dashboard.
 * Monitors real-time velocity and viral momentum across the Intelligence Index.
 */
export default function ContentTrendingPage() {
  const [data, setData] = useState<TrendingContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const response = await analyticsService.getTrendingContent();
        if (response.data) setData(response.data);
      } catch (e) {
        console.error('Failed to sync trending intelligence', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredData = data.filter(item => 
    item.title.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="py-40 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <Text variant="bodySmall" className="animate-pulse font-bold tracking-widest uppercase text-muted-foreground">
          Synchronizing Trending Matrix...
        </Text>
      </div>
    );
  }

  const formatCompact = (val: number) => 
    new Intl.NumberFormat('en-US', { notation: 'compact' }).format(val);

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full" asChild>
            <Link href="/admin/analytics"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 text-primary mb-1">
              <Flame className="h-4 w-4 fill-primary" />
              <Text variant="label" className="text-[10px] font-bold tracking-widest uppercase">Viral Intelligence</Text>
            </div>
            <Text variant="h1" className="text-3xl font-bold">Trending Content</Text>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="rounded-xl border-white/10 bg-card/30">
            <Calendar className="mr-2 h-4 w-4" /> 24h Window
          </Button>
          <Button size="sm" className="rounded-xl shadow-lg shadow-primary/20 font-bold bg-primary">
            <Download className="mr-2 h-4 w-4" /> Export Trends
          </Button>
        </div>
      </header>

      {/* Velocity Summary Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass-card border-none shadow-xl bg-primary/5">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Active Trends</CardTitle>
            <Flame className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.length} Nodes</div>
            <p className="text-[10px] text-emerald-500 font-bold mt-1 flex items-center gap-1">
              <ArrowUpRight className="h-2.5 w-2.5" /> High velocity active
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Peak Velocity</CardTitle>
            <TrendingUp className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{Math.max(...data.map(d => d.velocity))}%</div>
            <p className="text-[10px] text-muted-foreground mt-1">Growth per hour</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Trend Reach</CardTitle>
            <Eye className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCompact(data.reduce((acc, d) => acc + d.views, 0))}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Total trending views</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl bg-secondary/5">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Network Share</CardTitle>
            <Share2 className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12.4%</div>
            <p className="text-[10px] text-emerald-500 font-bold mt-1">Share-to-view ratio</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Trending Trajectory Chart */}
        <Card className="lg:col-span-8 glass-card border-none shadow-2xl">
          <CardHeader className="bg-card/30 border-b border-white/5 p-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Velocity Trajectory</CardTitle>
                <CardDescription>Visualizing view momentum for the top 5 trending nodes.</CardDescription>
              </div>
              <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary text-[10px] font-bold">LIVE SYNC</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-8 h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data[0]?.trendData}>
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
                <Line 
                  type="monotone" 
                  dataKey="views" 
                  stroke="#8272F2" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#8272F2', strokeWidth: 2, stroke: '#1C1822' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sidebar Insights */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="glass-card border-none shadow-xl bg-primary/5">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> Algorithmic Peak
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-xl bg-card border border-white/5 space-y-2">
                <Text variant="caption" className="font-bold">Hottest Taxonomy</Text>
                <div className="flex items-center justify-between">
                  <Text variant="bodySmall">Central Bank Liquidity</Text>
                  <Badge className="bg-emerald-500/10 text-emerald-500 border-none text-[9px] font-bold">STABLE</Badge>
                </div>
              </div>
              <Text variant="caption" className="text-muted-foreground leading-relaxed italic">
                "Content focusing on **yield curve dynamics** is seeing a 420% increase in social discovery from APAC nodes."
              </Text>
            </CardContent>
          </Card>

          <div className="p-6 rounded-[2rem] border border-secondary/20 bg-secondary/5 space-y-4">
            <div className="flex items-center gap-2 text-secondary font-bold text-sm">
              <TrendingUp className="h-4 w-4" /> Discovery Hub
            </div>
            <Text variant="caption" className="text-muted-foreground leading-relaxed">
              Recommendation: Cross-link the top trending Economics node to the **Fixed Income Calculator** to maximize engagement depth.
            </Text>
          </div>
        </div>
      </div>

      {/* Trending Content Matrix */}
      <Card className="glass-card border-none shadow-2xl overflow-hidden">
        <CardHeader className="bg-card/30 border-b border-white/5 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl">Viral Discovery Matrix</CardTitle>
            <CardDescription>Real-time performance of trending intelligence nodes.</CardDescription>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search trending nodes..." 
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
                <TableHead className="pl-6 font-bold text-[10px] uppercase tracking-widest">Intelligence Title</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Velocity</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-right">Views</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-right">Likes</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-right">Comments</TableHead>
                <TableHead className="text-right pr-6 font-bold text-[10px] uppercase tracking-widest">Shares</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item) => (
                <TableRow key={item.id} className="group hover:bg-muted/10 transition-colors border-b border-white/5">
                  <TableCell className="py-5 pl-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold truncate max-w-xs">{item.title}</span>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[8px] font-bold uppercase py-0 px-1.5 h-4">
                          {item.category}
                        </Badge>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center">
                      <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 border-none font-mono font-bold text-xs gap-1 px-2 h-6">
                        <ArrowUpRight className="h-3 w-3" /> {item.velocity}%
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs font-bold">
                    {formatCompact(item.views)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs text-muted-foreground">
                    {formatCompact(item.likes)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs text-muted-foreground">
                    {formatCompact(item.comments)}
                  </TableCell>
                  <TableCell className="text-right pr-6 font-mono text-xs text-primary font-bold">
                    {formatCompact(item.shares)}
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
