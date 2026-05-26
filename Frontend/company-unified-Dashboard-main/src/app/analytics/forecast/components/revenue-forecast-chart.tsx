"use client";

import {
  Area,
  Line,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import forecastData from "@/lib/data/forecast.json";
import businesses from "@/lib/data/businesses";

const chartData = [
  ...forecastData.revenueForecast.historical,
  ...forecastData.revenueForecast.forecast.slice(1),
].map((d) => ({
  ...d,
  forecast: "low" in d && "high" in d ? [d.low, d.high] : undefined,
}));

const chartConfig = {
  revenue: {
    label: "Historical Revenue",
    color: "hsl(var(--chart-1))",
  },
  base: {
    label: "Forecast",
    color: "hsl(var(--chart-1))",
  },
  forecast: {
    label: "Confidence Interval",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export default function RevenueForecastChart() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Revenue Forecast</CardTitle>
          <CardDescription>Next 6 months projection (USD M)</CardDescription>
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Select business" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Businesses</SelectItem>
            {businesses.map((biz) => (
              <SelectItem key={biz.id} value={biz.id}>
                {biz.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ComposedChart data={chartData} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              tickFormatter={(value) => `$${value}M`}
              tickLine={false}
              axisLine={false}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />

            <Area
              dataKey="forecast"
              type="monotone"
              fill="var(--color-forecast)"
              fillOpacity={0.2}
              stroke="none"
              activeDot={false}
            />
            <Line
              dataKey="revenue"
              type="monotone"
              stroke="var(--color-revenue)"
              strokeWidth={2}
              dot={true}
            />
            <Line
              dataKey="base"
              type="monotone"
              stroke="var(--color-base)"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={true}
            />
          </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
