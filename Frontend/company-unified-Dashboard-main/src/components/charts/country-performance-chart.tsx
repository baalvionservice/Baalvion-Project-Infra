
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

import type { Business } from '@/lib/types';
import fxRates from '@/lib/data/fx-rates.json';

interface CountryPerformanceChartProps {
    businesses: Business[];
    countryName: string;
}

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

    const allMonths = Array.from(
        new Set(businesses.flatMap((biz) => biz.revenueHistory.map((h) => h.month)))
    );

    const chartData = allMonths.map((month) => {
        const totals = businesses.reduce(
            (acc, biz) => {
            const historyPoint = biz.revenueHistory.find((h) => h.month === month);
            if (historyPoint) {
                // Assuming all businesses in a country use the same currency for this chart
                acc.revenue += historyPoint.revenue;
                acc.profit += historyPoint.profit;
            }
            return acc;
            },
            { revenue: 0, profit: 0 }
        );

        return {
            month,
            revenue: totals.revenue,
            profit: totals.profit,
        };
    });
    
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
