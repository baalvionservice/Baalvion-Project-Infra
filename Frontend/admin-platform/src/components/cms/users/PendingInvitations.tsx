'use client';

import { useState } from 'react';
import { Mail, RotateCw, Ban, Clock } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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
import { cn } from '@/lib/utils/cn';
import { formatRelative } from '@/lib/utils/format';
import UserRoleBadge from './UserRoleBadge';
import {
  useWebsiteInvitations,
  useRevokeInvitation,
  useResendInvitation,
} from '@/lib/queries/cms-websites.queries';
import type { InvitationStatus, WebsiteInvitation } from '@/lib/types/cms-website.types';

interface Props {
  websiteId: string;
  canManage: boolean;
}

const STATUS_TONE: Record<InvitationStatus, string> = {
  pending: 'text-amber-500',
  accepted: 'text-green-500',
  expired: 'text-muted-foreground',
  revoked: 'text-muted-foreground line-through',
};

const STATUS_LABEL: Record<InvitationStatus, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  expired: 'Expired',
  revoked: 'Revoked',
};

export default function PendingInvitations({ websiteId, canManage }: Props) {
  const { data: invitations, isLoading } = useWebsiteInvitations(websiteId);
  const revoke = useRevokeInvitation(websiteId);
  const resend = useResendInvitation(websiteId);
  const [revokeTarget, setRevokeTarget] = useState<WebsiteInvitation | null>(null);

  // Accepted invitations already show up as members in the table above — this
  // panel is for seats still awaiting a reply (or that need a nudge/cleanup).
  const outstanding = (invitations ?? []).filter((inv) => inv.status !== 'accepted');

  if (!canManage) return null;
  if (!isLoading && outstanding.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Mail className="h-4 w-4 text-muted-foreground" />
          Pending Invitations
          {outstanding.length > 0 && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              {outstanding.length}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden sm:table-cell">Sent</TableHead>
              <TableHead className="w-32" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              outstanding.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="text-sm">
                    <div className="font-medium">{inv.email}</div>
                    {inv.personalNote && (
                      <div className="max-w-xs truncate text-xs text-muted-foreground" title={inv.personalNote}>
                        &ldquo;{inv.personalNote}&rdquo;
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <UserRoleBadge role={inv.role} />
                  </TableCell>
                  <TableCell>
                    <span className={cn('flex items-center gap-1.5 text-xs font-medium', STATUS_TONE[inv.status])}>
                      <span className={cn('h-1.5 w-1.5 rounded-full', 'bg-current')} />
                      {STATUS_LABEL[inv.status]}
                    </span>
                  </TableCell>
                  <TableCell className="hidden text-xs text-muted-foreground sm:table-cell">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatRelative(inv.createdAt)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {(inv.status === 'pending' || inv.status === 'expired') && (
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          title="Resend invitation"
                          disabled={resend.isPending}
                          onClick={() => resend.mutate(inv.id)}
                        >
                          <RotateCw className="h-3.5 w-3.5" />
                        </Button>
                        {inv.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            title="Revoke invitation"
                            onClick={() => setRevokeTarget(inv)}
                          >
                            <Ban className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>

      <AlertDialog open={!!revokeTarget} onOpenChange={(v) => !v && setRevokeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke invitation to {revokeTarget?.email}?</AlertDialogTitle>
            <AlertDialogDescription>
              Their invitation link will stop working immediately. You can always send a fresh
              invite later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => {
                if (revokeTarget) revoke.mutate(revokeTarget.id);
                setRevokeTarget(null);
              }}
            >
              Revoke
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
