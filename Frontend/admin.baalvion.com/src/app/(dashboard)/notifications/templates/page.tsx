'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/data-table/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { notificationsApi, type NotificationTemplate } from '@/lib/api/notifications';
import { useUIStore } from '@/lib/store/uiStore';
import { formatDate } from '@/lib/utils/format';

export default function NotificationTemplatesPage() {
  const { setBreadcrumbs } = useUIStore();

  const { data, isLoading } = useQuery({
    queryKey: ['notification-templates', 'table'],
    queryFn: () => notificationsApi.templates.list().then((r) => r.data.data),
  });

  useEffect(() => {
    setBreadcrumbs([{ label: 'Notifications', href: '/notifications' }, { label: 'Templates' }]);
  }, [setBreadcrumbs]);

  const columns: ColumnDef<NotificationTemplate>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <div>
          <p className="text-sm font-medium">{row.original.name}</p>
          <code className="text-xs text-muted-foreground">{row.original.key}</code>
        </div>
      ),
    },
    {
      accessorKey: 'channel',
      header: 'Channel',
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize text-xs">{row.original.channel.replace('_', ' ')}</Badge>
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
      accessorKey: 'variables',
      header: 'Variables',
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.variables.slice(0, 4).map((v) => (
            <code key={v} className="text-[10px] bg-muted px-1 py-0.5 rounded">{`{{${v}}}`}</code>
          ))}
          {row.original.variables.length > 4 && (
            <span className="text-[10px] text-muted-foreground">+{row.original.variables.length - 4}</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'isActive',
      header: 'State',
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? 'success' : 'secondary'} className="text-xs">
          {row.original.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      accessorKey: 'updatedAt',
      header: 'Updated',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{formatDate(row.original.updatedAt)}</span>
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
      <PageHeader title="Notification Templates" description="Channel templates used for transactional messaging" />
      <DataTable
        columns={columns}
        data={data ?? []}
        isLoading={isLoading}
        searchColumn="name"
        searchPlaceholder="Search templates..."
      />
    </div>
  );
}
