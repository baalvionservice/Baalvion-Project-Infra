'use client';

import { Area, AreaChart } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

interface HeadcountSparklineProps {
  data: number[];
}

const chartConfig = {
  count: {
    label: 'Headcount',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

export default function HeadcountSparkline({ data }: HeadcountSparklineProps) {
  const chartData = data.map((value, index) => ({ month: index, count: value }));

  return (
    <ChartContainer config={chartConfig} className="h-[100px] w-full">
      <AreaChart
        accessibilityLayer
        data={chartData}
        margin={{
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="dot" labelFormatter={() => 'Headcount'} />}
        />
        <defs>
          <linearGradient id="fillHeadcount" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-count)" stopOpacity={0.8} />
            <stop offset="95%" stopColor="var(--color-count)" stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <Area
          dataKey="count"
          type="natural"
          fill="url(#fillHeadcount)"
          stroke="var(--color-count)"
          stackId="a"
        />
      </AreaChart>
    </ChartContainer>
  );
}