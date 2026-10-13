'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ArrowLeft, Search, Undo2, Archive } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useRemovedUsers, useRestoreUser } from '@/lib/queries/users.queries';
import { useAuthStore } from '@/lib/store/authStore';
import { useUIStore } from '@/lib/store/uiStore';

export default function RemovedUsersPage() {
  const setBreadcrumbs = useUIStore((s) => s.setBreadcrumbs);
  const canRestore = !!useAuthStore((s) => s.user)?.roles?.includes('super_admin');
  const [search, setSearch] = useState('');
  const { data, isLoading } = useRemovedUsers({ limit: 100, search: search || undefined });
  const { mutate: restore, isPending } = useRestoreUser();

  useEffect(() => {
    setBreadcrumbs([{ label: 'Users', href: '/users' }, { label: 'Removed users' }]);
  }, [setBreadcrumbs]);

  const items = data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Removed users"
        description={`${data?.total ?? 0} people removed from the panel. Their history is kept; restore brings the account back with no access.`}
        actions={
          <Button size="sm" variant="outline" asChild>
            <Link href="/users"><ArrowLeft className="mr-2 h-4 w-4" />All users</Link>
          </Button>
        }
      />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email" className="pl-9" />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center">
              <Archive className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">{search ? 'No removed user matches that search' : 'Nobody has been removed yet'}</p>
            </div>
          ) : (
            <div className="divide-y">
              {items.map((u) => (
                <div key={u.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{u.fullName || u.email}</p>
                    {u.fullName && <p className="truncate text-xs text-muted-foreground">{u.email}</p>}
                    <p className="mt-1 text-xs text-muted-foreground">
                      Removed {u.removedAt ? format(new Date(u.removedAt), 'MMM d, yyyy HH:mm') : 'date unknown'}
                      {u.removedBy ? <> by <span className="font-medium text-foreground">{u.removedBy}</span></> : null}
                    </p>
                    {u.reason && <p className="mt-0.5 text-xs italic text-muted-foreground">“{u.reason}”</p>}
                  </div>
                  {canRestore && (
                    <Button size="sm" variant="outline" disabled={isPending} onClick={() => restore(u.id)}>
                      <Undo2 className="mr-1.5 h-4 w-4" /> Restore
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
