'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { ColumnDef } from '@tanstack/react-table';
import { CheckCircle, XCircle } from 'lucide-react';
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
import { formatDateTime } from '@/lib/utils/format';
import type { WorkflowApprovalRequest } from '@/lib/types/cms-workflow.types';

interface Props {
  websiteId: string;
  canonicalId: string;
  canReview: boolean;
}

export default function ApprovalQueue({ websiteId, canonicalId, canReview }: Props) {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected' | ''>('pending');
  const [rejectTarget, setRejectTarget] = useState<{ id: string; title: string } | null>(null);
  const [rejectNote, setRejectNote] = useState('');

  const { data, isLoading } = useWorkflowApprovals({
    websiteId: canonicalId,
    status: statusFilter || undefined,
    page,
    limit: 20,
  });
  const { mutate: approve, isPending: approving } = useApproveRequest();
  const { mutate: reject, isPending: rejecting } = useRejectRequest();

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
          <p className="text-xs capitalize text-muted-foreground">
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
          <span className="text-xs text-muted-foreground">→</span>
          <ContentWorkflowBadge status={row.original.toStatus} />
        </div>
      ),
    },
    {
      accessorKey: 'requestedBy',
      header: 'Requested By',
      cell: ({ row }) => <span className="text-sm">{row.original.requestedBy.fullName}</span>,
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
        if (req.status !== 'pending' || !canReview) return null;
        return (
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              className="h-7 gap-1 border-green-500/30 text-xs text-green-600 hover:bg-green-500/10"
              disabled={approving}
              onClick={() => approve({ id: req.id })}
            >
              <CheckCircle className="h-3.5 w-3.5" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 gap-1 border-destructive/20 text-xs text-destructive hover:bg-destructive/5"
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
    <>
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
              className="min-h-[80px] w-full resize-none rounded-md border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
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
                reject({ id: rejectTarget!.id, note: rejectNote }, { onSuccess: () => setRejectTarget(null) })
              }
            >
              {rejecting ? 'Rejecting...' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
