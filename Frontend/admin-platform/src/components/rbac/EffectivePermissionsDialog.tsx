'use client';

import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useRbacUserEffective } from '@/lib/queries/rbac.queries';

interface EffectivePermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
  userLabel: string;
}

/** Read-only view of a user's effective access, derived entirely from RBAC. */
export default function EffectivePermissionsDialog({ open, onOpenChange, userId, userLabel }: EffectivePermissionsDialogProps) {
  const { data, isLoading } = useRbacUserEffective(open && userId ? userId : undefined);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Effective permissions</DialogTitle>
          <DialogDescription>
            Read-only, derived from RBAC for <span className="font-medium text-foreground">{userLabel}</span>.
          </DialogDescription>
        </DialogHeader>

        {isLoading || !data ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…
          </div>
        ) : (
          <div className="space-y-5 max-h-[60vh] overflow-y-auto">
            <section>
              <h4 className="mb-2 text-sm font-semibold">Roles</h4>
              {data.roles.length === 0 ? (
                <p className="text-sm text-muted-foreground">No active roles.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {data.roles.map((role) => (
                    <Badge key={role} variant="secondary">{role}</Badge>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h4 className="mb-2 text-sm font-semibold">Access by scope</h4>
              {Object.keys(data.perScope).length === 0 ? (
                <p className="text-sm text-muted-foreground">No scoped grants.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Scope</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Roles</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(data.perScope).map(([scopeId, info]) => (
                      <TableRow key={scopeId}>
                        <TableCell className="font-mono text-xs">{scopeId === '*' ? 'platform (*)' : scopeId}</TableCell>
                        <TableCell>{info.scopeType}</TableCell>
                        <TableCell>{info.roles.join(', ')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </section>

            <section>
              <h4 className="mb-2 text-sm font-semibold">Permissions ({data.permissions.length})</h4>
              {data.permissions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No permissions.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Permission</TableHead>
                      <TableHead>Effect</TableHead>
                      <TableHead>Via role</TableHead>
                      <TableHead>Scope</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.permissions.map((perm) => (
                      <TableRow key={`${perm.key}:${perm.scopeId}:${perm.viaRole}`}>
                        <TableCell className="font-mono text-xs">{perm.key}</TableCell>
                        <TableCell>
                          <Badge variant={perm.effect === 'deny' ? 'destructive' : 'success'}>{perm.effect}</Badge>
                        </TableCell>
                        <TableCell>{perm.viaRole}</TableCell>
                        <TableCell className="font-mono text-xs">{perm.scopeId === '*' ? '*' : perm.scopeId}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
