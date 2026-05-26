'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { Transaction, PaymentGateway } from '@/lib/types';
import fxRates from '@/lib/data/fx-rates.json';

interface GatewayPerformanceTableProps {
  transactions: Transaction[];
}

const gateways: PaymentGateway[] = ['Stripe', 'Razorpay', 'PayPal'];

export default function GatewayPerformanceTable({
  transactions,
}: GatewayPerformanceTableProps) {
  const stats = gateways.map((gateway) => {
    const gatewayTxs = transactions.filter((tx) => tx.gateway === gateway);
    const successfulTxs = gatewayTxs.filter((tx) => tx.status === 'Success');

    const totalVolume = successfulTxs.reduce((sum, tx) => {
        const rate = fxRates[tx.currency] || 1;
        return sum + (tx.amount / rate);
    }, 0);
    
    const feesPaid = successfulTxs.reduce((sum, tx) => {
        const rate = fxRates[tx.currency] || 1;
        return sum + (tx.fee / rate);
    }, 0);

    const successRate =
      gatewayTxs.length > 0
        ? (successfulTxs.length / gatewayTxs.length) * 100
        : 0;
    const avgTransaction =
      successfulTxs.length > 0 ? totalVolume / successfulTxs.length : 0;

    return {
      gateway,
      totalVolume,
      successRate: successRate.toFixed(1),
      avgTransaction: avgTransaction.toFixed(2),
      feesPaid,
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gateway Performance</CardTitle>
        <CardDescription>
          A summary of performance for each payment gateway (in USD).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Gateway</TableHead>
              <TableHead className="text-right">Total Volume</TableHead>
              <TableHead className="text-right">Success Rate</TableHead>
              <TableHead className="text-right">Avg. Transaction</TableHead>
              <TableHead className="text-right">Fees Paid</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stats.map((stat) => (
              <TableRow key={stat.gateway}>
                <TableCell className="font-medium">{stat.gateway}</TableCell>
                <TableCell className="text-right">
                  ${stat.totalVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </TableCell>
                <TableCell className="text-right">{stat.successRate}%</TableCell>
                <TableCell className="text-right">
                  ${stat.avgTransaction}
                </TableCell>
                <TableCell className="text-right">
                  ${stat.feesPaid.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
