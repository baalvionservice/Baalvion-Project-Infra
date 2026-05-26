'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Text } from '@/design-system/typography/text';
import { 
  Users, 
  TrendingUp, 
  ArrowLeft, 
  ArrowUpRight, 
  ArrowDownRight, 
  Loader2, 
  Calendar,
  Download,
  Activity,
  Zap,
  Target
} from 'lucide-react';
import Link from 'next/link';
import { analyticsService } from '@/services/data/analytics-service';
import { DailyActiveUsers } from '@/types/analytics';
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
 * Daily Active Users (DAU) Analytics Dashboard.
 * Visualizes chronological engagement trends and platform retention velocity.
 */
export default function DailyActiveUsersPage() {
  const [data, setData] = useState<DailyActiveUsers[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await analyticsService.getDAUData();
        if (response.data) setData(response.data);
      } catch (e) {
        console.error('Failed to sync DAU intelligence', e);
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
        <Text variant="bodySmall" className="animate-pulse font-bold uppercase tracking-widest text-muted-foreground">
          Synthesizing Engagement Velocity...
        </Text>
      </div>
    );
  }

  const latestDau = data[data.length - 1]?.activeUsers || 0;
  const previousDau = data[data.length - 2]?.activeUsers || 0;
  const trendPercent = ((latestDau - previousDau) / previousDau * 100).toFixed(1);
  const isUp = parseFloat(trendPercent) >= 0;

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full h-12 w-12" asChild>
            <Link href="/admin/analytics"><ArrowLeft className="h-6 w-6" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 text-primary mb-1">
              <Activity className="h-4 w-4" />
              <Text variant="label" className="text-[10px] font-bold tracking-widest uppercase">Behavioral Telemetry</Text>
            </div>
            <Text variant="h1" className="text-3xl font-bold tracking-tight">Daily Active Users (DAU)</Text>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="rounded-xl border-white/10 bg-card/30 h-11 px-6">
            <Calendar className="mr-2 h-4 w-4" /> 30 Day Outlook
          </Button>
          <Button size="sm" className="rounded-xl shadow-lg shadow-primary/20 font-bold bg-primary hover:bg-primary/90 h-11 px-6">
            <Download className="mr-2 h-4 w-4" /> Export Datasets
          </Button>
        </div>
      </header>

      {/* Aggregate Engagement Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass-card border-none shadow-xl group hover:border-primary/20 transition-all">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Current Active</CardTitle>
            <Users className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latestDau.toLocaleString()}</div>
            <div className={`flex items-center text-[10px] font-bold mt-1 ${isUp ? 'text-emerald-500' : 'text-destructive'}`}>
              {isUp ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
              {Math.abs(parseFloat(trendPercent))}% from yesterday
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl group hover:border-secondary/20 transition-all">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Avg. Weekly Retention</CardTitle>
            <Target className="h-4 w-4 text-secondary group-hover:scale-110 transition-transform" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">68.4%</div>
            <div className="flex items-center text-[10px] text-emerald-500 font-bold mt-1">
              <TrendingUp className="h-3 w-3 mr-1" /> High stability
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Stickiness Ratio</CardTitle>
            <Zap className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42.1%</div>
            <p className="text-[10px] text-muted-foreground mt-1">DAU / MAU performance</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Network Concurrency</CardTitle>
            <Activity className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,240</div>
            <p className="text-[10px] text-muted-foreground mt-1">Peak concurrent nodes</p>
          </CardContent>
        </Card>
      </div>

      {/* Main DAU Momentum Visualization */}
      <Card className="glass-card border-none shadow-2xl overflow-hidden">
        <CardHeader className="bg-card/30 border-b border-white/5 p-8 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl">Engagement Momentum</CardTitle>
            <CardDescription>Visualizing Daily Active User (DAU) trajectory across the Imperialpedia Index.</CardDescription>
          </div>
          <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary text-[10px] font-bold">LIVE SYNC</Badge>
        </CardHeader>
        <CardContent className="p-8 h-[450px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
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
                tickFormatter={(val) => val.split('-').slice(1).join('/')}
              />
              <YAxis 
                stroke="#888888" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={(val) => `${(val / 1000).toFixed(1)}k`}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1C1822', border: '1px solid #ffffff10', borderRadius: '12px' }}
                itemStyle={{ color: '#8272F2' }}
              />
              <Area 
                type="monotone" 
                dataKey="activeUsers" 
                stroke="#8272F2" 
                fillOpacity={1} 
                fill="url(#colorDau)" 
                strokeWidth={3}
                name="Active Users"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Strategic Insight Footer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="glass-card bg-primary/5 border-primary/20 p-8 flex flex-col gap-4">
          <div className="p-4 rounded-[2rem] bg-primary/10 w-fit text-primary">
            <Zap className="h-8 w-8" />
          </div>
          <div>
            <Text variant="h3" className="mb-2">Engagement Spike Analysis</Text>
            <Text variant="bodySmall" className="text-muted-foreground leading-relaxed">
              We identified a **15% lift in DAU** correlated with the release of the 'Yield Curve Inversion' deep-dive. Users entering through expert research show 2.4x higher session stickiness.
            </Text>
          </div>
        </Card>
        
        <Card className="glass-card border-secondary/20 p-8 flex flex-col gap-4">
          <div className="p-4 rounded-[2rem] bg-secondary/10 w-fit text-secondary">
            <Target className="h-8 w-8" />
          </div>
          <div>
            <Text variant="h3" className="mb-2">Retention Strategy</Text>
            <Text variant="bodySmall" className="text-muted-foreground leading-relaxed">
              Current cohort retention remains stable at 68%. The automated 'Activity Feed' notifications for expert followers are driving 45% of recurring daily sessions.
            </Text>
          </div>
        </Card>
      </div>
    </div>
  );
}
