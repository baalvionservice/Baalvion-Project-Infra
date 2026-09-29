'use client';

import { Line, LineChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';

const chartData = [
  { month: 'Jan', roi: 4.5 },
  { month: 'Feb', roi: 5.2 },
  { month: 'Mar', roi: 7.1 },
  { month: 'Apr', roi: 8.3 },
  { month: 'May', roi: 9.0 },
  { month: 'Jun', roi: 11.2 },
];

const chartConfig = {
  roi: {
    label: 'ROI',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

export default function RoiChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio ROI Trend</CardTitle>
        <CardDescription>Return on investment over the last 6 months</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <LineChart data={chartData} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => `${value}%`} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent formatter={(value) => `${value}%`} />} />
            <Line dataKey="roi" type="monotone" stroke="var(--color-roi)" strokeWidth={2} dot={false} />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
