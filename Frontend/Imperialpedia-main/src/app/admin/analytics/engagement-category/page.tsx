'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Text } from '@/design-system/typography/text';
import { 
  Layers, 
  TrendingUp, 
  ArrowLeft, 
  ArrowUpRight, 
  Loader2, 
  Download, 
  Calendar,
  ChevronRight,
  Eye,
  Heart,
  MessageSquare,
  Share2,
  PieChart as PieIcon,
  BarChart3
} from 'lucide-react';
import Link from 'next/link';
import { analyticsService } from '@/services/data/analytics-service';
import { EngagementByCategory } from '@/types/analytics';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  Legend
} from 'recharts';

/**
 * Engagement by Category Analytics Dashboard.
 * Visualizes audience interaction velocity grouped by financial taxonomy hubs.
 */
export default function CategoryEngagementDashboard() {
  const [data, setData] = useState<EngagementByCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await analyticsService.getCategoryEngagement();
        if (response.data) setData(response.data);
      } catch (e) {
        console.error('Category engagement sync failure', e);
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
        <Text variant="bodySmall" className="text-muted-foreground animate-pulse font-bold tracking-widest uppercase">
          Synthesizing Taxonomy Intelligence...
        </Text>
      </div>
    );
  }

  const formatCompact = (val: number) => 
    new Intl.NumberFormat('en-US', { notation: 'compact' }).format(val);

  const totalViews = data.reduce((acc, curr) => acc + curr.views, 0);
  const avgEngagement = (data.reduce((acc, curr) => acc + curr.engagementRate, 0) / data.length).toFixed(1);

  const COLORS = ['#8272F2', '#69B9FF', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full h-12 w-12" asChild>
            <Link href="/admin/analytics"><ArrowLeft className="h-6 w-6" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 text-primary mb-1">
              <Layers className="h-4 w-4" />
              <Text variant="label" className="text-[10px] font-bold tracking-widest uppercase">Taxonomy Intelligence</Text>
            </div>
            <Text variant="h1" className="text-3xl font-bold tracking-tight">Engagement by Category</Text>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="rounded-xl border-white/10 bg-card/30 h-11 px-6">
            <Calendar className="mr-2 h-4 w-4" /> 30 Day Audit
          </Button>
          <Button size="sm" className="rounded-xl shadow-lg shadow-primary/20 font-bold bg-primary hover:bg-primary/90 h-11 px-6">
            <Download className="mr-2 h-4 w-4" /> Export Matrix
          </Button>
        </div>
      </header>

      {/* Aggregate Taxonomy Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass-card border-none shadow-xl group hover:border-primary/20 transition-all">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Taxonomy Reach</CardTitle>
            <Eye className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCompact(totalViews)}</div>
            <div className="flex items-center text-[10px] text-emerald-500 font-bold mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" /> +18.2% velocity
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl group hover:border-secondary/20 transition-all">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Avg. Engagement Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-secondary group-hover:scale-110 transition-transform" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgEngagement}%</div>
            <div className="flex items-center text-[10px] text-emerald-500 font-bold mt-1">
              <BarChart3 className="h-3 w-3 mr-1" /> Stable vs baseline
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Hottest Hub</CardTitle>
            <PieIcon className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Crypto</div>
            <p className="text-[10px] text-emerald-500 font-bold mt-1">15.2% Engagement</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Active Taxonomies</CardTitle>
            <Layers className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.length}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Indexed this cycle</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Engagement Distribution Chart */}
        <Card className="lg:col-span-8 glass-card border-none shadow-2xl overflow-hidden">
          <CardHeader className="bg-card/30 border-b border-white/5 p-8 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl">Interaction Velocity per Hub</CardTitle>
              <CardDescription>Comparative engagement depth across primary financial taxonomies.</CardDescription>
            </div>
            <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary text-[10px] font-bold">LIVE SYNC</Badge>
          </CardHeader>
          <CardContent className="p-8 h-[450px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis 
                  dataKey="category" 
                  stroke="#888888" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                />
                <YAxis 
                  stroke="#888888" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1C1822', border: '1px solid #ffffff10', borderRadius: '12px' }}
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                />
                <Legend verticalAlign="top" height={36} />
                <Bar 
                  dataKey="engagementRate" 
                  name="Engagement Rate (%)"
                  radius={[6, 6, 0, 0]}
                  barSize={60}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Action Sidebar / Hub Insights */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="glass-card border-none shadow-xl bg-primary/5">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" /> Algorithmic Peak
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-xl bg-card border border-white/5 space-y-2">
                <Text variant="caption" className="font-bold">Trending Taxonomy</Text>
                <div className="flex items-center justify-between">
                  <Text variant="bodySmall">Crypto & Web3</Text>
                  <Badge className="bg-emerald-500/10 text-emerald-500 border-none text-[9px] font-bold">VIRAL</Badge>
                </div>
              </div>
              <Text variant="caption" className="text-muted-foreground leading-relaxed italic">
                "Hubs focusing on **decentralized yield** are seeing a 45% higher comment-to-view ratio. Recommend scaling expert recruitment for this hub."
              </Text>
            </CardContent>
          </Card>

          <Card className="glass-card border-none shadow-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Strategic Priority</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: 'Economics Hub', score: 92 },
                { label: 'Investing Hub', score: 85 },
                { label: 'Markets Hub', score: 78 },
              ].map((hub) => (
                <div key={hub.label} className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                    <span className="text-muted-foreground">{hub.label}</span>
                    <span className="text-primary">{hub.score}% Health</span>
                  </div>
                  <div className="w-full h-1 bg-muted/20 rounded-full overflow-hidden">
                    <div className="bg-primary h-full transition-all duration-1000" style={{ width: `${hub.score}%` }} />
                  </div>
                </div>
              ))}
              <Button variant="ghost" size="sm" className="w-full text-primary font-bold text-[10px] mt-2 group" asChild>
                <Link href="/admin/categories">
                  Audit Taxonomy Settings <ChevronRight className="ml-1 h-3 w-3 transition-transform group-hover/link:translate-x-1" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Category Engagement Matrix */}
      <Card className="glass-card border-none shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5 bg-card/30 flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Taxonomy Engagement Matrix</CardTitle>
            <CardDescription>Aggregate interaction performance for primary knowledge hubs.</CardDescription>
          </div>
          <Badge variant="outline" className="border-white/10 bg-background/30 text-[10px] font-bold uppercase px-3">PERFORMANCE SNAPSHOT</Badge>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20 hover:bg-muted/20 border-b border-white/5">
                <TableHead className="pl-6 font-bold text-[10px] uppercase tracking-widest">Knowledge Hub (Category)</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Global Reach (Views)</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Likes</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Comments</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Shares</TableHead>
                <TableHead className="text-right pr-6 font-bold text-[10px] uppercase tracking-widest">Engagement Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item) => (
                <TableRow key={item.category} className="group hover:bg-muted/10 transition-colors border-b border-white/5">
                  <TableCell className="py-5 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <Layers className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-bold">{item.category}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-mono text-xs font-bold text-foreground">
                    {item.views.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1.5 text-muted-foreground text-xs">
                      <Heart className="h-3 w-3 text-destructive/60" />
                      {formatCompact(item.likes)}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1.5 text-muted-foreground text-xs">
                      <MessageSquare className="h-3 w-3 text-secondary/60" />
                      {formatCompact(item.comments)}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1.5 text-muted-foreground text-xs">
                      <Share2 className="h-3 w-3 text-primary/60" />
                      {formatCompact(item.shares)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 border-none font-mono font-bold text-xs px-3 h-7">
                      {item.engagementRate}%
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