"use client";

import { LightLineChart } from "@/components/charts/LightLineChart";
import type { QuoteChartPoint } from "@/lib/data/marketsLoader";

export function ArticleInlineChartClient({ data }: { data: QuoteChartPoint[] }) {
  return (
    <LightLineChart
      data={data}
      height={220}
      stroke="hsl(var(--primary))"
      gridStroke="hsl(var(--border))"
      axisColor="hsl(var(--muted-foreground))"
      tooltipBg="hsl(var(--background))"
      tooltipBorder="hsl(var(--border))"
      tooltipText="hsl(var(--foreground))"
    />
  );
}
