'use client';

import { useState } from 'react';
import { Mail, MailWarning, RotateCw, X } from 'lucide-react';
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
import {
  useWebsiteInvitations,
  useResendWebsiteInvitation,
  useRevokeWebsiteInvitation,
} from '@/lib/queries/cms-websites.queries';
import UserRoleBadge from './UserRoleBadge';
import type { InvitationStatus, WebsiteInvitation } from '@/lib/types/cms-website.types';

interface Props {
  websiteId: string;
  canManage: boolean;
}

const STATUS_TONE: Record<InvitationStatus, string> = {
  pending: 'text-amber-500',
  accepted: 'text-green-500',
  expired: 'text-muted-foreground',
  revoked: 'text-muted-foreground',
};

const STATUS_LABEL: Record<InvitationStatus, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  expired: 'Expired',
  revoked: 'Revoked',
};

export default function PendingInvitations({ websiteId, canManage }: Props) {
  const { data: invitations, isLoading } = useWebsiteInvitations(websiteId);
  const resend = useResendWebsiteInvitation(websiteId);
  const revoke = useRevokeWebsiteInvitation(websiteId);
  const [revokeTarget, setRevokeTarget] = useState<WebsiteInvitation | null>(null);

  // Accepted invitations already show up as members — only the still-relevant
  // statuses are worth a permanent row on this page.
  const relevant = (invitations ?? []).filter((i) => i.status !== 'accepted');

  if (!canManage || isLoading || relevant.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Pending Invitations</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden sm:table-cell">Invited</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {relevant.map((inv) => (
              <TableRow key={inv.id}>
                <TableCell className="text-sm">{inv.email}</TableCell>
                <TableCell>
                  <UserRoleBadge role={inv.role} />
                </TableCell>
                <TableCell>
                  <span className={cn('flex items-center gap-1.5 text-xs font-medium', STATUS_TONE[inv.status])}>
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {STATUS_LABEL[inv.status]}
                  </span>
                </TableCell>
                <TableCell className="hidden text-xs text-muted-foreground sm:table-cell">
                  {formatRelative(inv.createdAt)}
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
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        title="Revoke invitation"
                        onClick={() => setRevokeTarget(inv)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      <p className="flex items-center gap-1.5 px-4 pb-3 text-[11px] text-muted-foreground">
        {relevant.some((i) => i.status === 'pending') ? (
          <>
            <Mail className="h-3 w-3" /> Pending invites are emailed accept links — if someone says
            they never got one, resend it here rather than re-inviting.
          </>
        ) : (
          <>
            <MailWarning className="h-3 w-3" /> Expired invites can be resent with a fresh link.
          </>
        )}
      </p>

      <AlertDialog open={!!revokeTarget} onOpenChange={(v) => !v && setRevokeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke invitation to {revokeTarget?.email}?</AlertDialogTitle>
            <AlertDialogDescription>
              Their invite link stops working immediately. You can invite them again later if needed.
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
