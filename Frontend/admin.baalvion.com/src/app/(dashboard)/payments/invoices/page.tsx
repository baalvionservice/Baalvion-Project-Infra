'use client';

import { useState, useEffect } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import PageHeader from '@/components/common/PageHeader';
import StatusBadge from '@/components/common/StatusBadge';
import DataTable from '@/components/data-table/DataTable';
import DataTableColumnHeader from '@/components/data-table/DataTableColumnHeader';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useInvoices } from '@/lib/queries/payments.queries';
import { useUIStore } from '@/lib/store/uiStore';
import { formatDate } from '@/lib/utils/format';
import type { Invoice } from '@/lib/types/payment.types';

const money = (amount: number, currency: string) => {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
};

export default function InvoicesPage() {
  const { setBreadcrumbs } = useUIStore();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useInvoices({ page, limit: 20, status: statusFilter || undefined });

  useEffect(() => {
    setBreadcrumbs([{ label: 'Payments', href: '/payments' }, { label: 'Invoices' }]);
  }, [setBreadcrumbs]);

  const columns: ColumnDef<Invoice>[] = [
    {
      accessorKey: 'invoiceNumber',
      header: 'Invoice',
      cell: ({ row }) => <code className="text-xs font-medium">{row.original.invoiceNumber}</code>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'total',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Total" />,
      cell: ({ row }) => (
        <span className="text-sm font-medium">{money(row.original.total, row.original.currency)}</span>
      ),
    },
    {
      accessorKey: 'tax',
      header: 'Tax',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{money(row.original.tax, row.original.currency)}</span>
      ),
    },
    {
      accessorKey: 'dueDate',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Due" />,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{formatDate(row.original.dueDate)}</span>
      ),
    },
    {
      accessorKey: 'paidAt',
      header: 'Paid',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.paidAt ? formatDate(row.original.paidAt) : '—'}
        </span>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/payments"><ArrowLeft className="mr-1 h-4 w-4" />Back</Link>
        </Button>
      </div>
      <PageHeader title="Invoices" description={`${data?.pagination?.total ?? 0} invoices`} />
      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        totalCount={data?.pagination?.total}
        page={page}
        onPageChange={setPage}
        filters={
          <Select value={statusFilter || 'all'} onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}>
            <SelectTrigger className="h-8 w-32"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="void">Void</SelectItem>
            </SelectContent>
          </Select>
        }
      />
    </div>
  );
}
