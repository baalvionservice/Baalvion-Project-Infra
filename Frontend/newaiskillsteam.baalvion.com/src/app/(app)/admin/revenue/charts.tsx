
'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Legend, Tooltip as RechartsTooltip, Area, AreaChart, Pie, PieChart, Cell } from 'recharts';
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
} from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import { useMemo } from 'react';
import type { RevenueMetric, PlanDistribution, RevenueSource } from '@/lib/types';


const trendsChartConfig = {
  mrr: { label: "MRR", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig;

const planChartConfig = {
    Basic: { label: 'Basic', color: 'hsl(var(--chart-3))' },
    Pro: { label: 'Pro', color: 'hsl(var(--chart-1))' },
    Enterprise: { label: 'Enterprise', color: 'hsl(var(--chart-2))' },
};

const sourceChartConfig = {
    Subscriptions: { label: 'Subscriptions', color: 'hsl(var(--chart-1))' },
    'Usage-based': { label: 'Usage-based', color: 'hsl(var(--chart-4))' },
    'Add-ons': { label: 'Add-ons', color: 'hsl(var(--chart-5))' },
};


export function RevenueTrendsChart({ data }: { data: RevenueMetric[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Recurring Revenue (MRR)</CardTitle>
        <CardDescription>Tracks the predictable revenue stream over the last 12 months.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={trendsChartConfig} className="h-[300px] w-full">
            <AreaChart data={data}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis
                    tickFormatter={(value) => `$${value / 1000}k`}
                />
                <RechartsTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                <Area
                    dataKey="mrr"
                    type="natural"
                    fill="var(--color-mrr)"
                    fillOpacity={0.4}
                    stroke="var(--color-mrr)"
                />
            </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

export function SubscriptionBreakdownChart({ data }: { data: PlanDistribution[] }) {
    const chartData = useMemo(() => data.map(item => ({
        ...item,
        fill: `var(--color-${item.plan})`
    })), [data]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Active Subscriptions by Plan</CardTitle>
                <CardDescription>Distribution of customers across pricing tiers.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center">
                <ChartContainer config={planChartConfig} className="mx-auto aspect-square w-full max-w-[300px]">
                    <PieChart>
                        <RechartsTooltip content={<ChartTooltipContent nameKey="count" hideLabel />} />
                        <Pie data={chartData} dataKey="count" nameKey="plan" innerRadius={60}>
                           {chartData.map((entry) => (
                                <Cell key={entry.plan} fill={entry.fill} />
                            ))}
                        </Pie>
                        <ChartLegend
                            content={<ChartLegendContent nameKey="plan" />}
                            className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
                        />
                    </PieChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}

export function RevenueBreakdownChart({ data }: { data: RevenueSource[] }) {
     const chartData = useMemo(() => data.map(item => ({
        ...item,
        name: item.source,
        fill: `var(--color-${item.source.replace(/\s+/g, '-')})`
    })), [data]);

     return (
        <Card>
            <CardHeader>
                <CardTitle>Revenue Breakdown</CardTitle>
                <CardDescription>Sources of total revenue.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center">
                <ChartContainer config={sourceChartConfig} className="mx-auto aspect-square w-full max-w-[300px]">
                    <PieChart>
                        <RechartsTooltip content={<ChartTooltipContent nameKey="amount" hideLabel formatter={(value) => `$${value.toLocaleString()}`} />} />
                        <Pie data={chartData} dataKey="amount" nameKey="name" innerRadius={60} labelLine={false} label={({ percent }) => `${(percent * 100).toFixed(0)}%`}>
                           {chartData.map((entry) => (
                                <Cell key={entry.name} fill={entry.fill} />
                            ))}
                        </Pie>
                         <ChartLegend
                            content={<ChartLegendContent nameKey="name" />}
                            className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
                        />
                    </PieChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
