
import Link from 'next/link';
import { Badge, EmptyState, Pagination, RelativeTime, VisibilityBadge } from '@/components/ui';
import { admin } from '@/lib/api';
import { serverOptions } from '@/lib/api/server';
import type { CaseSummary } from '@/lib/api/types';
import { StaffBoundary } from '../../moderation/staff-boundary';
import { privateMetadata } from '@/lib/seo';

export const metadata = privateMetadata('Cases');
export const dynamic = 'force-dynamic';

export default async function AdminCasesPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  // Runs through the SAME visibility scope as every other read; staff hold CASE_MODERATE,
  // which the scope answers with an unrestricted predicate. There is no privileged second
  // query path that could drift away from the rules the rest of the service enforces.
  const result = await admin.cases({ page, pageSize: 50 }, await serverOptions());
  const items = (result.ok ? result.data : []) as CaseSummary[];
  const pagination = result.ok ? result.meta.pagination : undefined;

  return (
    <StaffBoundary error={result.ok ? null : result.error}>
      {items.length === 0 ? (
        <EmptyState title="No cases" description="Cases opened on the platform appear here, including drafts and withheld ones." />
      ) : (
        <>
          <div className="overflow-x-auto rounded-card border border-line">
            <table className="w-full min-w-[46rem] border-collapse text-sm">
              <caption className="sr-only">All cases, including those withheld from the site</caption>
              <thead className="bg-surface text-left">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Reference</th>
                  <th scope="col" className="px-4 py-3 font-medium">Title</th>
                  <th scope="col" className="px-4 py-3 font-medium">Visibility</th>
                  <th scope="col" className="px-4 py-3 font-medium">Status</th>
                  <th scope="col" className="px-4 py-3 font-medium">Opened</th>
                </tr>
              </thead>
              <tbody>
                {items.map((c) => (
                  <tr key={c.id} className="border-t border-line">
                    <td className="px-4 py-3 font-mono text-xs">
                      <Link href={`/cases/${c.id}`} className="focus-ring rounded-sm text-accent-strong underline underline-offset-2">
                        {c.reference}
                      </Link>
                    </td>
                    <td className="max-w-xs truncate px-4 py-3">{c.title}</td>
                    <td className="px-4 py-3"><VisibilityBadge visibility={c.visibility} /></td>
                    <td className="px-4 py-3"><Badge>{c.status.toLowerCase()}</Badge></td>
                    <td className="px-4 py-3 text-muted"><RelativeTime value={c.createdAt} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pagination && (
            <Pagination page={pagination.page} totalPages={pagination.totalPages} total={pagination.total} label="cases" />
          )}
        </>
      )}
    </StaffBoundary>
  );
}