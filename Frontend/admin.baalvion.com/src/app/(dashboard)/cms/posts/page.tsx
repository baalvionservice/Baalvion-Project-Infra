'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Plus, Globe } from 'lucide-react';
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
import { useCmsPosts, usePublishPage, type AggregatedContent } from '@/lib/queries/cms.queries';
import { useUIStore } from '@/lib/store/uiStore';
import { formatDate } from '@/lib/utils/format';

export default function CmsPostsPage() {
  const router = useRouter();
  const { setBreadcrumbs } = useUIStore();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useCmsPosts({ page, limit: 20, status: statusFilter || undefined });
  const { mutate: publish } = usePublishPage();

  useEffect(() => {
    setBreadcrumbs([{ label: 'CMS', href: '/cms/pages' }, { label: 'Posts' }]);
  }, [setBreadcrumbs]);

  const columns: ColumnDef<AggregatedContent>[] = [
    {
      accessorKey: 'title',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Title" />,
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-sm">{row.original.title}</p>
          {row.original.excerpt && (
            <p className="text-xs text-muted-foreground truncate max-w-xs">{row.original.excerpt}</p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'websiteName',
      header: 'Website',
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.websiteName}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'viewCount',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Views" />,
      cell: ({ row }) => <span className="text-sm">{row.original.viewCount.toLocaleString()}</span>,
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
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => router.push(`/cms/websites/${row.original.websiteId}/content`)}>
              Open in site
            </DropdownMenuItem>
            {row.original.status !== 'published' && (
              <DropdownMenuItem onClick={() => publish({ websiteId: row.original.websiteId, id: row.original.id })}>
                <Globe className="mr-2 h-4 w-4" />
                Publish
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Posts"
        description="Manage blog posts and articles"
        actions={
          <Button size="sm" onClick={() => router.push('/cms/websites')}>
            <Plus className="mr-2 h-4 w-4" />
            New Post
          </Button>
        }
      />
      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        searchColumn="title"
        searchPlaceholder="Search posts..."
        totalCount={data?.pagination.total}
        page={page}
        onPageChange={setPage}
        filters={
          <Select value={statusFilter || 'all'} onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}>
            <SelectTrigger className="h-8 w-32"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
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
