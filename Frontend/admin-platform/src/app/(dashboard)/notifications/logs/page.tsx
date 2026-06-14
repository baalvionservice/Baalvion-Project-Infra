'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
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
import { toast } from 'sonner';
import { notificationsApi, type NotificationLog } from '@/lib/api/notifications';
import { useUIStore } from '@/lib/store/uiStore';
import { formatDate } from '@/lib/utils/format';

export default function NotificationLogsPage() {
  const { setBreadcrumbs } = useUIStore();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [channelFilter, setChannelFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['notification-logs', { page, channel: channelFilter }],
    queryFn: () =>
      notificationsApi.logs
        .list({ page, limit: 20, channel: channelFilter || undefined })
        .then((r) => r.data),
    placeholderData: keepPreviousData,
  });

  const retryMutation = useMutation({
    mutationFn: (entryId: string) => notificationsApi.logs.retry(entryId),
    onSuccess: () => {
      toast.success('The failed delivery was requeued for retry.');
      queryClient.invalidateQueries({ queryKey: ['notification-logs'] });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Failed to requeue delivery';
      toast.error(message);
    },
  });

  useEffect(() => {
    setBreadcrumbs([{ label: 'Notifications', href: '/notifications' }, { label: 'Failed Deliveries' }]);
  }, [setBreadcrumbs]);

  const columns: ColumnDef<NotificationLog>[] = [
    {
      accessorKey: 'recipient',
      header: 'Recipient',
      cell: ({ row }) => <span className="text-sm font-medium">{row.original.recipient}</span>,
    },
    {
      accessorKey: 'channel',
      header: 'Channel',
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize text-xs">{row.original.channel.replace('_', ' ')}</Badge>
      ),
    },
    {
      accessorKey: 'templateKey',
      header: 'Template',
      cell: ({ row }) => (
        <code className="text-xs text-muted-foreground">{row.original.templateKey ?? '—'}</code>
      ),
    },
    {
      accessorKey: 'subject',
      header: 'Subject',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground truncate max-w-xs">{row.original.subject ?? '—'}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5">
          <StatusBadge status={row.original.status} />
          {row.original.errorMessage && (
            <span className="text-[10px] text-destructive truncate max-w-[180px]">{row.original.errorMessage}</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Failed At" />,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{formatDate(row.original.createdAt)}</span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          disabled={retryMutation.isPending}
          onClick={() => retryMutation.mutate(row.original.id)}
        >
          <RefreshCw className="mr-1 h-3.5 w-3.5" />
          Retry
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/notifications"><ArrowLeft className="mr-1 h-4 w-4" />Back</Link>
        </Button>
      </div>
      <PageHeader
        title="Failed Deliveries"
        description={`${data?.pagination?.total ?? 0} failed deliveries in the dead-letter queue`}
      />
      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        totalCount={data?.pagination?.total}
        page={page}
        onPageChange={setPage}
        filters={
          <div className="flex gap-2">
            <Select value={channelFilter || 'all'} onValueChange={(v) => setChannelFilter(v === 'all' ? '' : v)}>
              <SelectTrigger className="h-8 w-32"><SelectValue placeholder="Channel" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All channels</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="push">Push</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="webhook">Webhook</SelectItem>
                <SelectItem value="in_app">In-app</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />
    </div>
  );
}
