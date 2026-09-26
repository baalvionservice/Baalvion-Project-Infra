'use client';

import * as React from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Legend, Tooltip as RechartsTooltip, Bar, BarChart } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import type { UsageMetric, PlanUsage } from '@/lib/types';
import { format } from 'date-fns';

const chartConfig = {
  apiCalls: {
    label: "API Calls",
    color: "hsl(var(--chart-1))",
  },
  tasksCreated: {
    label: "Tasks Created",
    color: "hsl(var(--chart-2))",
  },
   storageUsage: {
    label: "Storage (GB)",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig

export function UsageTrendsChart({ data }: { data: UsageMetric[] }) {
    const formattedData = data.map(item => ({
        ...item,
        date: format(new Date(item.date), 'MMM d')
    }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usage Over Time (Last 30 Days)</CardTitle>
        <CardDescription>Track your platform usage across key metrics.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <AreaChart
            data={formattedData}
            margin={{
              top: 10,
              right: 30,
              left: 0,
              bottom: 0,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <RechartsTooltip content={<ChartTooltipContent indicator="dot" />} />
            <Legend />
            <Area yAxisId="left" type="monotone" dataKey="apiCalls" stackId="1" stroke="var(--color-apiCalls)" fill="var(--color-apiCalls)" fillOpacity={0.4} />
            <Area yAxisId="right" type="monotone" dataKey="storageUsage" stackId="1" stroke="var(--color-storageUsage)" fill="var(--color-storageUsage)" fillOpacity={0.4} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

export function UsageBreakdownPanel({ data }: { data: PlanUsage[] }) {
    
    const getUsageColor = (usage: number, limit: number) => {
        if (limit === -1) return 'bg-primary'; // unlimited
        const percentage = (usage / limit) * 100;
        if (percentage > 90) return 'bg-destructive';
        if (percentage > 75) return 'bg-yellow-500';
        return 'bg-primary';
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Usage Quotas</CardTitle>
                <CardDescription>Your current usage against your plan limits.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {data.map(item => (
                    <div key={item.feature}>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium text-muted-foreground">{item.feature}</span>
                            <span>
                                <strong>{item.usage.toLocaleString()}</strong> 
                                {item.limit !== -1 ? ` / ${item.limit.toLocaleString()}` : ' / Unlimited'}
                                <span className="ml-1 text-xs">{item.unit}</span>
                            </span>
                        </div>
                        <Progress 
                            value={item.limit !== -1 ? (item.usage / item.limit) * 100 : 100}
                            indicatorClassName={getUsageColor(item.usage, item.limit)}
                        />
                    </div>
                ))}
            </CardContent>
            <CardFooter>
                 <Button asChild className="w-full">
                    <Link href="/company/subscription">Upgrade Plan</Link>
                </Button>
            </CardFooter>
        </Card>
    );
}