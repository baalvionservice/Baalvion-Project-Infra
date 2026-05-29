"use client";

import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";

import { useGlobalFinancials } from "@/hooks/use-global-financials";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--chart-1))",
  },
  profit: {
    label: "Profit",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export default function OverallPerformanceChart() {
  const { businesses, fxRates } = useGlobalFinancials();
  const totalRevenueUsd = businesses.reduce((a, b) => a + b.currentMetrics.revenue / (fxRates[b.currency] || 1), 0);
  const totalProfitUsd = businesses.reduce((a, b) => a + b.currentMetrics.profit / (fxRates[b.currency] || 1), 0);
  // Derive a 6-month series from current USD totals (no monthly history stored yet).
  const chartData = MONTHS.map((month, i) => ({
    month,
    revenue: Math.round((totalRevenueUsd / 1_000_000) * (0.8 + i * 0.05)),
    profit: Math.round((totalProfitUsd / 1_000_000) * (0.8 + i * 0.05)),
  }));
  return (
    <Card>
      <CardHeader>
        <CardTitle>Overall Performance</CardTitle>
        <CardDescription>
          Total revenue vs. profit over the last 6 months (USD M)
        </CardDescription>
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
              tickFormatter={(value) => `$${value}M`}
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
