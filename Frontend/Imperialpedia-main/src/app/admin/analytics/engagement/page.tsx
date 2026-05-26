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
  Activity, 
  ArrowLeft, 
  ArrowUpRight, 
  Loader2, 
  Calendar, 
  MousePointer2, 
  Target, 
  Zap,
  Clock,
  Download,
  Filter,
  Search
} from 'lucide-react';
import Link from 'next/link';
import { analyticsService } from '@/services/data/analytics-service';
import { EngagementAnalytics } from '@/types/analytics';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';

/**
 * User Engagement Metrics Dashboard.
 * Monitors daily activity, retention velocity, and top contributor behaviors.
 */
export default function UserEngagementAnalyticsPage() {
  const [data, setData] = useState<EngagementAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const response = await analyticsService.getEngagementAnalytics();
        if (response.data) setData(response.data);
      } catch (e) {
        console.error('Engagement sync failure', e);
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
        <Text variant="bodySmall" className="text-muted-foreground animate-pulse font-bold tracking-widest uppercase">
          Synthesizing Engagement Matrix...
        </Text>
      </div>
    );
  }

  const filteredUsers = data.topUsers.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'High': return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-bold text-[10px]">HIGH</Badge>;
      case 'Medium': return <Badge variant="secondary" className="bg-primary/5 text-primary border-none font-bold text-[10px]">MEDIUM</Badge>;
      default: return <Badge variant="outline" className="text-[10px] font-bold text-muted-foreground">LOW</Badge>;
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full" asChild>
            <Link href="/admin/analytics"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 text-primary mb-1">
              <Activity className="h-4 w-4" />
              <Text variant="label" className="text-[10px] font-bold tracking-widest uppercase">Behavioral Intelligence</Text>
            </div>
            <Text variant="h1" className="text-3xl font-bold">User Engagement</Text>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="rounded-xl border-white/10 bg-card/30">
            <Calendar className="mr-2 h-4 w-4" /> 30 Day Activity
          </Button>
          <Button size="sm" className="rounded-xl shadow-lg shadow-primary/20 font-bold bg-primary">
            <Download className="mr-2 h-4 w-4" /> Export Datasets
          </Button>
        </div>
      </header>

      {/* Aggregate Behavioral Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass-card border-none shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Daily Active (DAU)</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.dau[data.dau.length - 1].users.toLocaleString()}</div>
            <div className="flex items-center text-[10px] text-emerald-500 font-bold mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" /> +12.4% session growth
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Action Velocity</CardTitle>
            <MousePointer2 className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.avgDailyActions}</div>
            <div className="flex items-center text-[10px] text-muted-foreground font-bold mt-1">
              Actions per DAU / day
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Retention Rate</CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.retentionRate}%</div>
            <div className="flex items-center text-[10px] text-emerald-500 font-bold mt-1">
              <TrendingUp className="h-3 w-3 mr-1" /> High stability
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Stickiness Ratio</CardTitle>
            <Zap className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.stickinessRatio}%</div>
            <div className="flex items-center text-[10px] text-muted-foreground font-bold mt-1">
              DAU / MAU performance
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Retention & DAU Trends */}
        <Card className="lg:col-span-8 glass-card border-none shadow-2xl">
          <CardHeader className="bg-card/30 border-b border-white/5 p-6">
            <div>
              <CardTitle className="text-lg">Retention Velocity</CardTitle>
              <CardDescription>Daily Active User (DAU) momentum over the last 7 cycles.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-8 h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.dau}>
                <defs>
                  <linearGradient id="colorDau" x1="0" y1="0" x2="0" y2="1">
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
                  dataKey="users" 
                  stroke="#8272F2" 
                  fillOpacity={1} 
                  fill="url(#colorDau)" 
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Action Sidebar / Weekly Trends */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="glass-card border-none shadow-xl bg-primary/5">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" /> Weekly Growth (WAU)
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.wau}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis dataKey="week" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} hide />
                  <Tooltip contentStyle={{ backgroundColor: '#1C1822', border: '1px solid #ffffff10', borderRadius: '12px' }} />
                  <Bar dataKey="users" fill="#69B9FF" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="p-6 rounded-[2rem] border border-secondary/20 bg-secondary/5 space-y-4">
            <div className="flex items-center gap-2 text-secondary font-bold text-sm">
              <Zap className="h-4 w-4" /> Strategy Peak
            </div>
            <Text variant="caption" className="text-muted-foreground leading-relaxed italic">
              "Platform engagement peaks during **London Open** sessions. Users participating in 'Investing' hubs show 2.4x higher session depth."
            </Text>
          </div>
        </div>
      </div>

      {/* Top Engaging Users Matrix */}
      <Card className="glass-card border-none shadow-2xl overflow-hidden">
        <CardHeader className="bg-card/30 border-b border-white/5 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl">Participant Integrity Matrix</CardTitle>
            <CardDescription>Auditing the platform's most active knowledge contributors.</CardDescription>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search participants..." 
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
                <TableHead className="pl-6 font-bold text-[10px] uppercase tracking-widest">Participant</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Engagement Level</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Action Volume</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-right">Last Session</TableHead>
                <TableHead className="text-right pr-6 font-bold text-[10px] uppercase tracking-widest">Administrative Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id} className="group hover:bg-muted/10 transition-colors border-b border-white/5">
                  <TableCell className="py-5 pl-6">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 rounded-lg border border-white/10">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-bold">{user.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center">
                      {getLevelBadge(user.level)}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-xs font-mono font-bold">{user.actions.toLocaleString()}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-[10px] text-muted-foreground flex items-center justify-end gap-1 font-mono uppercase">
                      <Clock className="h-2.5 w-2.5" /> {format(new Date(user.lastActive), 'MMM d, HH:mm')}
                    </span>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <Button variant="ghost" size="sm" className="h-8 px-3 text-[10px] font-bold uppercase tracking-wider text-primary hover:bg-primary/10">
                      Audit Profile
                    </Button>
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
