
'use client';

import { Pie, PieChart, Cell } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from '@/components/ui/chart';
import type { Stakeholder } from '@/lib/types';

interface EquityDistributionDonutChartProps {
  stakeholders: Stakeholder[];
}

const chartColors = [
    'hsl(var(--chart-1))', 
    'hsl(var(--chart-2))', 
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
];

export default function EquityDistributionDonutChart({ stakeholders }: EquityDistributionDonutChartProps) {
    const chartData = stakeholders.map((s, index) => ({
        name: s.name,
        value: s.equity,
        fill: chartColors[index % chartColors.length]
    }));

    const chartConfig = stakeholders.reduce((acc, s, index) => {
        acc[s.name] = {
            label: s.name,
            color: chartColors[index % chartColors.length]
        };
        return acc;
    }, {} as ChartConfig);

  return (
    <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[250px]">
      <PieChart>
        <ChartTooltip 
            formatter={(value) => `${value}%`}
            content={<ChartTooltipContent nameKey="name" />} 
        />
        <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={50} strokeWidth={5}>
             {chartData.map((entry) => (
                <Cell key={`cell-${entry.name}`} fill={entry.fill} />
            ))}
        </Pie>
        <ChartLegend content={<ChartLegendContent nameKey="name" />} />
      </PieChart>
    </ChartContainer>
  );
}
