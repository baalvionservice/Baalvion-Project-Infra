'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { ColumnDef } from '@tanstack/react-table';
import { Plus, MoreHorizontal, Copy, Trash2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/data-table/DataTable';
import DataTableColumnHeader from '@/components/data-table/DataTableColumnHeader';
import ContentWorkflowBadge from '@/components/cms/ContentWorkflowBadge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useContentList, useCreateContent, useDeleteContent, useDuplicateContent } from '@/lib/queries/cms-content.queries';
import { useWebsite } from '@/lib/queries/cms-websites.queries';
import { useUIStore } from '@/lib/store/uiStore';
import { formatDate } from '@/lib/utils/format';
import type { ContentItem, ContentItemType, ContentWorkflowStatus } from '@/lib/types/cms-content.types';

export default function WebsiteContentPage({
  params,
}: {
  params: Promise<{ websiteId: string }>;
}) {
  const { websiteId } = use(params);
  const router = useRouter();
  const { setBreadcrumbs } = useUIStore();
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<ContentItemType | ''>('');
  const [statusFilter, setStatusFilter] = useState<ContentWorkflowStatus | ''>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<ContentItemType>('post');

  const { data: website } = useWebsite(websiteId);
  const { data, isLoading } = useContentList({
    websiteId,
    page,
    limit: 20,
    type: typeFilter || undefined,
    status: statusFilter || undefined,
  });
  const { mutate: create, isPending: isCreating } = useCreateContent();
  const { mutate: remove } = useDeleteContent();
  const { mutate: duplicate } = useDuplicateContent();

  useEffect(() => {
    setBreadcrumbs([
      { label: 'CMS', href: '/cms' },
      { label: website?.name ?? '...', href: `/cms/websites/${websiteId}` },
      { label: 'Content' },
    ]);
  }, [website, setBreadcrumbs, websiteId]);

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    create(
      {
        websiteId,
        type: newType,
        title: newTitle,
        slug: newTitle.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      },
      {
        onSuccess: (res) => {
          setCreateOpen(false);
          setNewTitle('');
          router.push(`/cms/websites/${websiteId}/content/${res.data.data.id}`);
        },
      }
    );
  };

  const columns: ColumnDef<ContentItem>[] = [
    {
      accessorKey: 'title',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Title" />,
      cell: ({ row }) => (
        <div>
          <p className="text-sm font-medium">{row.original.title}</p>
          <p className="text-xs text-muted-foreground">/{row.original.slug}</p>
        </div>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs capitalize">
          {row.original.type.replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <ContentWorkflowBadge status={row.original.status} />,
    },
    {
      accessorKey: 'author',
      header: 'Author',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.author.fullName}</span>
      ),
    },
    {
      accessorKey: 'updatedAt',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Updated" />,
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">{formatDate(row.original.updatedAt)}</span>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const item = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => router.push(`/cms/websites/${websiteId}/content/${item.id}`)}
              >
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => duplicate(item.id)}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => remove(item.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const CONTENT_TYPES: ContentItemType[] = [
    'page', 'post', 'article', 'news', 'doc', 'event', 'job_listing', 'portfolio_item',
  ];
  const enabledTypes = website?.modules
    ? CONTENT_TYPES.filter((t) => {
        if (t === 'page') return website.modules.includes('pages');
        if (t === 'post' || t === 'article') return website.modules.includes('blog');
        if (t === 'news') return website.modules.includes('news');
        if (t === 'doc') return website.modules.includes('docs');
        if (t === 'event') return website.modules.includes('events');
        if (t === 'job_listing') return website.modules.includes('jobs');
        if (t === 'portfolio_item') return website.modules.includes('portfolio');
        return true;
      })
    : CONTENT_TYPES;

  return (
    <div className="space-y-4">
      <div>
        <Button variant="ghost" size="sm" className="-ml-2 mb-2" asChild>
          <Link href={`/cms/websites/${websiteId}`}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            {website?.name ?? 'Website'}
          </Link>
        </Button>
        <PageHeader
          title="Content"
          description={`${data?.pagination.total ?? 0} items`}
          actions={
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Content
            </Button>
          }
        />
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        searchColumn="title"
        searchPlaceholder="Search content..."
        totalCount={data?.pagination.total}
        page={page}
        onPageChange={setPage}
        filters={
          <div className="flex gap-2">
            <Select
              value={typeFilter}
              onValueChange={(v) => setTypeFilter(v as ContentItemType | '')}
            >
              <SelectTrigger className="h-8 w-32">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                {enabledTypes.map((t) => (
                  <SelectItem key={t} value={t} className="capitalize">
                    {t.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as ContentWorkflowStatus | '')}
            >
              <SelectTrigger className="h-8 w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending_review">Pending Review</SelectItem>
                <SelectItem value="changes_requested">Changes Requested</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={(o) => !o && setCreateOpen(false)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>New Content</DialogTitle>
            <DialogDescription>Create a new content item for {website?.name}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Type</Label>
              <Select
                value={newType}
                onValueChange={(v) => setNewType(v as ContentItemType)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {enabledTypes.map((t) => (
                    <SelectItem key={t} value={t} className="capitalize text-xs">
                      {t.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Title</Label>
              <Input
                className="h-8 text-xs"
                placeholder="Untitled"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreate} disabled={isCreating || !newTitle.trim()}>
              {isCreating ? 'Creating...' : 'Create & Edit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
