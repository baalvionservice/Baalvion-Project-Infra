
'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Line, LineChart } from 'recharts';
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
} from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import { useMemo } from 'react';
import type { SystemError } from '@/lib/types';
import { format, subDays, startOfDay } from 'date-fns';

export const ErrorFrequencyChart = ({ errors }: { errors: SystemError[] }) => {
    const chartData = useMemo(() => {
        return errors
            .sort((a,b) => b.frequency - a.frequency)
            .slice(0, 5)
            .map(error => ({
                name: error.type,
                frequency: error.frequency,
            }));
    }, [errors]);

    const chartConfig = {
        frequency: { label: "Frequency", color: "hsl(var(--destructive))" },
    } satisfies ChartConfig;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Top 5 Most Frequent Errors</CardTitle>
                <CardDescription>Number of occurrences for the most common errors.</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig}>
                    <BarChart accessibilityLayer data={chartData} layout="vertical" margin={{ left: 100 }}>
                        <CartesianGrid horizontal={false} />
                        <YAxis
                            dataKey="name"
                            type="category"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            width={100}
                            className="text-xs"
                        />
                        <XAxis type="number" hide />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent indicator="line" />}
                        />
                        <Bar dataKey="frequency" fill="var(--color-frequency)" radius={4} />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
};

export const ErrorTrendChart = ({ errors }: { errors: SystemError[] }) => {
    const chartData = useMemo(() => {
        const last14Days = Array.from({ length: 14 }, (_, i) => {
            const date = subDays(new Date(), i);
            return startOfDay(date);
        }).reverse();

        const errorsByDay = last14Days.map(date => {
            const count = errors.filter(err => 
                startOfDay(new Date(err.lastOccurred)).getTime() === date.getTime()
            ).reduce((sum, err) => sum + err.frequency, 0);
            return {
                date: format(date, 'MMM d'),
                count: count > 0 ? count : null,
            };
        });
        return errorsByDay;
    }, [errors]);

    const chartConfig = {
        count: { label: 'Errors', color: 'hsl(var(--destructive))' },
    } satisfies ChartConfig;
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Error Trend (Last 14 Days)</CardTitle>
                <CardDescription>Total error occurrences per day.</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="h-48">
                    <LineChart accessibilityLayer data={chartData} margin={{ left: 12, right: 12 }}>
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tickFormatter={(value) => value.slice(0, 3)}
                        />
                        <YAxis />
                        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                        <Line connectNulls dataKey="count" type="monotone" stroke="var(--color-count)" strokeWidth={2} dot={false} />
                    </LineChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
};
