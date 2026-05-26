'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
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
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart';

interface RevenueByCountryChartProps {
    data: {
        name: string;
        revenue: number;
        costs: number;
        profit: number;
    }[];
}

const chartConfig = {
  revenue: {
    label: 'Revenue',
    color: 'hsl(var(--chart-1))',
  },
  costs: {
    label: 'Costs',
    color: 'hsl(var(--chart-3))',
  },
   profit: {
    label: 'Profit',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig;

export default function RevenueByCountryChart({ data }: RevenueByCountryChartProps) {
  
  const chartData = data.map(item => ({
      ...item,
      revenue: item.revenue / 1000000,
      costs: item.costs / 1000000,
      profit: item.profit / 1000000,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Financials by Country</CardTitle>
        <CardDescription>
          Revenue vs Costs vs Profit for each country (in Millions USD).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
          <BarChart accessibilityLayer data={chartData} barGap={4}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="name"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <YAxis
              tickFormatter={(value) => `$${value}M`}
              tickLine={false}
              axisLine={false}
            />
            <ChartTooltip
              content={<ChartTooltipContent indicator="dot" />}
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="revenue"
              fill="var(--color-revenue)"
              radius={4}
            />
             <Bar
              dataKey="costs"
              fill="var(--color-costs)"
              radius={4}
            />
             <Bar
              dataKey="profit"
              fill="var(--color-profit)"
              radius={4}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
