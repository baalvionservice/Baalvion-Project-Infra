'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface NavData {
  date: string;
  nav: number;
}

export default function NavChart({ data }: { data: NavData[] }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">NAV Growth History</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Initializing chart...</div>
        </CardContent>
      </Card>
    );
  }

  const chartDescription = `Area chart showing Net Asset Value growth from ${data[0]?.date} to ${data[data.length - 1]?.date}. The current NAV is ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(data[data.length - 1]?.nav)}.`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg" id="nav-chart-title">NAV Growth History</CardTitle>
      </CardHeader>
      <CardContent>
        <div 
          className="h-[300px] w-full" 
          role="img" 
          aria-labelledby="nav-chart-title" 
          aria-label={chartDescription}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorNav" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                fontSize={12}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                fontSize={12}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value) => `$${value / 1000000}M`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius)',
                }}
                formatter={(value: number) => [
                  new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(value),
                  'NAV',
                ]}
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
        </div>
        {/* Hidden summary for screen readers */}
        <div className="sr-only">
          <table>
            <caption>NAV Quarterly Breakdown</caption>
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">NAV Value</th>
              </tr>
            </thead>
            <tbody>
              {data.map((point) => (
                <tr key={point.date}>
                  <td>{point.date}</td>
                  <td>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(point.nav)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
