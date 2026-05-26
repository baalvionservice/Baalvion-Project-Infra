'use client';

import { useState, useEffect } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { CreditCard, RefreshCw, Receipt, Webhook } from 'lucide-react';
import Link from 'next/link';
import PageHeader from '@/components/common/PageHeader';
import StatusBadge from '@/components/common/StatusBadge';
import KpiCard from '@/components/common/KpiCard';
import DataTable from '@/components/data-table/DataTable';
import DataTableColumnHeader from '@/components/data-table/DataTableColumnHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTransactions, usePaymentSummary } from '@/lib/queries/payments.queries';
import { useUIStore } from '@/lib/store/uiStore';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import type { Transaction } from '@/lib/types/payment.types';

export default function PaymentsPage() {
  const { setBreadcrumbs } = useUIStore();
  const [page, setPage] = useState(1);
  const [providerFilter, setProviderFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: summary, isLoading: summaryLoading } = usePaymentSummary();
  const { data, isLoading } = useTransactions({ page, limit: 20, provider: providerFilter || undefined, status: statusFilter || undefined });

  useEffect(() => {
    setBreadcrumbs([{ label: 'Payments' }]);
  }, [setBreadcrumbs]);

  const columns: ColumnDef<Transaction>[] = [
    {
      accessorKey: 'id',
      header: 'Transaction',
      cell: ({ row }) => (
        <div>
          <p className="font-mono text-xs text-muted-foreground">{row.original.orderId}</p>
          {row.original.paymentId && (
            <p className="font-mono text-xs text-muted-foreground/60">{row.original.paymentId}</p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'provider',
      header: 'Provider',
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize text-xs">{row.original.provider}</Badge>
      ),
    },
    {
      accessorKey: 'amount',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Amount" />,
      cell: ({ row }) => (
        <span className="font-medium">{formatCurrency(row.original.amount, row.original.currency)}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{formatDate(row.original.createdAt, 'MMM d, yyyy HH:mm')}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <PageHeader title="Payments" description="Transactions, subscriptions, and billing" />
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/payments/subscriptions"><RefreshCw className="mr-2 h-4 w-4" />Subscriptions</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/payments/invoices"><Receipt className="mr-2 h-4 w-4" />Invoices</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/payments/webhooks"><Webhook className="mr-2 h-4 w-4" />Webhooks</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Total Revenue" value={summary?.totalRevenue ?? 0} format="currency" icon={CreditCard} iconColor="text-green-500" isLoading={summaryLoading} />
        <KpiCard title="Active Subscriptions" value={summary?.activeSubscriptions ?? 0} icon={RefreshCw} iconColor="text-blue-500" isLoading={summaryLoading} />
        <KpiCard title="Pending Invoices" value={summary?.pendingInvoices ?? 0} icon={Receipt} iconColor="text-yellow-500" isLoading={summaryLoading} />
        <KpiCard title="Failed Payments" value={summary?.failedPayments ?? 0} icon={CreditCard} iconColor="text-red-500" isLoading={summaryLoading} />
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        searchColumn="orderId"
        searchPlaceholder="Search by order ID..."
        totalCount={data?.pagination.total}
        page={page}
        onPageChange={setPage}
        filters={
          <div className="flex gap-2">
            <Select value={providerFilter} onValueChange={setProviderFilter}>
              <SelectTrigger className="h-8 w-32"><SelectValue placeholder="Provider" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">All</SelectItem>
                <SelectItem value="razorpay">Razorpay</SelectItem>
                <SelectItem value="payu">PayU</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 w-32"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">All</SelectItem>
                <SelectItem value="captured">Captured</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />
    </div>
  );
}
