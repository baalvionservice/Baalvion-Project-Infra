'use client';

import { useState, useEffect } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import PageHeader from '@/components/common/PageHeader';
import StatusBadge from '@/components/common/StatusBadge';
import DataTable from '@/components/data-table/DataTable';
import DataTableColumnHeader from '@/components/data-table/DataTableColumnHeader';
import ConfirmModal from '@/components/modals/ConfirmModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSubscriptions, useCancelSubscription } from '@/lib/queries/payments.queries';
import { useUIStore } from '@/lib/store/uiStore';
import { formatDate } from '@/lib/utils/format';
import type { Subscription } from '@/lib/types/payment.types';

export default function SubscriptionsPage() {
  const { setBreadcrumbs } = useUIStore();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);

  const { data, isLoading } = useSubscriptions({ page, limit: 20, status: statusFilter || undefined });
  const { mutate: cancel, isPending } = useCancelSubscription();

  useEffect(() => {
    setBreadcrumbs([{ label: 'Payments', href: '/payments' }, { label: 'Subscriptions' }]);
  }, [setBreadcrumbs]);

  const columns: ColumnDef<Subscription>[] = [
    {
      accessorKey: 'externalId',
      header: 'Subscription ID',
      cell: ({ row }) => (
        <code className="text-xs text-muted-foreground">{row.original.externalId}</code>
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
      accessorKey: 'planId',
      header: 'Plan',
      cell: ({ row }) => <span className="text-sm font-medium">{row.original.planId}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'currentPeriodEnd',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Renews" />,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{formatDate(row.original.currentPeriodEnd)}</span>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => setCancelTarget(row.original.id)}
              disabled={row.original.status !== 'active'}
            >
              Cancel Subscription
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
      <PageHeader title="Subscriptions" description={`${data?.pagination.total ?? 0} subscriptions`} />
      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        totalCount={data?.pagination.total}
        page={page}
        onPageChange={setPage}
        filters={
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 w-32"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        }
      />
      <ConfirmModal
        open={!!cancelTarget}
        onOpenChange={(o) => !o && setCancelTarget(null)}
        title="Cancel Subscription?"
        description="The subscription will remain active until the end of the billing cycle."
        confirmLabel="Cancel Subscription"
        isLoading={isPending}
        onConfirm={() => {
          if (cancelTarget) {
            cancel({ id: cancelTarget, cancelAtCycleEnd: true });
            setCancelTarget(null);
          }
        }}
      />
    </div>
  );
}
