'use client';

import { Line, LineChart, CartesianGrid, XAxis, YAxis } from 'recharts';
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
  profit: {
    label: 'Net Profit',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig;

export default function ProfitTrendChart() {
  const { view } = useFinance();
  const profitTrend = view?.profitTrend ?? [];
  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Net Profit</CardTitle>
        <CardDescription>
          Last 12 months combined net profit (in Millions USD)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <LineChart
            accessibilityLayer
            data={profitTrend}
            margin={{ left: 12, right: 12 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => `$${value}M`}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent formatter={(value) => `$${value}M`} />} />
            <Line
              dataKey="profit"
              type="monotone"
              stroke="var(--color-profit)"
              strokeWidth={2}
              dot={true}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
