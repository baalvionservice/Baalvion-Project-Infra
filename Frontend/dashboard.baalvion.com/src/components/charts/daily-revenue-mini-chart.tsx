'use client';

import { Bar, BarChart, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

interface DailyRevenueMiniChartProps {
    data: { day: string; revenue: number }[];
    chartColor: string;
}

const chartConfig = {
  revenue: {
    label: 'Revenue',
  },
} satisfies ChartConfig;

export default function DailyRevenueMiniChart({ data, chartColor }: DailyRevenueMiniChartProps) {
  return (
    <ChartContainer config={chartConfig} className="h-[100px] w-full">
      <BarChart accessibilityLayer data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
        <XAxis
          dataKey="day"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tick={{ fontSize: 12 }}
        />
        <YAxis hide={true} domain={['dataMin - 1000', 'dataMax + 1000']} />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="dot" formatter={(value) => `$${Number(value).toLocaleString()}`} />}
        />
        <Bar 
            dataKey="revenue" 
            radius={2} 
            style={{ fill: chartColor } as React.CSSProperties}
        />
      </BarChart>
    </ChartContainer>
  );
}
