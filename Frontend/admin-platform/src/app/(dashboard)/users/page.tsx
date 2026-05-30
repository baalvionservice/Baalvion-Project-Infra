'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Plus, UserX, UserCheck, Mail } from 'lucide-react';
import { format } from 'date-fns';
import PageHeader from '@/components/common/PageHeader';
import StatusBadge from '@/components/common/StatusBadge';
import DataTable from '@/components/data-table/DataTable';
import DataTableColumnHeader from '@/components/data-table/DataTableColumnHeader';
import ConfirmModal from '@/components/modals/ConfirmModal';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUsers, useSuspendUser, useUnsuspendUser } from '@/lib/queries/users.queries';
import { useUIStore } from '@/lib/store/uiStore';
import { ROLES } from '@/lib/constants/roles';
import { initials } from '@/lib/utils/format';
import type { AdminUser } from '@/lib/types/user.types';
import type { UserRole } from '@/lib/types/auth.types';

export default function UsersPage() {
  const router = useRouter();
  const { setBreadcrumbs } = useUIStore();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [suspendTarget, setSuspendTarget] = useState<AdminUser | null>(null);

  const { data, isLoading } = useUsers({
    page,
    limit: 20,
    status: statusFilter || undefined,
    role: roleFilter || undefined,
  });

  const { mutate: suspend, isPending: isSuspending } = useSuspendUser();
  const { mutate: unsuspend } = useUnsuspendUser();

  useEffect(() => {
    setBreadcrumbs([{ label: 'Users' }]);
  }, [setBreadcrumbs]);

  const columns: ColumnDef<AdminUser>[] = [
    {
      accessorKey: 'fullName',
      header: ({ column }) => <DataTableColumnHeader column={column} title="User" />,
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={row.original.avatarUrl ?? undefined} />
            <AvatarFallback className="text-xs">{initials(row.original.fullName)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm">{row.original.fullName}</p>
            <p className="text-xs text-muted-foreground">{row.original.email}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => {
        const role = row.original.role as UserRole;
        const config = ROLES[role];
        return config ? (
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${config.color}`}>
            {config.label}
          </span>
        ) : <span className="text-xs text-muted-foreground">{role}</span>;
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'emailVerifiedAt',
      header: 'Verified',
      cell: ({ row }) => (
        <Badge variant={row.original.emailVerifiedAt ? 'success' : 'warning'} className="text-xs">
          {row.original.emailVerifiedAt ? 'Verified' : 'Unverified'}
        </Badge>
      ),
    },
    {
      accessorKey: 'mfaEnabled',
      header: 'MFA',
      cell: ({ row }) => (
        <Badge variant={row.original.mfaEnabled ? 'success' : 'secondary'} className="text-xs">
          {row.original.mfaEnabled ? 'Enabled' : 'Disabled'}
        </Badge>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {format(new Date(row.original.createdAt), 'MMM d, yyyy')}
        </span>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const user = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/users/${user.id}`)}>
                View Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {user.status === 'active' ? (
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => setSuspendTarget(user)}
                >
                  <UserX className="mr-2 h-4 w-4" />
                  Suspend
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => unsuspend(user.id)}>
                  <UserCheck className="mr-2 h-4 w-4" />
                  Unsuspend
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title="Users"
        description={`${data?.pagination.total ?? 0} total users`}
        actions={
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Invite User
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        searchColumn="fullName"
        searchPlaceholder="Search users..."
        totalCount={data?.pagination.total}
        page={page}
        onPageChange={setPage}
        filters={
          <div className="flex gap-2">
            <Select value={statusFilter || '__all__'} onValueChange={(v) => setStatusFilter(v === '__all__' ? '' : v)}>
              <SelectTrigger className="h-8 w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Select value={roleFilter || '__all__'} onValueChange={(v) => setRoleFilter(v === '__all__' ? '' : v)}>
              <SelectTrigger className="h-8 w-32">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All roles</SelectItem>
                {Object.entries(ROLES).map(([v, { label }]) => (
                  <SelectItem key={v} value={v}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />

      <ConfirmModal
        open={!!suspendTarget}
        onOpenChange={(o) => !o && setSuspendTarget(null)}
        title={`Suspend ${suspendTarget?.fullName}?`}
        description="This will prevent the user from accessing the platform."
        confirmLabel="Suspend User"
        isLoading={isSuspending}
        onConfirm={() => {
          if (suspendTarget) {
            suspend({ id: suspendTarget.id, reason: 'Suspended by admin' });
            setSuspendTarget(null);
          }
        }}
      />
    </div>
  );
}
