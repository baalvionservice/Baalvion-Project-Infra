'use client';
import { Line, LineChart, CartesianGrid, XAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import onlineSalesData from '@/lib/data/online-sales.json';

export default function DailyRevenueChart() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Last 7 Days Revenue</CardTitle>
                <CardDescription>Online sales revenue.</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={{}} className="h-[150px] w-full">
                    <LineChart data={onlineSalesData.revenueLast7Days} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                         <CartesianGrid vertical={false} />
                         <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} fontSize={12}/>
                        <ChartTooltip cursor={false} content={<ChartTooltipContent formatter={(value) => `$${Number(value).toLocaleString()}`} />} />
                        <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                    </LineChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
