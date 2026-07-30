'use client';

import { use, useState, useEffect, useRef, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { ColumnDef } from '@tanstack/react-table';
import {
  Plus, MoreHorizontal, Copy, Trash2, ArrowLeft, Upload, Send, Archive, AlertTriangle,
  Newspaper, GraduationCap, LayoutGrid, Loader2, Undo2, Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/data-table/DataTable';
import DataTableColumnHeader from '@/components/data-table/DataTableColumnHeader';
import ContentWorkflowBadge from '@/components/cms/ContentWorkflowBadge';
import ImportContentDialog from '@/components/cms/ImportContentDialog';
import { cmsContentApi } from '@/lib/api/cms-content';
import { cmsWorkflowApi } from '@/lib/api/cms-workflow';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  useContentList,
  useCreateContent,
  useDeleteContent,
  useDuplicateContent,
  useRequestContentDeletion,
  useDismissDeletionRequest,
} from '@/lib/queries/cms-content.queries';
import { useWorkflowTransition } from '@/lib/queries/cms-workflow.queries';
import { useWebsite } from '@/lib/queries/cms-websites.queries';
import { useCmsPermissions } from '@/lib/queries/cms-permissions.queries';
import { useWebsiteCategories } from '@/lib/queries/cms-taxonomy.queries';
import CategoryFilterCombobox from '@/components/cms/CategoryFilterCombobox';
import { useUIStore } from '@/lib/store/uiStore';
import { useCmsStore } from '@/lib/store/cmsStore';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { formatDate } from '@/lib/utils/format';
import type { ContentItem, ContentItemType, ContentWorkflowStatus } from '@/lib/types/cms-content.types';

export default function WebsiteContentPage({
  params,
}: {
  params: Promise<{ websiteId: string }>;
}) {
  const { websiteId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setBreadcrumbs } = useUIStore();
  const setActiveWebsiteId = useCmsStore((s) => s.setActiveWebsiteId);
  const setLastContentListUrl = useCmsStore((s) => s.setLastContentListUrl);
  useEffect(() => { setActiveWebsiteId(websiteId); }, [websiteId, setActiveWebsiteId]);

  // Filters/pagination are seeded from the URL once on mount so a bookmark, refresh,
  // or "back" navigation restores the exact list view instead of resetting to defaults.
  const [page, setPage] = useState(() => Number(searchParams.get('page')) || 1);
  const [search, setSearch] = useState(() => searchParams.get('search') ?? '');
  const debouncedSearch = useDebounce(search, 400);
  const [typeFilter, setTypeFilter] = useState<ContentItemType | ''>(
    () => (searchParams.get('type') as ContentItemType | null) ?? ''
  );
  const [statusFilter, setStatusFilter] = useState<ContentWorkflowStatus | ''>(
    () => (searchParams.get('status') as ContentWorkflowStatus | null) ?? ''
  );
  const [categoryFilter, setCategoryFilter] = useState<string>(
    () => searchParams.get('category') ?? ''
  );
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<ContentItemType>('post');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [deletionRequestFor, setDeletionRequestFor] = useState<ContentItem | null>(null);
  const [deletionNote, setDeletionNote] = useState('');
  // "Select all N matching results" — the DataTable only ever selects rows on the
  // current (server-paginated) page, which makes archiving/deleting hundreds of
  // items require paging through 20 at a time. This flag means "every item matching
  // the current search/type/status/category filters," resolved to real ids lazily
  // (resolveTargetIds, below) only when a bulk action actually runs.
  const [selectAllMatchingMode, setSelectAllMatchingMode] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number } | null>(null);
  const [confirmBulkAction, setConfirmBulkAction] = useState<'archive' | 'delete' | null>(null);

  const { data: website } = useWebsite(websiteId);
  const permissions = useCmsPermissions(websiteId);
  // Flat id → category lookup so results (especially from an unfiltered search across
  // every section) can show which section each row actually lives in.
  const { data: categories } = useWebsiteCategories(websiteId);
  const categoryById = useMemo(
    () => new Map((categories ?? []).map((c) => [c.id, c])),
    [categories],
  );
  const { data, isLoading, isError, refetch } = useContentList({
    websiteId,
    page,
    limit: 20,
    search: debouncedSearch || undefined,
    type: typeFilter || undefined,
    status: statusFilter || undefined,
    categoryId: categoryFilter || undefined,
  });

  // Reset to page 1 whenever the effective search term changes, otherwise a
  // narrower result set can leave the user stranded on a page past the new total.
  // Skip the very first run — debouncedSearch equals the URL-seeded initial value on
  // mount, and resetting then would stomp a restored page (e.g. navigating back).
  const isFirstSearchRun = useRef(true);
  useEffect(() => {
    if (isFirstSearchRun.current) { isFirstSearchRun.current = false; return; }
    setPage(1);
  }, [debouncedSearch]);

  // A "select all matching" only means what it says for the filters it was made
  // under — narrowing/widening the view (or paging) invalidates it, otherwise a
  // bulk action could silently apply to a completely different set than shown.
  useEffect(() => {
    setSelectAllMatchingMode(false);
  }, [debouncedSearch, typeFilter, statusFilter, categoryFilter, page]);

  // Keep the URL (and the "last content list" pointer used by the editor's back
  // link) in sync with the current filters/page, via replace so this doesn't spam
  // browser history — only the initial visit gets a real entry.
  useEffect(() => {
    const qs = new URLSearchParams();
    if (page > 1) qs.set('page', String(page));
    if (debouncedSearch) qs.set('search', debouncedSearch);
    if (typeFilter) qs.set('type', typeFilter);
    if (statusFilter) qs.set('status', statusFilter);
    if (categoryFilter) qs.set('category', categoryFilter);
    const query = qs.toString();
    const url = `/cms/websites/${websiteId}/content${query ? `?${query}` : ''}`;
    router.replace(url, { scroll: false });
    setLastContentListUrl(websiteId, url);
  }, [websiteId, page, debouncedSearch, typeFilter, statusFilter, categoryFilter, router, setLastContentListUrl]);

  const { mutate: create, isPending: isCreating } = useCreateContent();
  const { mutate: remove } = useDeleteContent();
  const { mutate: duplicate } = useDuplicateContent();
  const { mutate: requestDeletion, isPending: isRequestingDeletion } = useRequestContentDeletion();
  const { mutate: dismissDeletionRequest } = useDismissDeletionRequest();
  const { mutate: transitionOne } = useWorkflowTransition();

  // Selection is reported from DataTable during render — only update state when the
  // id set actually changes, otherwise we'd trigger an infinite re-render loop.
  const handleSelection = (rows: ContentItem[]) => {
    const ids = rows.map((r) => r.id);
    setSelectedIds((prev) =>
      prev.length === ids.length && prev.every((v, i) => v === ids[i]) ? prev : ids,
    );
  };

  const chunk = <T,>(arr: T[], size: number): T[][] => {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
  };

  // Resolves the real target ids for a bulk action. Page-level selection is just
  // `selectedIds`; "select all matching" only fetches the full id list (paging
  // through the 100-per-request list endpoint) at the moment an action actually
  // runs, so toggling the banner on/off never fires wasted requests.
  const resolveTargetIds = async (): Promise<string[]> => {
    if (!selectAllMatchingMode) return selectedIds;
    const total = data?.pagination.total ?? 0;
    if (total === 0) return [];
    const limit = 100;
    const pages = Math.ceil(total / limit);
    const ids: string[] = [];
    for (let p = 1; p <= pages; p++) {
      const res = await cmsContentApi.list({
        websiteId,
        page: p,
        limit,
        search: debouncedSearch || undefined,
        type: typeFilter || undefined,
        status: statusFilter || undefined,
        categoryId: categoryFilter || undefined,
      });
      ids.push(...res.data.data.map((item) => item.id));
    }
    return ids;
  };

  const runBulk = async (
    action: 'publish' | 'archive' | 'delete',
    apply: (batch: string[]) => Promise<unknown>,
  ) => {
    setBulkBusy(true);
    try {
      const ids = await resolveTargetIds();
      if (!ids.length) return;
      setBulkProgress({ done: 0, total: ids.length });
      // Batches of 500 keep each request comfortably under the backend's per-call
      // cap (1000) while still turning a 1000-item action into ~2 round trips
      // instead of one-per-item.
      for (const batch of chunk(ids, 500)) {
        await apply(batch);
        setBulkProgress((prev) => (prev ? { ...prev, done: prev.done + batch.length } : null));
      }
      toast.success(
        `${ids.length} item${ids.length === 1 ? '' : 's'} ${action === 'publish' ? 'published' : action === 'archive' ? 'archived' : 'deleted'}`,
      );
      await refetch();
      setSelectedIds([]);
      setSelectAllMatchingMode(false);
    } catch (e) {
      // Backend rejects bulk-delete of anything still published ("archive first")
      // — surfaced verbatim since it tells the editor exactly what to do next.
      toast.error(e instanceof Error ? e.message : 'Bulk action failed');
    } finally {
      setBulkBusy(false);
      setBulkProgress(null);
    }
  };

  // No bulk-publish endpoint on the backend (bulkUpdate only implements
  // archive/delete/assign_category) — this drives the existing per-item workflow
  // transition, with modest concurrency so a large selection doesn't take one
  // sequential round-trip per article.
  const bulkPublish = () =>
    runBulk('publish', async (batch) => {
      for (const idGroup of chunk(batch, 10)) {
        await Promise.all(
          idGroup.map((id) => cmsWorkflowApi.transition({ contentId: id, action: 'publish' }).catch(() => undefined)),
        );
      }
    });
  const bulkArchive = () => runBulk('archive', (batch) => cmsContentApi.bulkUpdateStatus(batch, 'archive'));
  const bulkDelete = () => runBulk('delete', (batch) => cmsContentApi.bulkDelete(batch));

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
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          aria-label="Select all"
          checked={
            table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          aria-label="Select row"
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(!!v)}
          onClick={(e) => e.stopPropagation()}
        />
      ),
      enableSorting: false,
    },
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
      id: 'category',
      header: 'Category',
      cell: ({ row }) => {
        const ids = row.original.categoryIds;
        if (!ids.length) {
          return <span className="text-xs text-muted-foreground">Uncategorized</span>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {ids.map((id) => {
              const category = categoryById.get(id);
              return (
                <Badge
                  key={id}
                  variant="secondary"
                  className="cursor-pointer text-xs"
                  title="Filter the list to this category"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCategoryFilter(id);
                    setPage(1);
                  }}
                >
                  {category?.name ?? 'Unknown'}
                </Badge>
              );
            })}
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <div className="flex flex-wrap items-center gap-1.5">
          <ContentWorkflowBadge status={row.original.status} />
          {row.original.isBreaking && (
            <Badge className="bg-red-500/15 text-red-500 border-red-500/30 text-[10px]">Breaking</Badge>
          )}
          {row.original.isTrending && (
            <Badge className="bg-orange-500/15 text-orange-500 border-orange-500/30 text-[10px]">Trending</Badge>
          )}
          {row.original.isFeatured && (
            <Badge className="bg-amber-500/15 text-amber-500 border-amber-500/30 text-[10px]">Featured</Badge>
          )}
          {row.original.deletionRequestedAt && (
            <Badge
              variant="outline"
              className="gap-1 text-[10px] text-destructive border-destructive/40"
              title={row.original.deletionRequestNote || 'Deletion requested'}
            >
              <AlertTriangle className="h-3 w-3" />
              Deletion requested
            </Badge>
          )}
        </div>
      ),
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
              {/* Archive requires cms_editor (workflowService's TRANSITIONS.archive.requiredLevel
                  is 80, same as delete) — reuse canDelete, the permission flag that already
                  matches that exact gate. Restore only needs cms_author (level 40, same as
                  canEditContent), so it stays available to a wider set of roles. */}
              {item.status !== 'archived' && permissions.canDelete && (
                <DropdownMenuItem onClick={() => transitionOne({ contentId: item.id, action: 'archive' })}>
                  <Archive className="mr-2 h-4 w-4" />
                  Archive
                </DropdownMenuItem>
              )}
              {item.status === 'archived' && permissions.canEditContent && (
                <DropdownMenuItem onClick={() => transitionOne({ contentId: item.id, action: 'restore_to_draft' })}>
                  <Undo2 className="mr-2 h-4 w-4" />
                  Restore to Draft
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {permissions.canDelete ? (
                <>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => remove(item.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                  {item.deletionRequestedAt && (
                    <DropdownMenuItem onClick={() => dismissDeletionRequest(item.id)}>
                      <AlertTriangle className="mr-2 h-4 w-4" />
                      Dismiss deletion request
                    </DropdownMenuItem>
                  )}
                </>
              ) : (
                // Contributor/author roles can't DELETE (backend requires cms_editor+) —
                // this is their alternative, so clicking never just 403s with no path forward.
                <DropdownMenuItem
                  className="text-destructive"
                  disabled={!!item.deletionRequestedAt}
                  onClick={() => { setDeletionNote(''); setDeletionRequestFor(item); }}
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  {item.deletionRequestedAt ? 'Deletion already requested' : 'Request Deletion'}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const CONTENT_TYPES: ContentItemType[] = [
    'page', 'post', 'article', 'news', 'doc', 'event', 'job_listing', 'portfolio_item',
  ];
  // Core types (page/post/article/news/doc) are always offered — every site writes
  // pages and articles, and a stale/incomplete `modules` config must never hide a
  // type that already has real content sitting in it. Only the niche types
  // (events/jobs/portfolio) stay gated behind their module flag.
  const CORE_TYPES: ContentItemType[] = ['page', 'post', 'article', 'news', 'doc'];
  const enabledTypes = website?.modules
    ? CONTENT_TYPES.filter((t) => {
        if (CORE_TYPES.includes(t)) return true;
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
          description={
            isError
              ? 'Failed to load content — check your connection and try again.'
              : isLoading
                ? 'Loading…'
                : `${data?.pagination.total ?? 0} items`
          }
          actions={
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setImportOpen(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Import
              </Button>
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New Content
              </Button>
            </div>
          }
        />
      </div>

      {/* Quick jump between the two buckets editors actually search separately —
          news (dated wire/market articles) vs. the evergreen education guides
          (content type "article") — instead of hunting through the Type dropdown
          every time. "All Content" clears the type filter entirely. */}
      <div className="flex gap-1.5">
        {(
          [
            { key: '', label: 'All Content', icon: LayoutGrid },
            { key: 'news', label: 'News', icon: Newspaper },
            { key: 'article', label: 'Education Guides', icon: GraduationCap },
          ] as const
        ).map(({ key, label, icon: Icon }) => (
          <Button
            key={key || 'all'}
            size="sm"
            variant={typeFilter === key ? 'default' : 'outline'}
            onClick={() => { setTypeFilter(key); setPage(1); }}
          >
            <Icon className="mr-1.5 h-3.5 w-3.5" />
            {label}
          </Button>
        ))}

        {/* Roadmapped, not built yet — shown (not hidden) so editors know it's
            coming rather than wondering why the tool they expect isn't here. */}
        <div className="ml-1 flex items-center gap-1.5 border-l pl-2.5">
          {[
            { label: 'Move to Category' },
            { label: 'Export CSV' },
            { label: 'Saved Views' },
            { label: 'Date Range' },
          ].map(({ label }) => (
            <Button
              key={label}
              size="sm"
              variant="ghost"
              disabled
              className="cursor-not-allowed text-muted-foreground opacity-60"
              title={`${label} — coming soon`}
            >
              {label}
              <Badge variant="outline" className="ml-1.5 gap-1 px-1.5 py-0 text-[9px] font-semibold uppercase tracking-wide">
                <Sparkles className="h-2.5 w-2.5" /> Soon
              </Badge>
            </Button>
          ))}
        </div>
      </div>

      {isError && (
        <div className="flex items-center justify-between rounded-md border border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive">
          <span>Couldn&apos;t load content for this website.</span>
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        searchColumn="title"
        searchPlaceholder="Search content..."
        searchValue={search}
        onSearchChange={setSearch}
        totalCount={data?.pagination.total}
        page={page}
        onPageChange={setPage}
        selectable
        onSelectionChange={handleSelection}
        toolbar={
          selectedIds.length > 0 ? (
            <div className="flex flex-col gap-2">
              {/* Page selection tops out at 20 (the table's page size) — once every
                  row on the page is checked and more results exist, offer the real
                  full-set action instead of forcing 50 pages of manual checkbox work. */}
              {!selectAllMatchingMode &&
                (data?.pagination.total ?? 0) > selectedIds.length &&
                selectedIds.length >= (data?.data.length ?? 0) &&
                (data?.data.length ?? 0) > 0 && (
                  <button
                    type="button"
                    className="text-left text-xs text-primary underline underline-offset-2"
                    onClick={() => setSelectAllMatchingMode(true)}
                  >
                    All {selectedIds.length} on this page selected — select all {data?.pagination.total} matching results instead?
                  </button>
                )}

              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {selectAllMatchingMode ? (data?.pagination.total ?? 0) : selectedIds.length} selected
                  {selectAllMatchingMode && (
                    <button
                      type="button"
                      className="ml-1.5 underline underline-offset-2"
                      onClick={() => setSelectAllMatchingMode(false)}
                    >
                      clear
                    </button>
                  )}
                </span>
                {/* Backend gates: publish needs cms_publisher (level 70) -> canPublish;
                    archive needs cms_editor (level 80) -> the same role floor canDelete
                    already matches. Hiding these for lower roles means the button never
                    just sits there waiting to 403. */}
                {permissions.canPublish && (
                  <Button size="sm" variant="outline" disabled={bulkBusy} onClick={bulkPublish}>
                    <Send className="mr-1.5 h-3.5 w-3.5" /> Publish
                  </Button>
                )}
                {permissions.canDelete && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={bulkBusy}
                    onClick={() => (selectAllMatchingMode ? setConfirmBulkAction('archive') : bulkArchive())}
                  >
                    <Archive className="mr-1.5 h-3.5 w-3.5" /> Archive
                  </Button>
                )}
                {permissions.canDelete && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive"
                    disabled={bulkBusy}
                    onClick={() => setConfirmBulkAction('delete')}
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
                  </Button>
                )}
              </div>

              {bulkProgress && (
                <div className="flex items-center gap-2">
                  <Progress
                    value={(bulkProgress.done / bulkProgress.total) * 100}
                    className="h-1.5 w-40"
                  />
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    {bulkProgress.done}/{bulkProgress.total}
                  </span>
                </div>
              )}
            </div>
          ) : undefined
        }
        filters={
          <div className="flex gap-2">
            <CategoryFilterCombobox
              websiteId={websiteId}
              value={categoryFilter}
              onChange={(id) => {
                setCategoryFilter(id);
                setPage(1);
              }}
            />
            <Select
              value={typeFilter || '__all__'}
              onValueChange={(v) => setTypeFilter(v === '__all__' ? '' : (v as ContentItemType))}
            >
              <SelectTrigger className="h-8 w-32">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Types</SelectItem>
                {enabledTypes.map((t) => (
                  <SelectItem key={t} value={t} className="capitalize">
                    {t.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={statusFilter || '__all__'}
              onValueChange={(v) => setStatusFilter(v === '__all__' ? '' : (v as ContentWorkflowStatus))}
            >
              <SelectTrigger className="h-8 w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Statuses</SelectItem>
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

      {/* Bulk import dialog */}
      <ImportContentDialog
        websiteId={websiteId}
        open={importOpen}
        onOpenChange={setImportOpen}
        onImported={() => refetch()}
      />

      {/* Request deletion dialog — the alternative to Delete for roles below cms_editor */}
      <Dialog open={!!deletionRequestFor} onOpenChange={(o) => !o && setDeletionRequestFor(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Request deletion</DialogTitle>
            <DialogDescription>
              &quot;{deletionRequestFor?.title}&quot; won&apos;t be deleted yet — an editor or admin will
              review your request and remove it, or dismiss the request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label className="text-xs">Reason (optional)</Label>
            <Textarea
              className="text-xs min-h-[80px]"
              placeholder="Why should this be deleted?"
              value={deletionNote}
              onChange={(e) => setDeletionNote(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDeletionRequestFor(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isRequestingDeletion}
              onClick={() => {
                if (!deletionRequestFor) return;
                requestDeletion(
                  { id: deletionRequestFor.id, note: deletionNote.trim() || undefined },
                  { onSuccess: () => setDeletionRequestFor(null) },
                );
              }}
            >
              {isRequestingDeletion ? 'Requesting…' : 'Request Deletion'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm before a "select all matching" bulk action — this can cover far
          more than what's visible on screen, so it gets one explicit checkpoint
          instead of firing straight off the toolbar button. */}
      <AlertDialog open={!!confirmBulkAction} onOpenChange={(o) => !o && setConfirmBulkAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmBulkAction === 'delete' ? 'Delete' : 'Archive'}{' '}
              {selectAllMatchingMode ? (data?.pagination.total ?? 0) : selectedIds.length} items?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmBulkAction === 'delete'
                ? 'This permanently removes every matching item. If any of them are still published, the server rejects the whole action — archive them first, then delete.'
                : 'This takes every matching item off the public site immediately. It stays fully reversible — republish any of them any time.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={confirmBulkAction === 'delete' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : undefined}
              onClick={() => {
                const action = confirmBulkAction;
                setConfirmBulkAction(null);
                if (action === 'delete') bulkDelete();
                else if (action === 'archive') bulkArchive();
              }}
            >
              {confirmBulkAction === 'delete' ? 'Delete' : 'Archive'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
