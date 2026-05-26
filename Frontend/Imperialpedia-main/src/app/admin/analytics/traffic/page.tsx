'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Text } from '@/design-system/typography/text';
import { 
  Globe, 
  Monitor, 
  Smartphone, 
  Tablet, 
  Users, 
  Eye, 
  Clock, 
  Activity, 
  ArrowLeft,
  Download,
  Loader2,
  TrendingUp,
  MapPin,
  ChevronRight,
  MousePointer2,
  Share2
} from 'lucide-react';
import Link from 'next/link';
import { analyticsService } from '@/services/data/analytics-service';
import { TrafficAnalyticsReport } from '@/types/analytics';
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
  Cell,
  PieChart,
  Pie,
  LineChart,
  Line
} from 'recharts';

/**
 * Traffic Monitoring Dashboard.
 * Visualizes visitor trajectory, acquisition channels, and high-velocity entry points.
 */
export default function TrafficMonitoringPage() {
  const [data, setData] = useState<TrafficAnalyticsReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await analyticsService.getTrafficAnalyticsReport();
        if (response.data) setData(response.data);
      } catch (e) {
        console.error('Traffic intelligence sync failure', e);
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
        <Text variant="bodySmall" className="text-muted-foreground animate-pulse font-bold uppercase tracking-widest">
          Synchronizing Global Traffic Nodes...
        </Text>
      </div>
    );
  }

  const formatCompact = (val: number) => 
    new Intl.NumberFormat('en-US', { notation: 'compact' }).format(val);

  const COLORS = ['#8272F2', '#69B9FF', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full" asChild>
            <Link href="/admin/analytics"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 text-secondary mb-1">
              <Activity className="h-4 w-4" />
              <Text variant="label" className="text-[10px] font-bold tracking-widest uppercase">Network Velocity</Text>
            </div>
            <Text variant="h1" className="text-3xl font-bold">Traffic Monitoring</Text>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="rounded-xl border-white/10 bg-card/30">
            <Download className="mr-2 h-4 w-4" /> Export Logs
          </Button>
        </div>
      </header>

      {/* Real-time Pulse Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass-card border-none shadow-xl bg-primary/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Monthly Sessions</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCompact(125400)}</div>
            <div className="flex items-center text-[10px] text-emerald-500 font-bold mt-1">
              <TrendingUp className="h-3 w-3 mr-1" /> +12.4% velocity
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Session Depth</CardTitle>
            <Clock className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">6m 42s</div>
            <div className="flex items-center text-[10px] text-muted-foreground font-bold mt-1">
              Stable vs baseline
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Intelligence Reach</CardTitle>
            <Eye className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCompact(425000)}</div>
            <div className="flex items-center text-[10px] text-emerald-500 font-bold mt-1">
              <TrendingUp className="h-3 w-3 mr-1" /> +18.2% conversion
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl bg-secondary/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Bounce Resistance</CardTitle>
            <Share2 className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">67.6%</div>
            <div className="flex items-center text-[10px] text-emerald-500 font-bold mt-1">
              High retention efficiency
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Daily Visits Chart */}
        <Card className="lg:col-span-8 glass-card border-none shadow-2xl">
          <CardHeader className="bg-card/30 border-b border-white/5 p-6">
            <div>
              <CardTitle className="text-lg">Visitor Momentum</CardTitle>
              <CardDescription>Daily visit volume across the last 7 cycles.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-8 h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.dailyVisits}>
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
                  dataKey="visits" 
                  stroke="#8272F2" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#8272F2', strokeWidth: 2, stroke: '#1C1822' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Traffic Sources Pie */}
        <Card className="lg:col-span-4 glass-card border-none shadow-2xl">
          <CardHeader className="bg-card/30 border-b border-white/5 p-6">
            <CardTitle className="text-lg">Discovery Channels</CardTitle>
            <CardDescription>Breakdown by acquisition source.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.trafficSources}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="percent"
                  nameKey="source"
                >
                  {data.trafficSources.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1C1822', border: '1px solid #ffffff10', borderRadius: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Pages Performance Matrix */}
      <Card className="glass-card border-none shadow-2xl overflow-hidden">
        <CardHeader className="bg-card/30 border-b border-white/5 p-6 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl">Entry Point Integrity</CardTitle>
            <CardDescription>Top intelligence nodes by traffic volume and retention.</CardDescription>
          </div>
          <Badge variant="outline" className="border-secondary/20 bg-secondary/5 text-secondary">LIVE SYNC</Badge>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20 hover:bg-muted/20 border-b border-white/5">
                <TableHead className="pl-6 font-bold text-[10px] uppercase tracking-widest">Intelligence Node (URL)</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Total Visits</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Bounce Rate</TableHead>
                <TableHead className="text-right pr-6 font-bold text-[10px] uppercase tracking-widest">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.topPages.map((item, idx) => (
                <TableRow key={idx} className="group hover:bg-muted/10 transition-colors border-b border-white/5">
                  <TableCell className="py-5 pl-6">
                    <span className="text-xs font-mono font-medium text-primary hover:underline cursor-pointer">
                      {item.page}
                    </span>
                  </TableCell>
                  <TableCell className="text-center font-mono text-xs font-bold">
                    {item.visits.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-center font-mono text-xs text-muted-foreground">
                    {item.bounceRate}%
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-none text-[9px] font-bold uppercase h-5">
                      Healthy
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
