'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Text } from '@/design-system/typography/text';
import { 
  TrendingUp, 
  Users, 
  FileText, 
  ArrowLeft, 
  ArrowUpRight, 
  Loader2, 
  Calendar,
  Download,
  Zap,
  UserPlus,
  BarChart3,
  Layers
} from 'lucide-react';
import Link from 'next/link';
import { analyticsService } from '@/services/data/analytics-service';
import { GrowthMetrics } from '@/types/analytics';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';

/**
 * Platform Growth Analytics Dashboard.
 * Monitors acquisition velocity for users, creators, and intelligence content.
 */
export default function PlatformGrowthPage() {
  const [data, setData] = useState<GrowthMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await analyticsService.getGrowthMetrics();
        if (response.data) setData(response.data);
      } catch (e) {
        console.error('Failed to sync growth intelligence', e);
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
          Synthesizing Growth Velocity...
        </Text>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full h-12 w-12" asChild>
            <Link href="/admin/analytics"><ArrowLeft className="h-6 w-6" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 text-primary mb-1">
              <TrendingUp className="h-4 w-4" />
              <Text variant="label" className="text-[10px] font-bold tracking-widest uppercase">Ecosystem Expansion</Text>
            </div>
            <Text variant="h1" className="text-3xl font-bold tracking-tight">Platform Growth Metrics</Text>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="rounded-xl border-white/10 bg-card/30 h-11 px-6">
            <Calendar className="mr-2 h-4 w-4" /> 7 Day Window
          </Button>
          <Button size="sm" className="rounded-xl shadow-lg shadow-primary/20 font-bold bg-primary hover:bg-primary/90 h-11 px-6">
            <Download className="mr-2 h-4 w-4" /> Export Dataset
          </Button>
        </div>
      </header>

      {/* Primary Growth Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="glass-card border-none shadow-xl group hover:border-primary/20 transition-all">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">New Registrations</CardTitle>
            <UserPlus className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.newUsers.toLocaleString()}</div>
            <div className="flex items-center text-[10px] text-emerald-500 font-bold mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" /> +12.4% vs baseline
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl group hover:border-secondary/20 transition-all">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">New Expert Onboarded</CardTitle>
            <Users className="h-4 w-4 text-secondary group-hover:scale-110 transition-transform" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.newCreators}</div>
            <div className="flex items-center text-[10px] text-emerald-500 font-bold mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" /> +3 pending vetting
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl group hover:border-primary/20 transition-all">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Intelligence Nodes Published</CardTitle>
            <FileText className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.newContent}</div>
            <div className="flex items-center text-[10px] text-muted-foreground font-bold mt-1 uppercase tracking-tighter">
              Across 5 taxonomies
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Growth Momentum Visualization */}
      <Card className="glass-card border-none shadow-2xl overflow-hidden">
        <CardHeader className="bg-card/30 border-b border-white/5 p-8 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl">Expansion Trajectory</CardTitle>
            <CardDescription>Correlating user acquisition with intelligence production velocity.</CardDescription>
          </div>
          <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary text-[10px] font-bold tracking-widest uppercase px-3">LIVE SYNC</Badge>
        </CardHeader>
        <CardContent className="p-8 h-[450px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.growthOverTime}>
              <defs>
                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8272F2" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8272F2" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorContent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#69B9FF" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#69B9FF" stopOpacity={0}/>
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
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1C1822', border: '1px solid #ffffff10', borderRadius: '12px' }}
              />
              <Legend verticalAlign="top" height={36}/>
              <Area 
                type="monotone" 
                dataKey="users" 
                stroke="#8272F2" 
                fillOpacity={1} 
                fill="url(#colorUsers)" 
                strokeWidth={3}
                name="New Users"
              />
              <Area 
                type="monotone" 
                dataKey="content" 
                stroke="#69B9FF" 
                fillOpacity={1} 
                fill="url(#colorContent)" 
                strokeWidth={2}
                name="New Insights"
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
            <Text variant="h3" className="mb-2 text-xl font-bold">Scaling Efficiency</Text>
            <Text variant="bodySmall" className="text-muted-foreground leading-relaxed">
              We identified a **15% lift in user acquisition** following the release of the 'Federal Reserve' taxonomy deep-dive. Content production velocity is maintaining a 1:12 ratio with verified expert onboarding.
            </Text>
          </div>
        </Card>
        
        <Card className="glass-card border-secondary/20 p-8 flex flex-col gap-4">
          <div className="p-4 rounded-[2rem] bg-secondary/10 w-fit text-secondary">
            <BarChart3 className="h-8 w-8" />
          </div>
          <div>
            <Text variant="h3" className="mb-2 text-xl font-bold">Expansion Strategy</Text>
            <Text variant="bodySmall" className="text-muted-foreground leading-relaxed">
              The expert candidate pipeline remains robust with 12 new verified analysts joining this cycle. Recommend opening the **'DeFi Institutional'** taxonomy to capitalize on current search trends.
            </Text>
          </div>
        </Card>
      </div>
    </div>
  );
}
