
import { Badge, EmptyState, Pagination, RelativeTime } from '@/components/ui';
import { admin } from '@/lib/api';
import { serverOptions } from '@/lib/api/server';
import type { AdminUser } from '@/lib/api/types';
import { StaffBoundary } from '../../moderation/staff-boundary';
import { RoleManager } from '@/components/moderation/role-manager';
import { SuspendDialog } from '@/components/moderation/suspend-dialog';
import { privateMetadata } from '@/lib/seo';

export const metadata = privateMetadata('Users');
export const dynamic = 'force-dynamic';

const STATUS_TONE = { ACTIVE: 'ok', SUSPENDED: 'warn', DEACTIVATED: 'neutral' } as const;

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const result = await admin.users({ page, pageSize: 50 }, await serverOptions());
  const users = (result.ok ? result.data : []) as AdminUser[];
  const pagination = result.ok ? result.meta.pagination : undefined;

  return (
    <StaffBoundary error={result.ok ? null : result.error}>
      {users.length === 0 ? (
        <EmptyState title="No accounts yet" description="Accounts appear once someone signs in for the first time." />
      ) : (
        <>
          <div className="overflow-x-auto rounded-card border border-line">
            <table className="w-full min-w-[48rem] border-collapse text-sm">
              <caption className="sr-only">Accounts and the standing they hold</caption>
              <thead className="bg-surface text-left">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Account</th>
                  <th scope="col" className="px-4 py-3 font-medium">Standing</th>
                  <th scope="col" className="px-4 py-3 font-medium">Account</th>
                  <th scope="col" className="px-4 py-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-line align-top">
                    <td className="px-4 py-3">
                      <span className="block font-medium">{u.displayName ?? u.handle ?? 'No profile'}</span>
                      {/* No email column: this service has never held one. */}
                      <span className="block font-mono text-xs text-muted-2">{u.id}</span>
                    </td>
                    <td className="px-4 py-3"><RoleManager user={u} /></td>
                    <td className="px-4 py-3">
                      {u.status === 'SUSPENDED'
                        ? <SuspendDialog user={u} />
                        : (
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge tone={STATUS_TONE[u.status as keyof typeof STATUS_TONE] ?? 'neutral'}>
                              {u.status.toLowerCase()}
                            </Badge>
                            <SuspendDialog user={u} />
                          </div>
                        )}
                    </td>
                    <td className="px-4 py-3 text-muted"><RelativeTime value={u.createdAt} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pagination && (
            <Pagination page={pagination.page} totalPages={pagination.totalPages} total={pagination.total} label="accounts" />
          )}
        </>
      )}
    </StaffBoundary>
  );
}