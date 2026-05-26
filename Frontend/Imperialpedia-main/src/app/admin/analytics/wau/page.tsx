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
  Target,
  BarChart3
} from 'lucide-react';
import Link from 'next/link';
import { analyticsService } from '@/services/data/analytics-service';
import { WeeklyActiveUsers } from '@/types/analytics';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

/**
 * Weekly Active Users (WAU) Analytics Dashboard.
 * Visualizes longitudinal engagement trends and platform expansion cycles.
 */
export default function WeeklyActiveUsersPage() {
  const [data, setData] = useState<WeeklyActiveUsers[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await analyticsService.getWAUData();
        if (response.data) setData(response.data);
      } catch (e) {
        console.error('Failed to sync WAU intelligence', e);
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
          Synthesizing Retention Cycles...
        </Text>
      </div>
    );
  }

  const latestWau = data[data.length - 1]?.activeUsers || 0;
  const previousWau = data[data.length - 2]?.activeUsers || 0;
  const trendPercent = ((latestWau - previousWau) / previousWau * 100).toFixed(1);
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
              <BarChart3 className="h-4 w-4" />
              <Text variant="label" className="text-[10px] font-bold tracking-widest uppercase">Retention Intelligence</Text>
            </div>
            <Text variant="h1" className="text-3xl font-bold tracking-tight">Weekly Active Users (WAU)</Text>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="rounded-xl border-white/10 bg-card/30 h-11 px-6">
            <Calendar className="mr-2 h-4 w-4" /> 90 Day Review
          </Button>
          <Button size="sm" className="rounded-xl shadow-lg shadow-primary/20 font-bold bg-primary hover:bg-primary/90 h-11 px-6">
            <Download className="mr-2 h-4 w-4" /> Export Longitudinal Data
          </Button>
        </div>
      </header>

      {/* Aggregate Retention Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass-card border-none shadow-xl group hover:border-primary/20 transition-all">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Current Weekly Active</CardTitle>
            <Users className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latestWau.toLocaleString()}</div>
            <div className={`flex items-center text-[10px] font-bold mt-1 ${isUp ? 'text-emerald-500' : 'text-destructive'}`}>
              {isUp ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
              {Math.abs(parseFloat(trendPercent))}% vs previous week
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl group hover:border-secondary/20 transition-all">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Avg. 30-Day Growth</CardTitle>
            <TrendingUp className="h-4 w-4 text-secondary group-hover:scale-110 transition-transform" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+12.4%</div>
            <div className="flex items-center text-[10px] text-emerald-500 font-bold mt-1">
              <Zap className="h-3 w-3 mr-1" /> Scaling consistent
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Network Stickiness</CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">64.2%</div>
            <p className="text-[10px] text-muted-foreground mt-1">WAU / MAU performance</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Churn Resistance</CardTitle>
            <Activity className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">92.1%</div>
            <p className="text-[10px] text-emerald-500 font-bold mt-1">High retention integrity</p>
          </CardContent>
        </Card>
      </div>

      {/* Main WAU Momentum Visualization */}
      <Card className="glass-card border-none shadow-2xl overflow-hidden">
        <CardHeader className="bg-card/30 border-b border-white/5 p-8 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl">Retention Trajectory</CardTitle>
            <CardDescription>Visualizing Weekly Active User (WAU) momentum across the expert network.</CardDescription>
          </div>
          <Badge variant="outline" className="border-secondary/20 bg-secondary/5 text-secondary text-[10px] font-bold">LATEST CYCLES</Badge>
        </CardHeader>
        <CardContent className="p-8 h-[450px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
              <XAxis 
                dataKey="week" 
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
                tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1C1822', border: '1px solid #ffffff10', borderRadius: '12px' }}
                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
              />
              <Bar 
                dataKey="activeUsers" 
                radius={[6, 6, 0, 0]}
                barSize={60}
                name="Weekly Active Users"
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={index === data.length - 1 ? '#8272F2' : '#69B9FF'} 
                    fillOpacity={0.8}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Strategic Insight Footer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="glass-card bg-secondary/5 border-secondary/20 p-8 flex flex-col gap-4">
          <div className="p-4 rounded-[2rem] bg-secondary/10 w-fit text-secondary">
            <Target className="h-8 w-8" />
          </div>
          <div>
            <Text variant="h3" className="mb-2">Network Expansion Analysis</Text>
            <Text variant="bodySmall" className="text-muted-foreground leading-relaxed">
              We identified a **22% lift in WAU** following the implementation of the Expert Leaderboards. Users who interact with the leaderboard show 3.5x higher weekly return velocity.
            </Text>
          </div>
        </Card>
        
        <Card className="glass-card border-primary/20 p-8 flex flex-col gap-4">
          <div className="p-4 rounded-[2rem] bg-primary/10 w-fit text-primary">
            <Zap className="h-8 w-8" />
          </div>
          <div>
            <Text variant="h3" className="mb-2">Strategic Retention</Text>
            <Text variant="bodySmall" className="text-muted-foreground leading-relaxed">
              The 'Creator Dashboard' remains the primary driver for WAU consistency. 85% of verified experts engage with the platform at least 3 times per week to monitor intelligence reach.
            </Text>
          </div>
        </Card>
      </div>
    </div>
  );
}
