'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import type { ColumnDef } from '@tanstack/react-table';
import { ArrowLeft, CheckCircle, XCircle, Clock } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/data-table/DataTable';
import DataTableColumnHeader from '@/components/data-table/DataTableColumnHeader';
import ContentWorkflowBadge from '@/components/cms/ContentWorkflowBadge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  useWorkflowApprovals,
  useWorkflowStats,
  useApproveRequest,
  useRejectRequest,
} from '@/lib/queries/cms-workflow.queries';
import { useWebsite } from '@/lib/queries/cms-websites.queries';
import { useUIStore } from '@/lib/store/uiStore';
import { formatDateTime } from '@/lib/utils/format';
import type { WorkflowApprovalRequest } from '@/lib/types/cms-workflow.types';

export default function WebsiteWorkflowsPage({
  params,
}: {
  params: Promise<{ websiteId: string }>;
}) {
  const { websiteId } = use(params);
  const { setBreadcrumbs } = useUIStore();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected' | ''>('pending');
  const [rejectTarget, setRejectTarget] = useState<{ id: string; title: string } | null>(null);
  const [rejectNote, setRejectNote] = useState('');

  const { data: website } = useWebsite(websiteId);
  const { data, isLoading } = useWorkflowApprovals({
    websiteId,
    status: statusFilter || undefined,
    page,
    limit: 20,
  });
  const { data: stats } = useWorkflowStats(websiteId);
  const { mutate: approve, isPending: approving } = useApproveRequest();
  const { mutate: reject, isPending: rejecting } = useRejectRequest();

  useEffect(() => {
    setBreadcrumbs([
      { label: 'CMS', href: '/cms' },
      { label: website?.name ?? '...', href: `/cms/websites/${websiteId}` },
      { label: 'Workflows' },
    ]);
  }, [website, setBreadcrumbs, websiteId]);

  const columns: ColumnDef<WorkflowApprovalRequest>[] = [
    {
      accessorKey: 'contentTitle',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Content" />,
      cell: ({ row }) => (
        <div>
          <Link
            href={`/cms/websites/${websiteId}/content/${row.original.contentId}`}
            className="text-sm font-medium hover:underline"
          >
            {row.original.contentTitle}
          </Link>
          <p className="text-xs text-muted-foreground capitalize">
            {row.original.contentType.replace(/_/g, ' ')}
          </p>
        </div>
      ),
    },
    {
      id: 'transition',
      header: 'Transition',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <ContentWorkflowBadge status={row.original.fromStatus} />
          <span className="text-muted-foreground text-xs">→</span>
          <ContentWorkflowBadge status={row.original.toStatus} />
        </div>
      ),
    },
    {
      accessorKey: 'requestedBy',
      header: 'Requested By',
      cell: ({ row }) => (
        <span className="text-sm">{row.original.requestedBy.fullName}</span>
      ),
    },
    {
      accessorKey: 'requestedAt',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Requested" />,
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {formatDateTime(row.original.requestedAt)}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const s = row.original.status;
        return (
          <Badge
            variant={s === 'pending' ? 'default' : s === 'approved' ? 'outline' : 'destructive'}
            className="text-xs capitalize"
          >
            {s}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const req = row.original;
        if (req.status !== 'pending') return null;
        return (
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1 border-green-200 text-green-700 hover:bg-green-50"
              disabled={approving}
              onClick={() => approve({ id: req.id })}
            >
              <CheckCircle className="h-3.5 w-3.5" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1 border-destructive/20 text-destructive hover:bg-destructive/5"
              onClick={() => { setRejectTarget({ id: req.id, title: req.contentTitle }); setRejectNote(''); }}
            >
              <XCircle className="h-3.5 w-3.5" />
              Reject
            </Button>
          </div>
        );
      },
    },
  ];

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
          title="Workflows"
          description="Manage content approval requests"
        />
      </div>

      {stats && (
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-yellow-500" />
            <strong>{stats.pending}</strong> pending
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <strong>{stats.published}</strong> published
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-4 w-4 rounded-full bg-purple-400" />
            <strong>{stats.scheduled}</strong> scheduled
          </span>
        </div>
      )}

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        totalCount={data?.pagination.total}
        page={page}
        onPageChange={setPage}
        filters={
          <Select
            value={statusFilter || 'all'}
            onValueChange={(v) => setStatusFilter((v === 'all' ? '' : v) as typeof statusFilter)}
          >
            <SelectTrigger className="h-8 w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      {/* Reject dialog */}
      <Dialog open={!!rejectTarget} onOpenChange={(o) => !o && setRejectTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Reject Request</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Rejecting: <strong>{rejectTarget?.title}</strong>
          </p>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Reason (required)</label>
            <textarea
              className="w-full resize-none rounded-md border bg-background px-3 py-2 text-xs min-h-[80px] focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Explain what changes are needed..."
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setRejectTarget(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={rejecting || !rejectNote.trim()}
              onClick={() =>
                reject(
                  { id: rejectTarget!.id, note: rejectNote },
                  { onSuccess: () => setRejectTarget(null) }
                )
              }
            >
              {rejecting ? 'Rejecting...' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
