"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
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
  type ChartConfig,
} from "@/components/ui/chart";

import { useGlobalFinancials } from "@/hooks/use-global-financials";

const chartConfig = {
  revenue: {
    label: "Revenue (USD M)",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export default function RevenueByBusinessChart() {
  const { businesses, fxRates } = useGlobalFinancials();
  const chartData = businesses.map((biz, i) => ({
    business: biz.name.split(" ").map((w) => w[0]).join(""),
    revenue: Math.round(biz.currentMetrics.revenue / (fxRates[biz.currency] || 1) / 1000000),
    fill: `hsl(var(--chart-${(i % 5) + 1}))`,
  }));
  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue by Business</CardTitle>
        <CardDescription>In millions USD</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="business"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${value}M`}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dashed" />}
            />
            <Bar dataKey="revenue" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
