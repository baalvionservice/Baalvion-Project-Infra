
'use client';

import { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import type { Assumptions, TimeHorizon } from '../page';

interface ProjectionChartProps {
  assumptions: Assumptions;
  timeHorizon: TimeHorizon;
}

const formatYAxis = (value: number) => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
    return `$${value.toLocaleString()}`;
}

export default function ProjectionChart({ assumptions, timeHorizon }: ProjectionChartProps) {
  const [isLogScale, setIsLogScale] = useState(false);

  const chartData = useMemo(() => {
    const initialRevenue = 60_000_000;
    const data = [];
    for (let year = 0; year <= timeHorizon; year++) {
      data.push({
        year,
        revenue: initialRevenue * Math.pow(1 + assumptions.revenueGrowth / 100, year),
      });
    }
    return data;
  }, [assumptions, timeHorizon]);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
            <div>
                <CardTitle>Revenue Trajectory</CardTitle>
                <CardDescription>Projected total revenue over the next {timeHorizon} years.</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
                <Switch id="log-scale" checked={isLogScale} onCheckedChange={setIsLogScale} />
                <Label htmlFor="log-scale">Logarithmic Scale</Label>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" unit="yr" />
            <YAxis 
                scale={isLogScale ? 'log' : 'linear'} 
                domain={['auto', 'auto']}
                tickFormatter={formatYAxis} 
            />
            <Tooltip formatter={(value: number) => formatYAxis(value)} />
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="url(#revenueGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
