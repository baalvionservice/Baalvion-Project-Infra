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
import { useFinance } from '@/hooks/use-finance';

const chartConfig = {
  value: {
    label: 'Net Worth',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

export default function NetWorthTrendChart() {
  const { view } = useFinance();
  const netWorthHistory = view?.netWorthHistory ?? [];
  return (
    <Card>
      <CardHeader>
        <CardTitle>Net Worth Trend</CardTitle>
        <CardDescription>
          Net worth over the last 24 months (in Millions USD)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <AreaChart
            accessibilityLayer
            data={netWorthHistory}
            margin={{ left: 12, right: 12, top: 10, }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value, index) => index % 3 === 0 ? value : ''}
            />
            <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => `$${value}M`}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" formatter={(value) => `$${value}M`} />}
            />
             <defs>
              <linearGradient id="fillNetWorth" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-value)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-value)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <Area
              dataKey="value"
              type="natural"
              fill="url(#fillNetWorth)"
              stroke="var(--color-value)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
