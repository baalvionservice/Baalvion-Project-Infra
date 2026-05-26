'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Text } from '@/design-system/typography/text';
import { 
  TrendingUp, 
  ArrowLeft, 
  ArrowUpRight, 
  Loader2, 
  Calendar,
  Download,
  Heart,
  MessageSquare,
  Share2,
  Zap,
  Activity,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { analyticsService } from '@/services/data/analytics-service';
import { EngagementTrends } from '@/types/analytics';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';

/**
 * Engagement Trends Over Time Dashboard.
 * Visualizes interaction velocity (likes, comments, shares) across platform nodes.
 */
export default function EngagementTrendsPage() {
  const [data, setData] = useState<EngagementTrends | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await analyticsService.getEngagementTrends();
        if (response.data) setData(response.data);
      } catch (e) {
        console.error('Failed to sync engagement velocity', e);
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
          Synthesizing Interaction Velocity...
        </Text>
      </div>
    );
  }

  const formatCompact = (val: number) => 
    new Intl.NumberFormat('en-US', { notation: 'compact' }).format(val);

  const totalLikes = data.likes.reduce((acc, curr) => acc + curr.count, 0);
  const totalComments = data.comments.reduce((acc, curr) => acc + curr.count, 0);
  const totalShares = data.shares.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full h-12 w-12" asChild>
            <Link href="/admin/analytics"><ArrowLeft className="h-6 w-6" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 text-primary mb-1">
              <Sparkles className="h-4 w-4" />
              <Text variant="label" className="text-[10px] font-bold tracking-widest uppercase">Sentiment Telemetry</Text>
            </div>
            <Text variant="h1" className="text-3xl font-bold tracking-tight">Engagement Trends</Text>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="rounded-xl border-white/10 bg-card/30 h-11 px-6">
            <Calendar className="mr-2 h-4 w-4" /> 30 Day Window
          </Button>
          <Button size="sm" className="rounded-xl shadow-lg shadow-primary/20 font-bold bg-primary hover:bg-primary/90 h-11 px-6">
            <Download className="mr-2 h-4 w-4" /> Export Matrix
          </Button>
        </div>
      </header>

      {/* Aggregate Interaction Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="glass-card border-none shadow-xl group hover:border-primary/20 transition-all">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Network Likes</CardTitle>
            <Heart className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCompact(totalLikes)}</div>
            <div className="flex items-center text-[10px] text-emerald-500 font-bold mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" /> +12.4% velocity
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl group hover:border-secondary/20 transition-all">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Expert Comments</CardTitle>
            <MessageSquare className="h-4 w-4 text-secondary group-hover:scale-110 transition-transform" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCompact(totalComments)}</div>
            <div className="flex items-center text-[10px] text-emerald-500 font-bold mt-1">
              <TrendingUp className="h-3 w-3 mr-1" /> +8.2% session depth
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl group hover:border-primary/20 transition-all">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Viral Shares</CardTitle>
            <Share2 className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCompact(totalShares)}</div>
            <div className="flex items-center text-[10px] text-emerald-500 font-bold mt-1">
              <Activity className="h-3 w-3 mr-1" /> High propagation
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Longitudinal Engagement Visualization */}
      <Card className="glass-card border-none shadow-2xl overflow-hidden">
        <CardHeader className="bg-card/30 border-b border-white/5 p-8 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl">Interaction Momentum</CardTitle>
            <CardDescription>Correlation of likes, comments, and shares across the 30-day index.</CardDescription>
          </div>
          <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary text-[10px] font-bold uppercase tracking-widest px-3">LIVE SYNC</Badge>
        </CardHeader>
        <CardContent className="p-8 h-[450px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.combined}>
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
              <Legend verticalAlign="top" height={36} />
              <Line 
                type="monotone" 
                dataKey="likes" 
                stroke="#8272F2" 
                strokeWidth={3}
                dot={{ r: 4, fill: '#8272F2', strokeWidth: 2, stroke: '#1C1822' }}
                activeDot={{ r: 6, strokeWidth: 0 }}
                name="Likes"
              />
              <Line 
                type="monotone" 
                dataKey="comments" 
                stroke="#69B9FF" 
                strokeWidth={2}
                dot={{ r: 3, fill: '#69B9FF', strokeWidth: 2, stroke: '#1C1822' }}
                name="Comments"
              />
              <Line 
                type="monotone" 
                dataKey="shares" 
                stroke="#10b981" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="Shares"
              />
            </LineChart>
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
            <Text variant="h3" className="mb-2 text-xl font-bold">Sentiment Spikes</Text>
            <Text variant="bodySmall" className="text-muted-foreground leading-relaxed">
              We identified a **24% lift in comment volume** correlated with the release of the 'CBDC Digital Dollar' research. Users participating in these threads show 3.5x higher return velocity.
            </Text>
          </div>
        </Card>
        
        <Card className="glass-card border-secondary/20 p-8 flex flex-col gap-4">
          <div className="p-4 rounded-[2rem] bg-secondary/10 w-fit text-secondary">
            <Activity className="h-8 w-8" />
          </div>
          <div>
            <Text variant="h3" className="mb-2 text-xl font-bold">Social Propagation</Text>
            <Text variant="bodySmall" className="text-muted-foreground leading-relaxed">
              Viral share velocity remains dominant in the **Fixed Income** taxonomy. Recommend cross-linking high-share research nodes to interactive calculators to maximize session depth.
            </Text>
          </div>
        </Card>
      </div>
    </div>
  );
}
