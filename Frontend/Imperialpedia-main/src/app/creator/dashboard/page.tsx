'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Text } from '@/design-system/typography/text';
import { 
  Plus, 
  FileEdit, 
  Eye, 
  Users, 
  TrendingUp, 
  Clock, 
  MessageSquare, 
  Heart,
  ChevronRight,
  Loader2,
  Settings,
  LayoutDashboard,
  DollarSign,
  BarChart3,
  ShieldCheck,
  ArrowUpRight,
  Calendar
} from 'lucide-react';
import Link from 'next/link';
import { getCreatorDashboardStats, getCreatorContent } from '@/services/mock-api/creators';
import { CreatorContentItem, CreatorDashboardStats } from '@/types';
import { format } from 'date-fns';
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
 * Enhanced Creator Dashboard Overview.
 * Displays mission-critical metrics, performance charts, and publishing pipelines.
 */
export default function CreatorDashboardPage() {
  const [stats, setStats] = useState<CreatorDashboardStats | null>(null);
  const [content, setContent] = useState<CreatorContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        // Fetch stats for lead creator
        const [statsRes, contentRes] = await Promise.all([
          getCreatorDashboardStats('u-1'),
          getCreatorContent('u-1')
        ]);
        setStats(statsRes.data as any);
        setContent(contentRes.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <Text variant="bodySmall" className="text-muted-foreground animate-pulse">Syncing expert intelligence...</Text>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published': return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-bold text-[10px] uppercase">Published</Badge>;
      case 'scheduled': return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 font-bold text-[10px] uppercase">Scheduled</Badge>;
      default: return <Badge variant="secondary" className="opacity-70 font-bold text-[10px] uppercase">Draft</Badge>;
    }
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  const summaryMetrics = [
    { title: 'Intelligence Nodes', value: stats?.performanceTrends, icon: FileEdit, color: 'text-primary', description: '+4 this month', href: '/creator/dashboard/schedule' },
    { title: 'Total Audience', value: `${((stats?.totalFollowers || 0) / 1000).toFixed(1)}k`, icon: Users, color: 'text-secondary', description: '+1.2k new experts', href: '/creator/dashboard/notifications' },
    { title: 'Global Reach', value: `${((stats?.totalViews || 0) / 1000000).toFixed(1)}M`, icon: Eye, color: 'text-primary', description: 'Trending in Economics', href: '/creator/dashboard/analytics' },
    { title: 'Total Revenue', value: formatCurrency(stats?.totalRevenue || 0), icon: DollarSign, color: 'text-secondary', description: 'Next payout: Mar 15', href: '/creator/dashboard/revenue' },
  ];

  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <LayoutDashboard className="h-4 w-4" />
            <Text variant="label" className="text-[10px] font-bold tracking-widest uppercase">Expert command center</Text>
          </div>
          <div className="flex items-center gap-3">
            <Text variant="h1" className="text-3xl font-bold">Creator Studio</Text>
            <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/20 font-bold h-6">
              <ShieldCheck className="mr-1 h-3 w-3" /> Verified Expert
            </Badge>
          </div>
          <Text variant="bodySmall" className="text-muted-foreground mt-1">
            Managing the world's most scalable financial intelligence index.
          </Text>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild className="shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 rounded-xl h-11 px-6">
            <Link href="/creator/dashboard/editor">
              <Plus className="mr-2 h-4 w-4" /> Create Insight
            </Link>
          </Button>
          <Button variant="outline" size="icon" className="rounded-xl h-11 w-11 border-white/10 bg-card/30" asChild>
            <Link href="/creator/dashboard/settings">
              <Settings className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </header>

      {/* Summary Metrics Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {summaryMetrics.map((metric, idx) => (
          <Link key={idx} href={metric.href}>
            <Card className="glass-card border-none overflow-hidden relative group cursor-pointer hover:border-primary/30 transition-all">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <metric.icon className="h-16 w-16" />
              </div>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10">
                <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{metric.title}</CardTitle>
                <metric.icon className={`h-4 w-4 ${metric.color}`} />
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-2xl font-bold tracking-tight">{metric.title}</div>
                <p className="text-[10px] text-emerald-500 font-bold mt-1 flex items-center gap-1">
                  <ArrowUpRight className="h-2.5 w-2.5" /> {metric.description}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Momentum Chart Section */}
        <Card className="lg:col-span-8 glass-card border-none">
          <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 bg-card/30">
            <div>
              <CardTitle className="text-lg">Momentum Overview</CardTitle>
              <CardDescription>Daily reach and engagement velocity.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="text-primary font-bold text-xs" asChild>
              <Link href="/creator/dashboard/analytics">Full Reports <ChevronRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-8">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.performanceTrends || []}>
                  <defs>
                    <linearGradient id="colorReach" x1="0" y1="0" x2="0" y2="1">
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
                    dataKey="reach" 
                    stroke="#8272F2" 
                    fillOpacity={1} 
                    fill="url(#colorReach)" 
                    strokeWidth={3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Audience Insights / Quick Actions */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="glass-card border-none bg-primary/5">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" /> Audience Sentiment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Organic Interaction</span>
                  <span className="font-bold">84%</span>
                </div>
                <div className="w-full bg-muted/30 h-1 rounded-full overflow-hidden">
                  <div className="bg-primary h-full w-[84%]" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Expert Citation Rate</span>
                  <span className="font-bold">12.5%</span>
                </div>
                <div className="w-full bg-muted/30 h-1 rounded-full overflow-hidden">
                  <div className="bg-secondary h-full w-[12.5%]" />
                </div>
              </div>
              <Text variant="caption" className="text-muted-foreground italic pt-2 block">
                "Your research on 'Yield Curve Dynamics' is currently in the top 5% of platform engagement."
              </Text>
            </CardContent>
          </Card>

          <Card className="glass-card border-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Studio Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="ghost" className="w-full justify-between h-9 text-xs rounded-lg hover:bg-white/5" asChild>
                <Link href="/creator/dashboard/schedule">Content Calendar <Calendar className="h-3.5 w-3.5" /></Link>
              </Button>
              <Button variant="ghost" className="w-full justify-between h-9 text-xs rounded-lg hover:bg-white/5" asChild>
                <Link href="/creator/dashboard/verification">Expert Verification <ShieldCheck className="h-3.5 w-3.5" /></Link>
              </Button>
              <Button variant="ghost" className="w-full justify-between h-9 text-xs rounded-lg hover:bg-white/5" asChild>
                <Link href="/creator/dashboard/settings">Studio Preferences <Settings className="h-3.5 w-3.5" /></Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Content Pipeline Matrix */}
      <Card className="glass-card border-none overflow-hidden">
        <Tabs defaultValue="all" className="w-full">
          <CardHeader className="border-b bg-card/30 pb-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div>
                <CardTitle className="text-xl">Intelligence Pipeline</CardTitle>
                <CardDescription>Manage your research, active drafts, and published intelligence nodes.</CardDescription>
              </div>
              <TabsList className="bg-background/50 border border-white/5 p-1 rounded-xl h-11">
                <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-primary px-6 font-bold text-xs">All Activity</TabsTrigger>
                <TabsTrigger value="published" className="rounded-lg data-[state=active]:bg-primary px-6 font-bold text-xs">Published</TabsTrigger>
                <TabsTrigger value="drafts" className="rounded-lg data-[state=active]:bg-primary px-6 font-bold text-xs">Drafts</TabsTrigger>
              </TabsList>
            </div>
          </CardHeader>
          
          <TabsContent value="all" className="mt-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-muted/20">
                  <TableHead className="font-bold text-[10px] uppercase tracking-widest pl-6">Insight Title</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-widest">Taxonomy</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-widest">Status</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-widest">Intelligence Impact</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-widest text-right pr-6">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {content.map((item) => (
                  <TableRow key={item.id} className="group hover:bg-muted/10 transition-colors">
                    <TableCell className="font-bold py-5 pl-6">
                      <div className="flex flex-col">
                        <span className="text-sm line-clamp-1">{item.title}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground font-medium">Modified {format(new Date(item.createdAt), 'MMM d, yyyy')}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[9px] font-bold uppercase tracking-tighter">
                        {item.category}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-4 text-muted-foreground">
                        <div className="flex items-center gap-1.5 group/stat">
                          <Eye className="h-3.5 w-3.5 group-hover/stat:text-primary transition-colors" />
                          <span className="text-[10px] font-mono font-bold">{(item.views / 1000).toFixed(1)}k</span>
                        </div>
                        <div className="flex items-center gap-1.5 group/stat">
                          <Heart className="h-3.5 w-3.5 group-hover/stat:text-primary transition-colors" />
                          <span className="text-[10px] font-mono font-bold">{item.likes}</span>
                        </div>
                        <div className="flex items-center gap-1.5 group/stat">
                          <MessageSquare className="h-3.5 w-3.5 group-hover/stat:text-primary transition-colors" />
                          <span className="text-[10px] font-mono font-bold">{item.comments}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-all rounded-lg" asChild>
                        <Link href={`/creator/dashboard/editor?id=${item.id}`}>
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>
          
          <TabsContent value="published" className="py-24 text-center">
            <div className="flex flex-col items-center gap-4 opacity-50">
              <BarChart3 className="h-12 w-12 text-muted-foreground" />
              <Text variant="bodySmall" className="italic">Filter logic applied. Aggregating published intelligence nodes...</Text>
            </div>
          </TabsContent>

          <TabsContent value="drafts" className="py-24 text-center">
            <div className="flex flex-col items-center gap-4 opacity-50">
              <FileEdit className="h-12 w-12 text-muted-foreground" />
              <Text variant="bodySmall" className="italic">Scanning local research drafts...</Text>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
