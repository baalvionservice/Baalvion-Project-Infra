'use client';

import { useState, useEffect } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/data-table/DataTable';
import DataTableColumnHeader from '@/components/data-table/DataTableColumnHeader';
import ContentWorkflowBadge from '@/components/cms/ContentWorkflowBadge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  useWorkflowApprovals,
  useApproveRequest,
  useRejectRequest,
} from '@/lib/queries/cms-workflow.queries';
import { useUIStore } from '@/lib/store/uiStore';
import { formatDateTime } from '@/lib/utils/format';
import type { WorkflowApprovalRequest } from '@/lib/types/cms-workflow.types';

export default function GlobalWorkflowsPage() {
  const { setBreadcrumbs } = useUIStore();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected' | ''>('pending');
  const [rejectTarget, setRejectTarget] = useState<{ id: string; title: string } | null>(null);
  const [rejectNote, setRejectNote] = useState('');

  const { data, isLoading } = useWorkflowApprovals({
    status: statusFilter || undefined,
    page,
    limit: 20,
  });
  const { mutate: approve, isPending: approving } = useApproveRequest();
  const { mutate: reject, isPending: rejecting } = useRejectRequest();

  useEffect(() => {
    setBreadcrumbs([{ label: 'CMS', href: '/cms' }, { label: 'Workflows' }]);
  }, [setBreadcrumbs]);

  const columns: ColumnDef<WorkflowApprovalRequest>[] = [
    {
      accessorKey: 'contentTitle',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Content" />,
      cell: ({ row }) => (
        <div>
          <Link
            href={`/cms/websites/${row.original.websiteId}/content/${row.original.contentId}`}
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
      accessorKey: 'websiteName',
      header: 'Website',
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs">
          {row.original.websiteName}
        </Badge>
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
      header: 'Author',
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
      cell: ({ row }) => (
        <Badge
          variant={
            row.original.status === 'pending'
              ? 'default'
              : row.original.status === 'approved'
              ? 'outline'
              : 'destructive'
          }
          className="text-xs capitalize"
        >
          {row.original.status}
        </Badge>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        if (row.original.status !== 'pending') return null;
        const req = row.original;
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
              onClick={() => {
                setRejectTarget({ id: req.id, title: req.contentTitle });
                setRejectNote('');
              }}
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
      <PageHeader
        title="Global Workflows"
        description="Review and approve content submissions across all websites"
      />

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        searchColumn="contentTitle"
        searchPlaceholder="Search content..."
        totalCount={data?.pagination.total}
        page={page}
        onPageChange={setPage}
        filters={
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
          >
            <SelectTrigger className="h-8 w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="">All</SelectItem>
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
