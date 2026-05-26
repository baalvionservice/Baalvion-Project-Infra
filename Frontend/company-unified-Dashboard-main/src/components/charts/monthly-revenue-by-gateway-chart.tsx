'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
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
  type ChartConfig,
} from '@/components/ui/chart';
import type { Transaction } from '@/lib/types';
import { format, subMonths } from 'date-fns';

interface MonthlyRevenueByGatewayChartProps {
  transactions: Transaction[];
}

const chartConfig = {
  stripe: {
    label: 'Stripe',
    color: 'hsl(var(--chart-1))',
  },
  razorpay: {
    label: 'Razorpay',
    color: 'hsl(var(--chart-2))',
  },
  paypal: {
    label: 'PayPal',
    color: 'hsl(var(--chart-3))',
  },
} satisfies ChartConfig;

export default function MonthlyRevenueByGatewayChart({
  transactions,
}: MonthlyRevenueByGatewayChartProps) {
  const sixMonthsAgo = subMonths(new Date(), 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const successfulTransactions = transactions.filter(
    (tx) => tx.status === 'Success' && new Date(tx.date) >= sixMonthsAgo
  );

  const monthlyData = successfulTransactions.reduce((acc, tx) => {
    const month = format(new Date(tx.date), 'MMM');
    if (!acc[month]) {
      acc[month] = { month, stripe: 0, razorpay: 0, paypal: 0 };
    }
    const gatewayKey = tx.gateway.toLowerCase() as keyof typeof chartConfig;
    if (acc[month] && gatewayKey in acc[month]) {
      (acc[month][gatewayKey] as number) += tx.amount;
    }
    return acc;
  }, {} as Record<string, { month: string; stripe: number; razorpay: number; paypal: number }>);
  
  const monthOrder = Array.from({length: 6}, (_, i) => format(subMonths(new Date(), 5-i), 'MMM'))

  const chartData = monthOrder.map(month => monthlyData[month] || { month, stripe: 0, razorpay: 0, paypal: 0 });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Revenue by Gateway</CardTitle>
        <CardDescription>
          Last 6 months revenue breakdown by gateway.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <YAxis
              tickFormatter={(value) => `$${Number(value) / 1000}k`}
              tickLine={false}
              axisLine={false}
            />
            <ChartTooltip
              content={<ChartTooltipContent indicator="dot" />}
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="stripe"
              stackId="a"
              fill="var(--color-stripe)"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="razorpay"
              stackId="a"
              fill="var(--color-razorpay)"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="paypal"
              stackId="a"
              fill="var(--color-paypal)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
