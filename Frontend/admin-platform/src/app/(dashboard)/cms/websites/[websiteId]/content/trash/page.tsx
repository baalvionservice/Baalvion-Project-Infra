'use client';

import { use, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { ArrowLeft, Undo2, Flame } from 'lucide-react';
import Link from 'next/link';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/data-table/DataTable';
import DataTableColumnHeader from '@/components/data-table/DataTableColumnHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { useWebsite } from '@/lib/queries/cms-websites.queries';
import { useCmsPermissions } from '@/lib/queries/cms-permissions.queries';
import { useTrashList, useRestoreContent, usePermanentlyDeleteContent } from '@/lib/queries/cms-content.queries';
import { formatDate } from '@/lib/utils/format';
import type { ContentItem } from '@/lib/types/cms-content.types';

// Everything content-list Delete moves here instead of removing — see contentService's
// deleteContent (paranoid: true model, sets deleted_at). Nothing on this page has been
// hard-removed from the database yet; "Delete Forever" below is the one action that is.
export default function TrashPage({ params }: { params: Promise<{ websiteId: string }> }) {
  const { websiteId } = use(params);
  const { data: website } = useWebsite(websiteId);
  const permissions = useCmsPermissions(websiteId);
  const [page, setPage] = useState(1);
  const { data, isLoading } = useTrashList(websiteId, { page, limit: 20 });
  const { mutate: restore, isPending: isRestoring } = useRestoreContent();
  const { mutate: permanentlyDelete, isPending: isPurging } = usePermanentlyDeleteContent();
  const [confirmPurgeFor, setConfirmPurgeFor] = useState<ContentItem | null>(null);

  const columns: ColumnDef<ContentItem>[] = [
    {
      accessorKey: 'title',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Title" />,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.title}</span>
          <span className="text-xs text-muted-foreground">{row.original.slug}</span>
        </div>
      ),
    },
    {
      accessorKey: 'type',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
      cell: ({ row }) => <Badge variant="outline" className="capitalize">{row.original.type.replace(/_/g, ' ')}</Badge>,
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status before delete" />,
      cell: ({ row }) => <Badge variant="secondary" className="capitalize">{row.original.status.replace(/_/g, ' ')}</Badge>,
    },
    {
      accessorKey: 'deletedAt',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Deleted" />,
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.original.deletedAt ? formatDate(row.original.deletedAt) : '—'}
        </span>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" disabled={isRestoring} onClick={() => restore(item.id)}>
              <Undo2 className="mr-1.5 h-3.5 w-3.5" />
              Restore
            </Button>
            {/* Backend gates this at cms_admin (requireCmsRole('cms_admin')) — hidden rather
                than shown-and-403ing for anyone below that, since this is the one truly
                irreversible action on the page. */}
            {permissions.isManager && (
              <Button
                size="sm"
                variant="outline"
                className="text-destructive"
                disabled={isPurging}
                onClick={() => setConfirmPurgeFor(item)}
              >
                <Flame className="mr-1.5 h-3.5 w-3.5" />
                Delete Forever
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <Button variant="ghost" size="sm" className="-ml-2 mb-2" asChild>
          <Link href={`/cms/websites/${websiteId}/content`}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Content
          </Link>
        </Button>
        <PageHeader
          title="Trash"
          description={
            isLoading
              ? 'Loading…'
              : `${data?.pagination.total ?? 0} deleted item${data?.pagination.total === 1 ? '' : 's'} for ${website?.name ?? 'this website'} — restorable until permanently deleted`
          }
        />
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        totalCount={data?.pagination.total}
        page={page}
        onPageChange={setPage}
      />

      <AlertDialog open={!!confirmPurgeFor} onOpenChange={(o) => !o && setConfirmPurgeFor(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently delete &quot;{confirmPurgeFor?.title}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone — the item is removed from the database entirely, not just
              hidden. There is no further recovery step after this one.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (confirmPurgeFor) permanentlyDelete(confirmPurgeFor.id);
                setConfirmPurgeFor(null);
              }}
            >
              Delete Forever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
