
import { Badge, EmptyState, Pagination, RelativeTime } from '@/components/ui';
import { moderation } from '@/lib/api';
import { serverOptions } from '@/lib/api/server';
import type { ModerationActionRecord } from '@/lib/api/types';
import { StaffBoundary } from '../staff-boundary';
import { privateMetadata } from '@/lib/seo';

export const metadata = privateMetadata('Action history');
export const dynamic = 'force-dynamic';

export default async function ModerationHistoryPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const result = await moderation.history({ page, pageSize: 30 }, await serverOptions());
  const items = (result.ok ? result.data : []) as ModerationActionRecord[];
  const pagination = result.ok ? result.meta.pagination : undefined;

  return (
    <StaffBoundary error={result.ok ? null : result.error}>
      {items.length === 0 ? (
        <EmptyState
          title="No moderation actions yet"
          description="Every action taken on the platform is recorded here with the reason it was taken."
        />
      ) : (
        <>
          <ul className="space-y-3">
            {items.map((m) => (
              <li key={m.id} className="rounded-card border border-line bg-surface p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="accent">{m.action.replace(/_/g, ' ').toLowerCase()}</Badge>
                  <Badge>{m.targetType.toLowerCase()}</Badge>
                  <span className="ml-auto text-xs text-muted-2"><RelativeTime value={m.createdAt} /></span>
                </div>
                {/* The reason is mandatory in the schema — an action without one cannot exist. */}
                <p className="mt-3 text-sm leading-relaxed">{m.reason}</p>
                <p className="mt-2 font-mono text-xs text-muted-2">{m.targetType} {m.targetId}</p>
              </li>
            ))}
          </ul>
          {pagination && (
            <Pagination page={pagination.page} totalPages={pagination.totalPages} total={pagination.total} label="actions" />
          )}
        </>
      )}
    </StaffBoundary>
  );
}