'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Plus, Globe, FileText } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import StatusBadge from '@/components/common/StatusBadge';
import DataTable from '@/components/data-table/DataTable';
import DataTableColumnHeader from '@/components/data-table/DataTableColumnHeader';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCmsPages, usePublishPage } from '@/lib/queries/cms.queries';
import { useUIStore } from '@/lib/store/uiStore';
import { formatDate } from '@/lib/utils/format';
import type { CmsPage } from '@/lib/types/cms.types';

export default function CmsPagesPage() {
  const router = useRouter();
  const { setBreadcrumbs } = useUIStore();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useCmsPages({ page, limit: 20, status: statusFilter || undefined });
  const { mutate: publish } = usePublishPage();

  useEffect(() => {
    setBreadcrumbs([{ label: 'CMS', href: '/cms/pages' }, { label: 'Pages' }]);
  }, [setBreadcrumbs]);

  const columns: ColumnDef<CmsPage>[] = [
    {
      accessorKey: 'title',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Title" />,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
          <div>
            <p className="font-medium text-sm">{row.original.title}</p>
            <p className="text-xs text-muted-foreground">/{row.original.slug}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'author',
      header: 'Author',
      cell: ({ row }) => <span className="text-sm">{row.original.author.fullName}</span>,
    },
    {
      accessorKey: 'updatedAt',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Updated" />,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{formatDate(row.original.updatedAt)}</span>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const p = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/cms/pages/${p.id}`)}>
                Edit
              </DropdownMenuItem>
              {p.status !== 'published' && (
                <DropdownMenuItem onClick={() => publish(p.id)}>
                  <Globe className="mr-2 h-4 w-4" />
                  Publish
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title="Pages"
        description="Manage CMS pages"
        actions={
          <Button size="sm" onClick={() => router.push('/cms/pages/new')}>
            <Plus className="mr-2 h-4 w-4" />
            New Page
          </Button>
        }
      />
      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        searchColumn="title"
        searchPlaceholder="Search pages..."
        totalCount={data?.pagination.total}
        page={page}
        onPageChange={setPage}
        filters={
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        }
      />
    </div>
  );
}
