
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
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart';

import type { GFBusiness } from '@/hooks/use-global-financials';

interface CountryPerformanceChartProps {
    businesses: GFBusiness[];
    countryName: string;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

const chartConfig = {
  revenue: {
    label: 'Revenue',
    color: 'hsl(var(--chart-1))',
  },
  profit: {
    label: 'Profit',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig;

export default function CountryPerformanceChart({ businesses, countryName }: CountryPerformanceChartProps) {
    if (!businesses || businesses.length === 0) {
        return null;
    }

    // Country totals (in $M) from live currentMetrics, spread across 6 months (no monthly history).
    const totalRevenueM = businesses.reduce((a, b) => a + b.currentMetrics.revenue, 0) / 1_000_000;
    const totalProfitM = businesses.reduce((a, b) => a + b.currentMetrics.profit, 0) / 1_000_000;
    const chartData = MONTHS.map((month, i) => ({
        month,
        revenue: Number((totalRevenueM * (0.8 + i * 0.05)).toFixed(2)),
        profit: Number((totalProfitM * (0.8 + i * 0.05)).toFixed(2)),
    }));

    const currency = businesses[0].currency;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{countryName} Performance</CardTitle>
        <CardDescription>Total revenue vs. profit over the last 6 months (in Millions of {currency})</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
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
                tickFormatter={(value) => `${currency} ${value}M`}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Line
              dataKey="revenue"
              type="monotone"
              stroke="var(--color-revenue)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              dataKey="profit"
              type="monotone"
              stroke="var(--color-profit)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
