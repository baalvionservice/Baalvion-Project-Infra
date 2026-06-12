'use client';

import { useMemo, useState } from 'react';
import {
  Users as UsersIcon,
  UserPlus,
  Search,
  MoreHorizontal,
  ShieldCheck,
  KeyRound,
  Ban,
  CircleCheck,
  Trash2,
  Lock,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { formatDate, formatRelative, initials } from '@/lib/utils/format';
import { CMS_ROLE_OPTIONS } from '@/lib/cms/permissions';
import {
  useCmsUsers,
  useSuspendCmsUser,
  useUnsuspendCmsUser,
  useResetCmsUserPassword,
  type CmsUser,
  type CmsUserStatus,
} from '@/lib/queries/cms-users.queries';
import {
  useUpdateWebsiteMemberRole,
  useRemoveWebsiteMember,
} from '@/lib/queries/cms-websites.queries';
import InviteUserDialog from './InviteUserDialog';
import UserRoleBadge from './UserRoleBadge';
import type { CmsRole } from '@/lib/types/cms-website.types';

interface Props {
  websiteId: string;
  canonicalId: string;
}

const STATUS_TONE: Record<CmsUserStatus, string> = {
  active: 'text-green-500',
  suspended: 'text-rose-500',
  pending: 'text-amber-500',
};

function StatCard({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <Card>
      <CardContent className="p-3.5">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className={cn('mt-1 text-2xl font-bold tabular-nums', accent)}>{value}</p>
      </CardContent>
    </Card>
  );
}

export default function UsersManager({ websiteId, canonicalId }: Props) {
  const { users, isLoading, permissions, counts } = useCmsUsers(canonicalId);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [suspendTarget, setSuspendTarget] = useState<CmsUser | null>(null);
  const [removeTarget, setRemoveTarget] = useState<CmsUser | null>(null);

  const updateRole = useUpdateWebsiteMemberRole(websiteId);
  const removeMember = useRemoveWebsiteMember(websiteId);
  const suspendUser = useSuspendCmsUser();
  const unsuspendUser = useUnsuspendCmsUser();
  const resetPassword = useResetCmsUserPassword();

  const canManage = permissions.isManager;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== 'all' && u.cmsRole !== roleFilter) return false;
      if (statusFilter !== 'all' && u.status !== statusFilter) return false;
      if (q && !u.fullName.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [users, search, roleFilter, statusFilter]);

  return (
    <div className="space-y-4">
      {/* Summary metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Users" value={counts.total} />
        <StatCard label="Active" value={counts.active} accent="text-green-500" />
        <StatCard label="Suspended" value={counts.suspended} accent={counts.suspended ? 'text-rose-500' : undefined} />
        <StatCard label="Admins" value={counts.byRole['cms_admin'] ?? 0} accent="text-indigo-400" />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="h-9 pl-8 text-sm"
              placeholder="Search name or email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="h-9 w-[140px] text-xs">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              {CMS_ROLE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-[130px] text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {canManage && (
          <Button size="sm" onClick={() => setInviteOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Invite User
          </Button>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Last Login</TableHead>
                <TableHead className="hidden lg:table-cell">Created</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                    No users match your filters.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((u) => (
                  <TableRow key={u.userId} className={cn(u.status === 'suspended' && 'opacity-60')}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={u.avatarUrl ?? undefined} />
                          <AvatarFallback className="text-[11px]">{initials(u.fullName)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{u.fullName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                      {u.email}
                    </TableCell>
                    <TableCell>
                      {canManage ? (
                        <Select
                          value={u.cmsRole}
                          onValueChange={(v) =>
                            updateRole.mutate({ userId: u.userId, role: v as CmsRole })
                          }
                        >
                          <SelectTrigger className="h-7 w-[140px] border-none bg-transparent px-1 text-xs hover:bg-muted/60 focus:ring-0">
                            <UserRoleBadge role={u.cmsRole} />
                          </SelectTrigger>
                          <SelectContent>
                            {CMS_ROLE_OPTIONS.map((o) => (
                              <SelectItem key={o.value} value={o.value} className="text-xs">
                                {o.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <UserRoleBadge role={u.cmsRole} />
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={cn('flex items-center gap-1.5 text-xs font-medium', STATUS_TONE[u.status])}>
                        <span className={cn('h-1.5 w-1.5 rounded-full', `bg-current`)} />
                        {u.status.charAt(0).toUpperCase() + u.status.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                      {u.lastLoginAt ? formatRelative(u.lastLoginAt) : '—'}
                    </TableCell>
                    <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                      {formatDate(u.createdAt)}
                    </TableCell>
                    <TableCell>
                      {canManage ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel className="text-xs">Manage user</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => resetPassword.mutate(u.email)}>
                              <KeyRound className="mr-2 h-4 w-4" />
                              Reset password
                            </DropdownMenuItem>
                            {u.status === 'suspended' ? (
                              <DropdownMenuItem onClick={() => unsuspendUser.mutate(u.userId)}>
                                <CircleCheck className="mr-2 h-4 w-4 text-green-500" />
                                Reactivate
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => setSuspendTarget(u)}>
                                <Ban className="mr-2 h-4 w-4 text-amber-500" />
                                Suspend
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setRemoveTarget(u)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remove access
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <Lock className="mx-auto h-3.5 w-3.5 text-muted-foreground/40" />
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {!canManage && !isLoading && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" />
          You have read-only access. Only website admins can invite or manage users.
        </p>
      )}

      <InviteUserDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        websiteId={websiteId}
        canonicalId={canonicalId}
      />

      {/* Suspend confirm */}
      <AlertDialog open={!!suspendTarget} onOpenChange={(v) => !v && setSuspendTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspend {suspendTarget?.fullName}?</AlertDialogTitle>
            <AlertDialogDescription>
              They will be signed out and blocked from signing in across the platform until
              reactivated. This is an account-level action.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-amber-600 hover:bg-amber-600/90"
              onClick={() => {
                if (suspendTarget)
                  suspendUser.mutate({ userId: suspendTarget.userId, reason: 'Suspended from CMS' });
                setSuspendTarget(null);
              }}
            >
              Suspend
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove confirm */}
      <AlertDialog open={!!removeTarget} onOpenChange={(v) => !v && setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {removeTarget?.fullName} from this website?</AlertDialogTitle>
            <AlertDialogDescription>
              They lose access to this website&apos;s CMS. Their platform account is not deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => {
                if (removeTarget) removeMember.mutate(removeTarget.userId);
                setRemoveTarget(null);
              }}
            >
              Remove access
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
