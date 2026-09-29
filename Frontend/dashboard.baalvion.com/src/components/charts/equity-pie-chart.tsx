'use client';

import { Pie, PieChart, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';

const chartData = [
  { business: 'TechCorp India', equity: 20, fill: 'var(--color-techcorp)' },
  { business: 'RetailChain UAE', equity: 15, fill: 'var(--color-retailchain)' },
  { business: 'DigitalAgency SG', equity: 30, fill: 'var(--color-digitalagency)' },
];

const chartConfig = {
  equity: {
    label: 'Equity',
  },
  techcorp: {
    label: 'TechCorp India',
    color: 'hsl(var(--chart-1))',
  },
  retailchain: {
    label: 'RetailChain UAE',
    color: 'hsl(var(--chart-2))',
  },
  digitalagency: {
    label: 'DigitalAgency SG',
    color: 'hsl(var(--chart-3))',
  }
} satisfies ChartConfig;

export default function EquityPieChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Equity Distribution</CardTitle>
        <CardDescription>Your equity percentage by business.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer config={chartConfig} className="mx-auto aspect-square h-[250px]">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent nameKey="business" />} />
            <Pie data={chartData} dataKey="equity" nameKey="business" innerRadius={60} strokeWidth={5}>
                 {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
            </Pie>
            <ChartLegend content={<ChartLegendContent nameKey="business" />} />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
