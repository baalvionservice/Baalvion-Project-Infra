'use client';

import { useState } from 'react';
import { Loader2, UserPlus, MoreVertical, ShieldCheck, UserMinus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import EmptyState from '@/components/common/EmptyState';
import AssignRoleDialog from './AssignRoleDialog';
import EffectivePermissionsDialog from './EffectivePermissionsDialog';
import { useUserDirectory } from './useUserDirectory';
import { useRbacAssignmentsByScope, useRevokeRbacAssignment } from '@/lib/queries/rbac.queries';
import type { RbacRole, RbacAssignment } from '@/lib/types/rbac.types';

interface ScopeTeamPanelProps {
  scopeId: string;
  scopeLabel: string;
  roleOptions: RbacRole[]; // the roles assignable/visible at this scope
  title: string;
  description?: string;
}

/**
 * Lists the team at an RBAC scope (country code or storeId), restricted to roleOptions, and
 * lets a scope-admin assign/revoke + inspect effective permissions — all via RBAC APIs only.
 */
export default function ScopeTeamPanel({ scopeId, scopeLabel, roleOptions, title, description }: ScopeTeamPanelProps) {
  const roleKeys = new Set(roleOptions.map((r) => r.key));
  const { data: assignments, isLoading } = useRbacAssignmentsByScope(scopeId);
  const { resolve } = useUserDirectory();
  const revoke = useRevokeRbacAssignment(scopeId);

  const [assignOpen, setAssignOpen] = useState(false);
  const [effectiveFor, setEffectiveFor] = useState<{ userId: string; label: string } | null>(null);

  const rows = (assignments ?? []).filter((a) => a.role && roleKeys.has(a.role.key));
  const rolesReady = roleOptions.length > 0;

  const labelFor = (a: RbacAssignment): string => {
    const user = resolve(a.userId);
    return user ? user.fullName || user.email : `User #${a.userId}`;
  };

  const handleRevoke = (a: RbacAssignment) => {
    if (typeof window !== 'undefined' && !window.confirm(`Revoke ${a.role?.name ?? 'role'} from ${labelFor(a)}?`)) return;
    revoke.mutate(a.id);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        <Button size="sm" onClick={() => setAssignOpen(true)} disabled={!rolesReady}>
          <UserPlus className="mr-2 h-4 w-4" /> Assign
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {!rolesReady && (
          <p className="px-6 py-3 text-sm text-amber-600">
            Assignable roles aren’t available yet — they’re still loading or not provisioned in RBAC. Run the
            commerce RBAC provisioning script if this persists.
          </p>
        )}
        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading team…
          </div>
        ) : rows.length === 0 ? (
          <div className="p-4">
            <EmptyState icon={ShieldCheck} title="No one assigned yet" description={`Assign a role in ${scopeLabel} to get started.`} />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="w-12 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{labelFor(a)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{a.role?.name ?? a.role?.key}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEffectiveFor({ userId: a.userId, label: labelFor(a) })}>
                          <ShieldCheck className="mr-2 h-4 w-4" /> View effective permissions
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          disabled={revoke.isPending}
                          onClick={() => handleRevoke(a)}
                        >
                          <UserMinus className="mr-2 h-4 w-4" /> Revoke
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <AssignRoleDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        scopeId={scopeId}
        scopeLabel={scopeLabel}
        roleOptions={roleOptions}
      />
      <EffectivePermissionsDialog
        open={!!effectiveFor}
        onOpenChange={(open) => !open && setEffectiveFor(null)}
        userId={effectiveFor?.userId ?? null}
        userLabel={effectiveFor?.label ?? ''}
      />
    </Card>
  );
}
