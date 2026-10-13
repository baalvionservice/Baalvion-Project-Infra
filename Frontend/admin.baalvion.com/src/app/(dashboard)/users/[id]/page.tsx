'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ArrowLeft, UserMinus, UserX, UserCheck, ShieldCheck, Globe } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import StatusBadge from '@/components/common/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import RemoveUserDialog from '@/components/users/RemoveUserDialog';
import InviteToWebsitesButton from '@/components/cms/InviteToWebsitesButton';
import { useUser, useSuspendUser, useUnsuspendUser, useRestoreUser } from '@/lib/queries/users.queries';
import { websitesApi } from '@/lib/api/cms-websites';
import { cmsRoleLabel } from '@/lib/cms/permissions';
import { useAuthStore } from '@/lib/store/authStore';
import { useUIStore } from '@/lib/store/uiStore';

export default function UserProfilePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params.id);
  const setBreadcrumbs = useUIStore((s) => s.setBreadcrumbs);
  const me = useAuthStore((s) => s.user);
  const isSuper = !!me?.roles?.includes('super_admin');

  const { data: user, isLoading, isError } = useUser(id);
  const { mutate: suspend, isPending: suspending } = useSuspendUser();
  const { mutate: unsuspend, isPending: unsuspending } = useUnsuspendUser();
  const { mutate: restore, isPending: restoring } = useRestoreUser();
  const [removing, setRemoving] = useState(false);

  const { data: grants = [] } = useQuery({
    queryKey: ['cms', 'user-grants', id],
    queryFn: () => websitesApi.listAllGrants({ userId: id }),
    enabled: Number.isFinite(id) && isSuper,
  });

  useEffect(() => {
    setBreadcrumbs([{ label: 'Users', href: '/users' }, { label: user?.fullName || user?.email || 'Profile' }]);
  }, [setBreadcrumbs, user]);

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-10 w-64" /><Skeleton className="h-48" /></div>;
  if (isError || !user) {
    return (
      <div className="py-24 text-center">
        <p className="mb-4 text-muted-foreground">We could not find that user.</p>
        <Button variant="outline" asChild><Link href="/users">Back to users</Link></Button>
      </div>
    );
  }

  const isSelf = Number(me?.id) === user.id;
  const removed = user.status === 'deleted';

  return (
    <div className="space-y-6">
      <PageHeader
        title={user.fullName || user.email}
        description={user.email}
        titleAdornment={<StatusBadge status={removed ? 'removed' : user.status} />}
        actions={
          <>
            <Button size="sm" variant="outline" asChild>
              <Link href="/users"><ArrowLeft className="mr-2 h-4 w-4" />Users</Link>
            </Button>
            {!removed && <InviteToWebsitesButton size="sm" variant="outline" label="Give site access" defaultEmail={user.email} />}
            {!removed && user.status === 'active' && (
              <Button size="sm" variant="outline" disabled={suspending} onClick={() => suspend({ id: user.id, reason: 'Suspended by admin' })}>
                <UserX className="mr-2 h-4 w-4" />Suspend
              </Button>
            )}
            {!removed && user.status === 'suspended' && (
              <Button size="sm" variant="outline" disabled={unsuspending} onClick={() => unsuspend(user.id)}>
                <UserCheck className="mr-2 h-4 w-4" />Unsuspend
              </Button>
            )}
            {isSuper && !isSelf && !removed && (
              <Button size="sm" variant="destructive" onClick={() => setRemoving(true)}>
                <UserMinus className="mr-2 h-4 w-4" />Remove user
              </Button>
            )}
            {isSuper && removed && (
              <Button size="sm" disabled={restoring} onClick={() => restore(user.id)}>Restore user</Button>
            )}
          </>
        }
      />

      {removed && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="py-4 text-sm">
            This person was removed. They cannot sign in and have no access. Restore them to bring the account back, then invite them to a website again.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm">Account</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between gap-4"><span className="text-muted-foreground">Role</span><Badge variant="secondary" className="capitalize">{String(user.role).replace('_', ' ')}</Badge></div>
            <div className="flex justify-between gap-4"><span className="text-muted-foreground">Email verified</span><span>{user.emailVerifiedAt ? format(new Date(user.emailVerifiedAt), 'MMM d, yyyy') : 'Not yet'}</span></div>
            <div className="flex justify-between gap-4"><span className="text-muted-foreground">Two-step sign-in</span><span className="flex items-center gap-1">{user.mfaEnabled && <ShieldCheck className="h-4 w-4 text-green-600" />}{user.mfaEnabled ? 'On' : 'Off'}</span></div>
            <div className="flex justify-between gap-4"><span className="text-muted-foreground">Joined</span><span>{format(new Date(user.createdAt), 'MMM d, yyyy')}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm"><Globe className="h-4 w-4" />Website access</CardTitle>
            <CardDescription className="text-xs">Only these websites are visible to this person.</CardDescription>
          </CardHeader>
          <CardContent className="divide-y p-0">
            {!isSuper ? (
              <p className="px-4 py-6 text-sm text-muted-foreground">Only a super admin can see site access.</p>
            ) : grants.length === 0 ? (
              <p className="px-4 py-6 text-sm text-muted-foreground">No website access.</p>
            ) : grants.map((g) => (
              <div key={g.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <button type="button" className="truncate text-left text-sm font-medium hover:underline" onClick={() => router.push(`/cms/websites/${g.website.slug}`)}>{g.website.name}</button>
                  <p className="truncate text-xs text-muted-foreground">{g.website.domain}{g.expiresAt ? ` · until ${format(new Date(g.expiresAt), 'MMM d, yyyy')}` : ''}</p>
                </div>
                <Badge variant="secondary">{cmsRoleLabel(g.role)}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <RemoveUserDialog user={removing ? { id: user.id, fullName: user.fullName, email: user.email } : null} onOpenChange={(o) => !o && setRemoving(false)} onRemoved={() => router.push('/users')} />
    </div>
  );
}
