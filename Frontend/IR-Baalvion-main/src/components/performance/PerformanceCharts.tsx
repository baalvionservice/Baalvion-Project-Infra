"use client";

import { useEffect, useState } from "react";
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
  Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { NavHistoryPoint, CapitalTimelinePoint } from "@/types/performance";

interface Props {
  navData: NavHistoryPoint[];
  timelineData: CapitalTimelinePoint[];
}

export function PerformanceCharts({ navData, timelineData }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-[400px]">
      <div className="bg-card animate-pulse rounded-xl border border-border/50" />
      <div className="bg-card animate-pulse rounded-xl border border-border/50" />
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* NAV Growth Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground" id="performance-nav-title">NAV Growth History</CardTitle>
          <CardDescription className="text-xs">Consolidated market value of all underlying assets.</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] w-full pt-4" role="img" aria-labelledby="performance-nav-title" aria-label="Line chart showing NAV growth over quarterly periods.">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={navData}>
              <defs>
                <linearGradient id="colorNav" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
              <XAxis 
                dataKey="date" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={(val) => `$${val / 1000000}M`}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                itemStyle={{ color: 'hsl(var(--primary))', fontWeight: 'bold' }}
                formatter={(val: number) => [`$${(val / 1000000).toFixed(1)}M`, "NAV"]}
              />
              <Area 
                type="monotone" 
                dataKey="nav" 
                stroke="hsl(var(--primary))" 
                fillOpacity={1} 
                fill="url(#colorNav)" 
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Capital In vs. Out Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground" id="performance-timeline-title">Capital Lifecycle Timeline</CardTitle>
          <CardDescription className="text-xs">Quarterly analysis of called capital vs. realized distributions.</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] w-full pt-4" role="img" aria-labelledby="performance-timeline-title" aria-label="Bar chart comparing called capital against distributions per quarter.">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
              <XAxis 
                dataKey="period" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={(val) => `$${val / 1000000}M`}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                formatter={(val: number) => `$${(val / 1000000).toFixed(1)}M`}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }} />
              <Bar name="Called Capital" dataKey="called" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar name="Distributions" dataKey="distributed" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
