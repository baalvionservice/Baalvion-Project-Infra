'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { ColumnDef } from '@tanstack/react-table';
import { CheckCircle, XCircle } from 'lucide-react';
import DataTable from '@/components/data-table/DataTable';
import DataTableColumnHeader from '@/components/data-table/DataTableColumnHeader';
import { Button } from '@/components/ui/button';
import { usePendingComments, useModerateComment } from '@/lib/queries/cms-engagement.queries';
import { formatDateTime } from '@/lib/utils/format';
import type { PendingComment } from '@/lib/types/cms-engagement.types';

interface Props {
  websiteId: string;
  canonicalId: string;
  canReview: boolean;
}

/**
 * Every reader comment starts 'pending' on submit (see ArticleComments.tsx on
 * the public site) -- this is the only place one ever becomes visible. Nothing
 * here is auto-approved.
 */
export default function CommentModerationQueue({ websiteId, canonicalId, canReview }: Props) {
  const [page, setPage] = useState(1);

  const { data, isLoading } = usePendingComments(canonicalId, { page, limit: 20 });
  const { mutate: moderate, isPending: moderating } = useModerateComment(canonicalId);

  const columns: ColumnDef<PendingComment>[] = [
    {
      accessorKey: 'content',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Article" />,
      cell: ({ row }) => (
        <Link
          href={`/cms/websites/${websiteId}/content/${row.original.content.id}`}
          className="text-sm font-medium hover:underline"
        >
          {row.original.content.title}
        </Link>
      ),
    },
    {
      accessorKey: 'authorName',
      header: 'From',
      cell: ({ row }) => (
        <div>
          <p className="text-sm">{row.original.authorName}</p>
          <p className="text-xs text-muted-foreground">{row.original.authorEmail}</p>
        </div>
      ),
    },
    {
      accessorKey: 'body',
      header: 'Comment',
      cell: ({ row }) => (
        <p className="max-w-md truncate text-sm text-muted-foreground" title={row.original.body}>
          {row.original.body}
        </p>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Submitted" />,
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">{formatDateTime(row.original.createdAt)}</span>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        if (!canReview) return null;
        const comment = row.original;
        return (
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              className="h-7 gap-1 border-green-500/30 text-xs text-green-600 hover:bg-green-500/10"
              disabled={moderating}
              onClick={() => moderate({ commentId: comment.id, status: 'approved' })}
            >
              <CheckCircle className="h-3.5 w-3.5" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 gap-1 border-destructive/20 text-xs text-destructive hover:bg-destructive/5"
              disabled={moderating}
              onClick={() => moderate({ commentId: comment.id, status: 'rejected' })}
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
    <DataTable
      columns={columns}
      data={data?.data ?? []}
      isLoading={isLoading}
      totalCount={data?.pagination.total}
      page={page}
      onPageChange={setPage}
    />
  );
}
