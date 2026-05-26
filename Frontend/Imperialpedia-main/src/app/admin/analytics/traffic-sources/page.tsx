'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Text } from '@/design-system/typography/text';
import { 
  Globe, 
  Search, 
  Share2, 
  ArrowLeft, 
  ArrowUpRight, 
  ArrowDownRight, 
  Minus,
  Loader2,
  Calendar,
  Download,
  ExternalLink,
  Target,
  Zap,
  Activity,
  Heart,
  MessageSquare
} from 'lucide-react';
import Link from 'next/link';
import { analyticsService } from '@/services/data/analytics-service';
import { TrafficSources } from '@/types/analytics';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip,
  Legend
} from 'recharts';

/**
 * Traffic Sources Breakdown Dashboard.
 * Visualizes the origin of platform discovery and top referral nodes.
 */
export default function TrafficSourcesPage() {
  const [data, setData] = useState<TrafficSources | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await analyticsService.getTrafficSources();
        if (response.data) setData(response.data);
      } catch (e) {
        console.error('Failed to sync discovery intelligence', e);
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
        <Text variant="bodySmall" className="animate-pulse font-bold tracking-widest uppercase text-muted-foreground">
          Aggregating Discovery Intelligence...
        </Text>
      </div>
    );
  }

  const COLORS = ['#8272F2', '#69B9FF', '#10b981', '#f59e0b'];

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'Up': return <ArrowUpRight className="h-3 w-3 text-emerald-500" />;
      case 'Down': return <ArrowDownRight className="h-3 w-3 text-destructive" />;
      default: return <Minus className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const getTrendBadge = (trend: string) => {
    switch (trend) {
      case 'Up': return <Badge className="bg-emerald-500/10 text-emerald-500 border-none text-[9px] font-bold">GROWING</Badge>;
      case 'Down': return <Badge variant="destructive" className="text-[9px] font-bold">DECLINING</Badge>;
      default: return <Badge variant="outline" className="text-[9px] font-bold text-muted-foreground">STABLE</Badge>;
    }
  };

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
              <Target className="h-4 w-4" />
              <Text variant="label" className="text-[10px] font-bold tracking-widest uppercase">Acquisition Intelligence</Text>
            </div>
            <Text variant="h1" className="text-3xl font-bold">Traffic Sources</Text>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="rounded-xl border-white/10 bg-card/30">
            <Calendar className="mr-2 h-4 w-4" /> 30 Day Outlook
          </Button>
          <Button size="sm" className="rounded-xl shadow-lg shadow-primary/20 font-bold bg-primary">
            <Download className="mr-2 h-4 w-4" /> Export Datasets
          </Button>
        </div>
      </header>

      {/* Aggregate Discovery Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass-card border-none shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Organic Reach</CardTitle>
            <Search className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45.2%</div>
            <div className="flex items-center text-[10px] text-emerald-500 font-bold mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" /> Dominant Discovery
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Direct Loyalty</CardTitle>
            <Zap className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24.8%</div>
            <div className="flex items-center text-[10px] text-muted-foreground font-bold mt-1">
              Recurring audience
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Social Velocity</CardTitle>
            <Share2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18.5%</div>
            <div className="flex items-center text-[10px] text-emerald-500 font-bold mt-1">
              Viral propagation active
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Referral Integrity</CardTitle>
            <ExternalLink className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">11.5%</div>
            <div className="flex items-center text-[10px] text-destructive font-bold mt-1">
              <ArrowDownRight className="h-3 w-3 mr-1" /> Declining 2.4%
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Source Distribution Visualization */}
        <Card className="lg:col-span-5 glass-card border-none shadow-2xl overflow-hidden">
          <CardHeader className="bg-card/30 border-b border-white/5 p-6">
            <CardTitle className="text-lg">Discovery Mix</CardTitle>
            <CardDescription>Platform-wide traffic distribution by channel.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 h-[400px] flex flex-col justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.sources}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={8}
                  dataKey="percent"
                  nameKey="name"
                  animationBegin={0}
                  animationDuration={1500}
                >
                  {data.sources.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(255,255,255,0.05)" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1C1822', border: '1px solid #ffffff10', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle"
                  formatter={(value) => <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Detailed Source Performance Matrix */}
        <Card className="lg:col-span-7 glass-card border-none shadow-2xl overflow-hidden">
          <CardHeader className="bg-card/30 border-b border-white/5 p-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Source Performance</CardTitle>
                <CardDescription>High-velocity referral nodes and search engines.</CardDescription>
              </div>
              <Badge variant="outline" className="border-secondary/20 bg-secondary/5 text-secondary">LIVE SYNC</Badge>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/20 hover:bg-muted/20 border-b border-white/5">
                  <TableHead className="pl-6 font-bold text-[10px] uppercase tracking-widest">Acquisition Node</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Sessions</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Conversion</TableHead>
                  <TableHead className="text-right pr-6 font-bold text-[10px] uppercase tracking-widest">Trajectory</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.topReferrers.map((ref, idx) => (
                  <TableRow key={idx} className="group hover:bg-muted/10 transition-colors border-b border-white/5">
                    <TableCell className="py-5 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-background/50 border border-white/5 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                          <Globe className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-bold">{ref.source}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-mono text-xs font-bold">
                      {ref.visits.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="bg-primary/5 text-primary border-none font-mono font-bold text-[10px]">
                        {ref.conversion}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex justify-end items-center gap-3">
                        {getTrendBadge(ref.trend)}
                        <div className="p-1.5 rounded-lg bg-background/50 border border-white/5">
                          {getTrendIcon(ref.trend)}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* Strategic Insight Footer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-card bg-primary/5 border-primary/20 p-6 flex flex-col gap-4">
          <div className="p-3 rounded-2xl bg-primary/10 w-fit text-primary">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <Text variant="bodySmall" weight="bold">Organic Authority</Text>
            <Text variant="caption" className="text-muted-foreground mt-1 leading-relaxed">
              Google discovery remains the primary driver. Current focus: **Expert Citations** to improve E-E-A-T signals for programmatic research nodes.
            </Text>
          </div>
        </Card>
        
        <Card className="glass-card border-secondary/20 p-6 flex flex-col gap-4">
          <div className="p-3 rounded-2xl bg-secondary/10 w-fit text-secondary">
            <Share2 className="h-6 w-6" />
          </div>
          <div>
            <Text variant="bodySmall" weight="bold">Social Conversion</Text>
            <Text variant="caption" className="text-muted-foreground mt-1 leading-relaxed">
              Twitter (X) referrals achieved a **6.8% conversion rate**, the highest in Module 11 history. Recommend prioritizing 'Visual Intelligence' assets for social nodes.
            </Text>
          </div>
        </Card>

        <Card className="glass-card border-emerald-500/20 p-6 flex flex-col gap-4">
          <div className="p-3 rounded-2xl bg-emerald-500/10 w-fit text-emerald-500">
            <Target className="h-6 w-6" />
          </div>
          <div>
            <Text variant="bodySmall" weight="bold">Referral Scaling</Text>
            <Text variant="caption" className="text-muted-foreground mt-1 leading-relaxed">
              Identifying declining referral integrity from Bing nodes. Initiating backlink re-validation cycle for high-impact glossary definitions.
            </Text>
          </div>
        </Card>
      </div>
    </div>
  );
}