'use client';

import { Pie, PieChart, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';

const chartConfig = {
  revenue: {
    label: 'Revenue',
  },
  online: {
    label: 'Online',
    color: 'hsl(var(--chart-1))',
  },
  offline: {
    label: 'Offline',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig;

interface OnlineVsOfflinePieChartProps {
    onlineRevenue: number;
    offlineRevenue: number;
}

export default function OnlineVsOfflinePieChart({ onlineRevenue, offlineRevenue }: OnlineVsOfflinePieChartProps) {
  const chartData = [
    { channel: 'online', revenue: onlineRevenue, fill: 'var(--color-online)' },
    { channel: 'offline', revenue: offlineRevenue, fill: 'var(--color-offline)' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Online vs Offline Revenue</CardTitle>
        <CardDescription>Today's revenue breakdown</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[250px]">
          <PieChart>
            <ChartTooltip 
                formatter={(value) => `$${(value as number).toLocaleString()}`}
                content={<ChartTooltipContent nameKey="channel" />} 
            />
            <Pie data={chartData} dataKey="revenue" nameKey="channel" innerRadius={50} strokeWidth={5}>
                 {chartData.map((entry) => (
                    <Cell key={`cell-${entry.channel}`} fill={entry.fill} />
                ))}
            </Pie>
            <ChartLegend content={<ChartLegendContent nameKey="channel" />} />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
