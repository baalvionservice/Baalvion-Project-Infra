
'use client';

import { Pie, PieChart, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';

interface TrafficSourcesChartProps {
    data: { name: string; value: number }[];
}

const chartColors = [
    'hsl(var(--chart-1))', 
    'hsl(var(--chart-2))', 
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
];

export default function TrafficSourcesChart({ data }: TrafficSourcesChartProps) {
    const chartData = data.map((item, index) => ({
        ...item,
        fill: chartColors[index % chartColors.length]
    }));
    
    const chartConfig = data.reduce((acc, item, index) => {
        acc[item.name] = {
            label: item.name,
            color: chartColors[index % chartColors.length]
        };
        return acc;
    }, {} as ChartConfig);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Traffic Sources</CardTitle>
        <CardDescription>Breakdown of visitors by source.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[250px]">
          <PieChart>
            <ChartTooltip 
                formatter={(value) => `${value}%`}
                content={<ChartTooltipContent nameKey="name" />} 
            />
            <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={60} strokeWidth={5}>
                 {chartData.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                ))}
            </Pie>
            <ChartLegend content={<ChartLegendContent nameKey="name" />} />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
