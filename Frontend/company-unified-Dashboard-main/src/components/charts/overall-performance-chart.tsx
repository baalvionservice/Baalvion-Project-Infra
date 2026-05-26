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

import businessesData from "@/lib/data/businesses";
import fxRates from "@/lib/data/fx-rates.json";

const allMonths = Array.from(
  new Set(
    businessesData.flatMap((biz) => biz.revenueHistory.map((h) => h.month))
  )
);

const chartData = allMonths.map((month) => {
  const totals = businessesData.reduce(
    (acc, biz) => {
      const historyPoint = biz.revenueHistory.find((h) => h.month === month);
      if (historyPoint) {
        const rate = fxRates[biz.currency] || 1;
        acc.revenue += (historyPoint.revenue * 1000000) / rate;
        acc.profit += (historyPoint.profit * 1000000) / rate;
      }
      return acc;
    },
    { revenue: 0, profit: 0 }
  );

  return {
    month,
    revenue: Math.round(totals.revenue / 1000000),
    profit: Math.round(totals.profit / 1000000),
  };
});

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
