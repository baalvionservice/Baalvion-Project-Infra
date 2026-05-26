'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Plus } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import StatusBadge from '@/components/common/StatusBadge';
import DataTable from '@/components/data-table/DataTable';
import DataTableColumnHeader from '@/components/data-table/DataTableColumnHeader';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useOrganizations } from '@/lib/queries/organizations.queries';
import { useUIStore } from '@/lib/store/uiStore';
import { initials, formatDate, formatNumber } from '@/lib/utils/format';
import type { OrgSummary } from '@/lib/types/organization.types';

const PLAN_COLORS: Record<string, string> = {
  free: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  starter: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  pro: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  enterprise: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
};

export default function OrganizationsPage() {
  const router = useRouter();
  const { setBreadcrumbs } = useUIStore();
  const [page, setPage] = useState(1);
  const [planFilter, setPlanFilter] = useState('');

  const { data, isLoading } = useOrganizations({ page, limit: 20, plan: planFilter || undefined });

  useEffect(() => {
    setBreadcrumbs([{ label: 'Organizations' }]);
  }, [setBreadcrumbs]);

  const columns: ColumnDef<OrgSummary>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Organization" />,
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 rounded-md">
            <AvatarImage src={row.original.logoUrl ?? undefined} />
            <AvatarFallback className="rounded-md text-xs">
              {initials(row.original.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm">{row.original.name}</p>
            <p className="text-xs text-muted-foreground">/{row.original.slug}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'plan',
      header: 'Plan',
      cell: ({ row }) => (
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${PLAN_COLORS[row.original.plan] ?? ''}`}
        >
          {row.original.plan}
        </span>
      ),
    },
    {
      accessorKey: 'memberCount',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Members" />,
      cell: ({ row }) => (
        <span className="text-sm">{formatNumber(row.original.memberCount)}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'owner',
      header: 'Owner',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={row.original.owner.avatarUrl ?? undefined} />
            <AvatarFallback className="text-[10px]">{initials(row.original.owner.fullName)}</AvatarFallback>
          </Avatar>
          <span className="text-sm">{row.original.owner.fullName}</span>
        </div>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{formatDate(row.original.createdAt)}</span>
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
            <DropdownMenuItem onClick={() => router.push(`/organizations/${row.original.id}`)}>
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem>Edit</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">Suspend</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Organizations"
        description={`${data?.pagination.total ?? 0} organizations`}
        actions={
          <Button size="sm" onClick={() => router.push('/organizations/new')}>
            <Plus className="mr-2 h-4 w-4" />
            New Organization
          </Button>
        }
      />
      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        searchColumn="name"
        searchPlaceholder="Search organizations..."
        totalCount={data?.pagination.total}
        page={page}
        onPageChange={setPage}
        filters={
          <Select value={planFilter} onValueChange={setPlanFilter}>
            <SelectTrigger className="h-8 w-32">
              <SelectValue placeholder="Plan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All plans</SelectItem>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="starter">Starter</SelectItem>
              <SelectItem value="pro">Pro</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
            </SelectContent>
          </Select>
        }
      />
    </div>
  );
}
