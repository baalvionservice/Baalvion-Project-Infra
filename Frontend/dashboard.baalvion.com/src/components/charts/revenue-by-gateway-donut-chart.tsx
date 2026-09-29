'use client';

import { Pie, PieChart } from 'recharts';
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

interface RevenueByGatewayDonutChartProps {
  transactions: Transaction[];
}

export default function RevenueByGatewayDonutChart({
  transactions,
}: RevenueByGatewayDonutChartProps) {
  const successfulTransactions = transactions.filter(
    (tx) => tx.status === 'Success'
  );

  const gatewayRevenue = successfulTransactions.reduce((acc, tx) => {
    if (!acc[tx.gateway]) {
      acc[tx.gateway] = 0;
    }
    // Assuming all currencies are USD for simplicity in this chart
    acc[tx.gateway] += tx.amount;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(gatewayRevenue).map(
    ([gateway, revenue]) => ({
      gateway,
      revenue,
      fill: `var(--color-${gateway.toLowerCase()})`,
    })
  );

  const chartConfig = {
    revenue: {
      label: 'Revenue',
    },
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

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Revenue by Gateway</CardTitle>
        <CardDescription>
          Breakdown of total revenue by payment gateway.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square h-[200px]"
        >
          <PieChart>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => `$${Number(value).toLocaleString()}`}
                  nameKey="gateway"
                />
              }
            />
            <Pie data={chartData} dataKey="revenue" nameKey="gateway" innerRadius={60} />
            <ChartLegend
              content={<ChartLegendContent nameKey="gateway" />}
              className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
