
import { Badge, EmptyState, Pagination, RelativeTime } from '@/components/ui';
import { admin } from '@/lib/api';
import { serverOptions } from '@/lib/api/server';
import type { AuditEntry } from '@/lib/api/types';
import { StaffBoundary } from '../../moderation/staff-boundary';
import { privateMetadata } from '@/lib/seo';

export const metadata = privateMetadata('Audit trail');
export const dynamic = 'force-dynamic';

/**
 * The audit trail. Administrator-only — a moderator gets a 403 here, deliberately.
 *
 * The API never returns the IP or user-agent hashes it stores, so there is nothing on this
 * page that could identify where an action came from. It answers who did what, not from
 * where.
 */
export default async function AdminAuditPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const result = await admin.audit({ page, pageSize: 50 }, await serverOptions());
  const items = (result.ok ? result.data : []) as AuditEntry[];
  const pagination = result.ok ? result.meta.pagination : undefined;

  return (
    <StaffBoundary error={result.ok ? null : result.error}>
      {items.length === 0 ? (
        <EmptyState title="Nothing recorded yet" description="Case creation, consent decisions, reports and moderation actions are all recorded here." />
      ) : (
        <>
          <div className="overflow-x-auto rounded-card border border-line">
            <table className="w-full min-w-[48rem] border-collapse text-sm">
              <caption className="sr-only">Administrative and moderation events</caption>
              <thead className="bg-surface text-left">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Action</th>
                  <th scope="col" className="px-4 py-3 font-medium">Entity</th>
                  <th scope="col" className="px-4 py-3 font-medium">Actor</th>
                  <th scope="col" className="px-4 py-3 font-medium">When</th>
                </tr>
              </thead>
              <tbody>
                {items.map((a) => (
                  <tr key={a.id} className="border-t border-line align-top">
                    <td className="px-4 py-3"><Badge tone="accent">{a.action}</Badge></td>
                    <td className="px-4 py-3">
                      <span className="block">{a.entityType ?? '—'}</span>
                      {a.entityId && <span className="block font-mono text-xs text-muted-2">{a.entityId}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="block font-mono text-xs text-muted-2">{a.actorId ?? 'system'}</span>
                      <span className="mt-1 flex flex-wrap gap-1">
                        {a.actorRoles.map((r) => <Badge key={r}>{r.toLowerCase()}</Badge>)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted"><RelativeTime value={a.createdAt} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pagination && (
            <Pagination page={pagination.page} totalPages={pagination.totalPages} total={pagination.total} label="events" />
          )}
        </>
      )}
    </StaffBoundary>
  );
}