'use client';
import { Line, LineChart, CartesianGrid, XAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useFinance } from '@/hooks/use-finance';

export default function DailyRevenueChart() {
    const { view } = useFinance();
    const data = view?.revenueLast7Days ?? [];
    return (
        <Card>
            <CardHeader>
                <CardTitle>Last 7 Days Revenue</CardTitle>
                <CardDescription>Online sales revenue.</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={{}} className="h-[150px] w-full">
                    <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
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
