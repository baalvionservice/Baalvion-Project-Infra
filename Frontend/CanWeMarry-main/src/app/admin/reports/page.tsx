
import Link from 'next/link';
import { Badge, EmptyState, Pagination, RelativeTime } from '@/components/ui';
import { moderation } from '@/lib/api';
import { serverOptions } from '@/lib/api/server';
import type { Report } from '@/lib/api/types';
import { StaffBoundary } from '../../moderation/staff-boundary';
import { privateMetadata } from '@/lib/seo';

export const metadata = privateMetadata('Reports');
export const dynamic = 'force-dynamic';

const SEVERITY_TONE = { CRITICAL: 'danger', HIGH: 'warn', NORMAL: 'neutral', LOW: 'neutral' } as const;

export default async function AdminReportsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const result = await moderation.queue({ page, pageSize: 50 }, await serverOptions());
  const items = (result.ok ? result.data : []) as Report[];
  const pagination = result.ok ? result.meta.pagination : undefined;

  return (
    <StaffBoundary error={result.ok ? null : result.error}>
      {items.length === 0 ? (
        <EmptyState title="No reports" description="Reports raised on the platform appear here, most urgent first." />
      ) : (
        <>
          <ul className="space-y-3">
            {items.map((r) => (
              <li key={r.id}>
                <Link href={`/moderation/reports/${r.id}`} className="focus-ring block rounded-card border border-line bg-surface p-4 transition-shadow hover:shadow-lift">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={SEVERITY_TONE[r.severity]}>{r.severity.toLowerCase()}</Badge>
                    <Badge>{r.reason.replace(/_/g, ' ').toLowerCase()}</Badge>
                    <Badge>{r.targetType.toLowerCase()}</Badge>
                    <Badge tone={r.status === 'OPEN' ? 'warn' : 'neutral'}>{r.status.toLowerCase()}</Badge>
                    <span className="ml-auto text-xs text-muted-2"><RelativeTime value={r.createdAt} /></span>
                  </div>
                  {r.details && <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted">{r.details}</p>}
                </Link>
              </li>
            ))}
          </ul>
          {pagination && (
            <Pagination page={pagination.page} totalPages={pagination.totalPages} total={pagination.total} label="reports" />
          )}
        </>
      )}
    </StaffBoundary>
  );
}