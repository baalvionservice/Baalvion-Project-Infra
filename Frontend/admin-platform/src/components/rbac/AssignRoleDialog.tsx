'use client';

import { useEffect, useState } from 'react';
import { Loader2, UserPlus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import UserPicker from './UserPicker';
import { useAssignRbacRole } from '@/lib/queries/rbac.queries';
import type { RbacRole } from '@/lib/types/rbac.types';
import type { AdminUser } from '@/lib/types/user.types';

interface AssignRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scopeId: string;       // country code OR storeId — the RBAC scope_id the role is granted at
  scopeLabel: string;    // human label for the scope (e.g. "United Arab Emirates" / store name)
  roleOptions: RbacRole[]; // assignable roles for this scope
}

/** Assigns a user a role at a scope — purely via RBAC POST /v1/assignments. */
export default function AssignRoleDialog({ open, onOpenChange, scopeId, scopeLabel, roleOptions }: AssignRoleDialogProps) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [roleId, setRoleId] = useState<string>('');
  const assign = useAssignRbacRole();

  useEffect(() => {
    if (open) {
      setUser(null);
      setRoleId(roleOptions.length === 1 ? roleOptions[0].id : '');
    }
  }, [open, roleOptions]);

  const canSubmit = !!user && !!roleId && !assign.isPending;

  const handleAssign = async () => {
    if (!user || !roleId) return;
    try {
      await assign.mutateAsync({ userId: String(user.id), roleId, scopeId });
      onOpenChange(false);
    } catch {
      /* error toast handled by the mutation hook; keep the dialog open to retry */
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign a role</DialogTitle>
          <DialogDescription>
            Grant a user a role in <span className="font-medium text-foreground">{scopeLabel}</span>. This is
            recorded in RBAC and enforced by the backend.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <UserPicker selected={user} onSelect={setUser} />

          {roleOptions.length > 1 && (
            <div className="space-y-1.5">
              <label htmlFor="assign-role-select" className="text-sm font-medium">Role</label>
              <Select value={roleId} onValueChange={setRoleId}>
                <SelectTrigger id="assign-role-select">
                  <SelectValue placeholder="Choose a role…" />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {roleOptions.length === 1 && (
            <p className="text-sm text-muted-foreground">
              Role: <span className="font-medium text-foreground">{roleOptions[0].name}</span>
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={assign.isPending}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={!canSubmit}>
            {assign.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
            Assign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
