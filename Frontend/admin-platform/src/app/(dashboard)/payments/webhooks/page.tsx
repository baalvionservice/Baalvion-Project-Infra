'use client';

import { useState, useEffect } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import PageHeader from '@/components/common/PageHeader';
import StatusBadge from '@/components/common/StatusBadge';
import DataTable from '@/components/data-table/DataTable';
import DataTableColumnHeader from '@/components/data-table/DataTableColumnHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWebhookLogs, useRetryWebhook } from '@/lib/queries/payments.queries';
import { useUIStore } from '@/lib/store/uiStore';
import { formatDateTime } from '@/lib/utils/format';
import type { WebhookLog } from '@/lib/types/payment.types';

export default function WebhooksPage() {
  const { setBreadcrumbs } = useUIStore();
  const [page, setPage] = useState(1);
  const [providerFilter, setProviderFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useWebhookLogs({ page, limit: 20, provider: providerFilter || undefined, status: statusFilter || undefined });
  const { mutate: retry } = useRetryWebhook();

  useEffect(() => {
    setBreadcrumbs([{ label: 'Payments', href: '/payments' }, { label: 'Webhooks' }]);
  }, [setBreadcrumbs]);

  const columns: ColumnDef<WebhookLog>[] = [
    {
      accessorKey: 'eventType',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Event" />,
      cell: ({ row }) => (
        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{row.original.eventType}</code>
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
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'errorMessage',
      header: 'Error',
      cell: ({ row }) => row.original.errorMessage ? (
        <span className="text-xs text-destructive truncate max-w-xs block">{row.original.errorMessage}</span>
      ) : <span className="text-xs text-muted-foreground">—</span>,
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Received" />,
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">{formatDateTime(row.original.createdAt)}</span>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => row.original.status === 'failed' ? (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={() => retry(row.original.id)}
        >
          <RefreshCw className="mr-1 h-3 w-3" />
          Retry
        </Button>
      ) : null,
    },
  ];

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/payments"><ArrowLeft className="mr-1 h-4 w-4" />Back</Link>
        </Button>
      </div>
      <PageHeader title="Webhook Logs" description="Incoming payment webhook events" />
      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
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
                <SelectItem value="processed">Processed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />
    </div>
  );
}
