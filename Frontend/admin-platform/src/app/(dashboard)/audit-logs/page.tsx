'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { Download } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import StatusBadge from '@/components/common/StatusBadge';
import DataTable from '@/components/data-table/DataTable';
import DataTableColumnHeader from '@/components/data-table/DataTableColumnHeader';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { auditApi, type AuditLog } from '@/lib/api/audit';
import { identityAdminApi, type AdminAuditLog } from '@/lib/api/identity-admin';
import { useUIStore } from '@/lib/store/uiStore';
import { formatDateTime, initials } from '@/lib/utils/format';

export default function AuditLogsPage() {
  const { setBreadcrumbs } = useUIStore();
  const [page, setPage] = useState(1);
  const [resourceFilter, setResourceFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [source, setSource] = useState<'identity' | 'legacy'>('identity');

  const { data: identityData, isLoading: identityLoading } = useQuery({
    queryKey: ['identity-audit-logs', page, actionFilter],
    queryFn: () =>
      identityAdminApi.getAuditLogs({ page, limit: 20, action: actionFilter || undefined })
        .then((r) => r.data.data),
    enabled: source === 'identity',
  });

  const { data: legacyData, isLoading: legacyLoading } = useQuery({
    queryKey: ['audit-logs', page, resourceFilter],
    queryFn: () =>
      auditApi.adminList({ page, limit: 20, resourceType: resourceFilter || undefined }).then((r) => r.data),
    enabled: source === 'legacy',
  });

  // admin-service returns snake_case AdminAuditLog rows (with the actor joined as
  // user_email/user_name/user_avatar). Map them to the camelCase AuditLog shape the
  // table columns render.
  const mappedIdentity = (identityData?.items ?? []).map((l) => {
    const r = l as AdminAuditLog & { user_email?: string | null; user_name?: string | null; user_avatar?: string | null };
    return {
      id: String(r.id),
      user: r.user_id
        ? { id: Number(r.user_id), fullName: r.user_name ?? r.user_email ?? `User #${r.user_id}`, email: r.user_email ?? '', avatarUrl: r.user_avatar ?? null }
        : null,
      action: r.action,
      resourceType: r.resource_type ?? '—',
      resourceId: r.resource_id ?? null,
      ipAddress: r.ip_address ?? '',
      createdAt: r.created_at,
      metadata: r.metadata,
    };
  }) as unknown as AuditLog[];

  const data = source === 'identity'
    ? { data: mappedIdentity, pagination: { total: identityData?.total ?? 0 } }
    : legacyData;
  const isLoading = source === 'identity' ? identityLoading : legacyLoading;

  useEffect(() => {
    setBreadcrumbs([{ label: 'Audit Logs' }]);
  }, [setBreadcrumbs]);

  const columns: ColumnDef<AuditLog>[] = [
    {
      accessorKey: 'user',
      header: 'Actor',
      cell: ({ row }) =>
        row.original.user ? (
          <div className="flex items-center gap-2">
            <Avatar className="h-7 w-7">
              <AvatarImage src={row.original.user.avatarUrl ?? undefined} />
              <AvatarFallback className="text-[10px]">{initials(row.original.user.fullName)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-xs font-medium">{row.original.user.fullName}</p>
              <p className="text-[10px] text-muted-foreground">{row.original.user.email}</p>
            </div>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">System</span>
        ),
    },
    {
      accessorKey: 'action',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Action" />,
      cell: ({ row }) => (
        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{row.original.action}</code>
      ),
    },
    {
      accessorKey: 'resourceType',
      header: 'Resource',
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs capitalize">{row.original.resourceType}</Badge>
      ),
    },
    {
      accessorKey: 'ipAddress',
      header: 'IP',
      cell: ({ row }) => (
        <span className="text-xs font-mono text-muted-foreground">{row.original.ipAddress}</span>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Time" />,
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">{formatDateTime(row.original.createdAt)}</span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Audit Logs"
        description="Track all admin actions and security events"
        actions={
          <Button variant="outline" size="sm" onClick={() => auditApi.export()}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        }
      />
      <DataTable
        columns={columns}
        data={(data?.data ?? []) as AuditLog[]}
        isLoading={isLoading}
        searchColumn="action"
        searchPlaceholder="Search actions..."
        totalCount={data?.pagination.total}
        page={page}
        onPageChange={setPage}
        filters={
          <Select value={resourceFilter || '__all__'} onValueChange={(v) => setResourceFilter(v === '__all__' ? '' : v)}>
            <SelectTrigger className="h-8 w-36"><SelectValue placeholder="Resource" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All resources</SelectItem>
              <SelectItem value="users">Users</SelectItem>
              <SelectItem value="organizations">Organizations</SelectItem>
              <SelectItem value="payments">Payments</SelectItem>
              <SelectItem value="cms">CMS</SelectItem>
            </SelectContent>
          </Select>
        }
      />
    </div>
  );
}
