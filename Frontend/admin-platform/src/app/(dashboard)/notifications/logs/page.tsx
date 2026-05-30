'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { keepPreviousData } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import PageHeader from '@/components/common/PageHeader';
import StatusBadge from '@/components/common/StatusBadge';
import DataTable from '@/components/data-table/DataTable';
import DataTableColumnHeader from '@/components/data-table/DataTableColumnHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { notificationsApi, type NotificationLog } from '@/lib/api/notifications';
import { useUIStore } from '@/lib/store/uiStore';
import { formatDate } from '@/lib/utils/format';

export default function NotificationLogsPage() {
  const { setBreadcrumbs } = useUIStore();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [channelFilter, setChannelFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['notification-logs', { page, status: statusFilter, channel: channelFilter }],
    queryFn: () =>
      notificationsApi.logs
        .list({ page, limit: 20, status: statusFilter || undefined, channel: channelFilter || undefined })
        .then((r) => r.data),
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    setBreadcrumbs([{ label: 'Notifications', href: '/notifications' }, { label: 'Delivery Logs' }]);
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
      accessorKey: 'sentAt',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Sent" />,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.sentAt ? formatDate(row.original.sentAt) : formatDate(row.original.createdAt)}
        </span>
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
      <PageHeader title="Delivery Logs" description={`${data?.pagination?.total ?? 0} delivery events`} />
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
                <SelectItem value="in_app">In-app</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter || 'all'} onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}>
              <SelectTrigger className="h-8 w-32"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="opened">Opened</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />
    </div>
  );
}
