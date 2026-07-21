"use client"

import React, { useCallback, useEffect, useState } from 'react';
import { ListingCard, Badge } from '@/components/ui/ListingCard';
import { AppButton } from '@/components/ui/AppButton';
import { Search, Users, ShieldBan, ShieldCheck, MoreVertical, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  listUsers,
  suspendUser,
  unsuspendUser,
  getPlatformStats,
  type AdminUser,
  type PlatformStats,
} from '@/lib/api/admin-users';

const PAGE_SIZE = 50;

export default function UserManagementPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [suspendedCount, setSuspendedCount] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingOn, setActingOn] = useState<string | null>(null);

  const loadUsers = useCallback((opts: { page?: number; search?: string } = {}) => {
    setLoading(true);
    setError(null);
    listUsers({ page: opts.page ?? 1, limit: PAGE_SIZE, search: opts.search })
      .then((res) => {
        setUsers(res.items);
        setTotal(res.total);
        setPage(res.page);
        setHasMore(res.hasMore);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load users'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadUsers();
    getPlatformStats().then(setStats).catch(() => setStats(null));
    listUsers({ page: 1, limit: 1, status: 'suspended' }).then((res) => setSuspendedCount(res.total)).catch(() => setSuspendedCount(null));
  }, [loadUsers]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadUsers({ page: 1, search });
  };

  const handleToggleSuspend = async (user: AdminUser) => {
    setActingOn(user.id);
    try {
      if (user.status === 'suspended') {
        await unsuspendUser(user.id);
        toast({ title: 'User reinstated', description: `${user.email} can sign in again.` });
      } else {
        await suspendUser(user.id);
        toast({ title: 'User suspended', description: `${user.email}'s sessions have been revoked.` });
      }
      loadUsers({ page, search });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Action failed', description: err instanceof Error ? err.message : 'Please try again.' });
    } finally {
      setActingOn(null);
    }
  };

  return (
    <div className="p-10 space-y-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2 text-white">User Registry</h1>
          <p className="text-text-muted font-medium">
            {total > 0 ? `Manage and audit ${total.toLocaleString()} platform members.` : 'Manage and audit platform members.'}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Users', val: stats ? Number(stats.userCount.count).toLocaleString() : '—', icon: Users, color: 'text-brand-green' },
          { label: 'Active Sessions', val: stats ? Number(stats.sessionCount.count).toLocaleString() : '—', icon: ShieldCheck, color: 'text-semantic-info' },
          { label: 'Suspended', val: suspendedCount !== null ? suspendedCount.toLocaleString() : '—', icon: ShieldBan, color: 'text-semantic-error' },
        ].map((stat, i) => (
          <ListingCard key={i} variant="stats">
            <div className="flex items-center justify-between mb-4">
              <stat.icon className={cn("w-5 h-5", stat.color)} />
            </div>
            <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{stat.label}</div>
            <div className="text-2xl font-bold text-white mt-1 font-mono">{stat.val}</div>
          </ListingCard>
        ))}
      </div>

      <ListingCard className="p-0 overflow-hidden border-brand-border bg-brand-surface">
        <div className="p-6 border-b border-brand-border bg-brand-void/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-ghost" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by email or name…"
              className="w-full bg-brand-void border border-brand-border h-11 rounded-lg pl-11 pr-4 text-sm font-mono text-white outline-none focus:border-brand-green transition-all"
            />
          </form>
        </div>

        {error ? (
          <div className="p-16 text-center text-semantic-error font-medium">
            {error}
            <div className="mt-4">
              <AppButton onClick={() => loadUsers({ page, search })} className="bg-brand-void border border-brand-border text-white px-6 h-10 text-xs font-bold uppercase">
                Retry
              </AppButton>
            </div>
          </div>
        ) : loading ? (
          <div className="p-16 flex items-center justify-center gap-3 text-text-muted">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading users…
          </div>
        ) : users.length === 0 ? (
          <div className="p-16 text-center text-text-muted font-medium">No users match this search.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono">
              <thead className="bg-brand-void/80 text-[10px] text-text-muted uppercase tracking-widest">
                <tr>
                  <th className="p-6">Identity</th>
                  <th className="p-6">Status</th>
                  <th className="p-6">Verified</th>
                  <th className="p-6">Registry Date</th>
                  <th className="p-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-brand-border/50 text-white">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-brand-void/30 transition-colors group">
                    <td className="p-6">
                      <div>
                        <div className="font-bold group-hover:text-brand-green transition-colors">{user.full_name || '—'}</div>
                        <div className="text-[10px] text-text-muted">{user.email}</div>
                      </div>
                    </td>
                    <td className="p-6">
                      <Badge variant={user.status === 'suspended' ? 'warning' : 'success'} className="text-[8px]">{user.status}</Badge>
                    </td>
                    <td className="p-6 text-text-muted">{user.email_verified_at ? 'Yes' : 'No'}</td>
                    <td className="p-6 text-text-muted">{new Date(user.created_at).toLocaleDateString()}</td>
                    <td className="p-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleToggleSuspend(user)}
                          disabled={actingOn === user.id}
                          title={user.status === 'suspended' ? 'Reinstate user' : 'Suspend user'}
                          className={cn(
                            "p-2 transition-colors disabled:opacity-40",
                            user.status === 'suspended' ? "text-text-ghost hover:text-brand-green" : "text-text-ghost hover:text-semantic-error"
                          )}
                        >
                          {actingOn === user.id ? <Loader2 className="w-4 h-4 animate-spin" /> : user.status === 'suspended' ? <ShieldCheck className="w-4 h-4" /> : <ShieldBan className="w-4 h-4" />}
                        </button>
                        <button className="p-2 text-text-ghost hover:text-white"><MoreVertical className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && (total > PAGE_SIZE) && (
          <div className="p-6 border-t border-brand-border flex items-center justify-between text-xs text-text-muted font-mono">
            <span>Page {page} of {Math.ceil(total / PAGE_SIZE)}</span>
            <div className="flex gap-2">
              <AppButton
                disabled={page <= 1}
                onClick={() => loadUsers({ page: page - 1, search })}
                className="bg-brand-void border border-brand-border text-white px-4 h-9 text-[10px] font-bold uppercase disabled:opacity-40"
              >
                Prev
              </AppButton>
              <AppButton
                disabled={!hasMore}
                onClick={() => loadUsers({ page: page + 1, search })}
                className="bg-brand-void border border-brand-border text-white px-4 h-9 text-[10px] font-bold uppercase disabled:opacity-40"
              >
                Next
              </AppButton>
            </div>
          </div>
        )}
      </ListingCard>
    </div>
  );
}
