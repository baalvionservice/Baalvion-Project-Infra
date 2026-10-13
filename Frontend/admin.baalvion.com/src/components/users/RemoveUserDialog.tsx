'use client';

import { useEffect, useState } from 'react';
import { UserMinus } from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useRemoveUser } from '@/lib/queries/users.queries';

interface Props {
  user: { id: number; fullName: string; email: string } | null;
  onOpenChange: (open: boolean) => void;
  onRemoved?: () => void;
}

// Removing is reversible (Users > Removed users > Restore) and keeps every record, so this asks
// for a reason rather than a typed confirmation — the reason is what the audit trail shows later.
export default function RemoveUserDialog({ user, onOpenChange, onRemoved }: Props) {
  const [reason, setReason] = useState('');
  const { mutate, isPending } = useRemoveUser();

  useEffect(() => { if (user) setReason(''); }, [user]);

  return (
    <Dialog open={!!user} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserMinus className="h-5 w-5 text-destructive" /> Remove {user?.fullName || user?.email}?
          </DialogTitle>
          <DialogDescription>
            This takes effect straight away and can be undone later from Removed users.
          </DialogDescription>
        </DialogHeader>
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>They are signed out everywhere and cannot sign in again.</li>
          <li>Their access to every website and business area is taken away.</li>
          <li>They disappear from the Users list. Their history is kept.</li>
        </ul>
        <div className="space-y-1.5">
          <Label htmlFor="remove-reason">Reason (shown in the removal record)</Label>
          <Textarea id="remove-reason" rows={3} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Left the company, contract ended" />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Cancel</Button>
          <Button
            variant="destructive"
            disabled={isPending || !user}
            onClick={() => user && mutate({ id: user.id, reason: reason.trim() || undefined }, { onSuccess: () => { onOpenChange(false); onRemoved?.(); } })}
          >
            {isPending ? 'Removing…' : 'Remove user'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
