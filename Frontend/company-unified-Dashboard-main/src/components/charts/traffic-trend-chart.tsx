
'use client';

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

interface TrafficTrendChartProps {
  data: { date: string; visitors: number }[];
}

const chartConfig = {
  visitors: {
    label: 'Visitors',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

export default function TrafficTrendChart({ data }: TrafficTrendChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Traffic Trend</CardTitle>
        <CardDescription>
          Daily visitors over the last 30 days.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <AreaChart
            accessibilityLayer
            data={data}
            margin={{ left: 12, right: 12, top: 10, }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => value.toLocaleString()}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
             <defs>
              <linearGradient id="fillVisitors" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-visitors)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-visitors)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <Area
              dataKey="visitors"
              type="natural"
              fill="url(#fillVisitors)"
              stroke="var(--color-visitors)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
