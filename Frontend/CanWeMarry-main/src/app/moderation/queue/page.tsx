import { Suspense } from 'react';
import Link from 'next/link';
import { Badge, EmptyState, FilterBar, Pagination, RelativeTime } from '@/components/ui';
import { moderation } from '@/lib/api';
import { serverOptions } from '@/lib/api/server';
import type { Report } from '@/lib/api/types';
import { StaffBoundary } from '../staff-boundary';
import { privateMetadata } from '@/lib/seo';

export const metadata = privateMetadata('Report queue');
export const dynamic = 'force-dynamic';

const SEVERITY_TONE = { CRITICAL: 'danger', HIGH: 'warn', NORMAL: 'neutral', LOW: 'neutral' } as const;

/**
 * Filters, and only filters that map to a stored column.
 *
 * Severity is real: `URGENT_REASONS` — threats, coercion, self-harm risk — are written as
 * CRITICAL when the report is created. It is not a UI classification invented for this
 * screen, which is why it can be filtered on at all.
 */
const STATUS = [
  { value: '', label: 'Any status' },
  { value: 'OPEN', label: 'Open' },
  { value: 'TRIAGED', label: 'Triaged' },
  { value: 'ACTIONED', label: 'Actioned' },
  { value: 'DISMISSED', label: 'Dismissed' },
];

const SEVERITY = [
  { value: '', label: 'Any severity' },
  { value: 'CRITICAL', label: 'Safety (critical)' },
  { value: 'NORMAL', label: 'Normal' },
];

const REASON = [
  { value: '', label: 'Any reason' },
  { value: 'THREAT_OR_VIOLENCE', label: 'Threat or violence' },
  { value: 'SELF_HARM_RISK', label: 'Self-harm risk' },
  { value: 'COERCION', label: 'Coercion' },
  { value: 'HARASSMENT', label: 'Harassment' },
  { value: 'PRIVACY_VIOLATION', label: 'Privacy violation' },
  { value: 'HATE_SPEECH', label: 'Hate speech' },
  { value: 'IMPERSONATION', label: 'Impersonation' },
  { value: 'SPAM', label: 'Spam' },
  { value: 'OFF_TOPIC', label: 'Off topic' },
  { value: 'OTHER', label: 'Other' },
];

const TARGET = [
  { value: '', label: 'Anything' },
  { value: 'CASE', label: 'Case' },
  { value: 'POST', label: 'Post' },
  { value: 'COMMENT', label: 'Comment' },
  { value: 'PROFILE', label: 'Profile' },
  { value: 'COMMUNITY', label: 'Community' },
];

const SORT = [
  { value: '', label: 'Triage order' },
  { value: 'oldest', label: 'Longest waiting' },
  { value: 'newest', label: 'Most recent' },
  { value: 'updated', label: 'Recently updated' },
];

export default async function ReportQueuePage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string; status?: string; severity?: string;
    reason?: string; targetType?: string; unresolved?: string; sort?: string;
  }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);

  // Filtering and ordering happen in SQL. Fetching the queue and narrowing it here would
  // return a page of rows and then filter that page, which reads like a filter over
  // everything and is not one.
  const result = await moderation.queue(
    {
      page, pageSize: 25,
      status: sp.status, severity: sp.severity, reason: sp.reason,
      targetType: sp.targetType, sort: sp.sort,
      unresolved: sp.unresolved === 'true' ? true : undefined,
    },
    await serverOptions(),
  );

  const items = (result.ok ? result.data : []) as Report[];
  const pagination = result.ok ? result.meta.pagination : null;
  const filtered = Boolean(sp.status || sp.severity || sp.reason || sp.targetType || sp.unresolved || sp.sort);

  return (
    <StaffBoundary error={result.ok ? null : result.error}>
      <div className="space-y-6">
        <Suspense fallback={<div className="h-11" />}>
          <FilterBar
            searchPlaceholder="Search is not available on reports"
            filters={[
              { name: 'status', label: 'Status', options: STATUS },
              { name: 'severity', label: 'Severity', options: SEVERITY },
              { name: 'reason', label: 'Reason', options: REASON },
              { name: 'targetType', label: 'About', options: TARGET },
              { name: 'sort', label: 'Order', options: SORT },
            ]}
          />
        </Suspense>

        {items.length === 0 ? (
          <EmptyState
            title={filtered ? 'No reports match those filters' : 'The queue is clear'}
            description={filtered
              ? 'Try widening the filters, or clear them to see the whole queue.'
              : 'No reports are waiting for review.'}
          />
        ) : (
          <>
            <ul className="space-y-3">
              {items.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/moderation/reports/${r.id}`}
                    className="focus-ring block rounded-card border border-line bg-surface p-4 transition-shadow hover:shadow-lift"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      {/* The severity word is present as text, so the meaning does not
                          depend on the badge colour. */}
                      <Badge tone={SEVERITY_TONE[r.severity]}>{r.severity.toLowerCase()}</Badge>
                      <Badge>{r.reason.replace(/_/g, ' ').toLowerCase()}</Badge>
                      <Badge>{r.targetType.toLowerCase()}</Badge>
                      <Badge tone={r.status === 'OPEN' ? 'accent' : 'neutral'}>{r.status.toLowerCase()}</Badge>
                      <span className="ml-auto text-xs text-muted-2"><RelativeTime value={r.createdAt} /></span>
                    </div>
                    {/* The reporter's free-text description is deliberately NOT here. A
                        triage list is scanned — often on a shared screen — and what somebody
                        wrote about a private situation does not need to be readable at a
                        glance to decide what to open next. The reason, target and severity
                        are enough for that; the description is on the report itself. */}
                    <p className="mt-2 text-xs text-muted-2">
                      Open the report to read what was described.
                    </p>
                  </Link>
                </li>
              ))}
            </ul>

            {pagination && (
              <Pagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                total={pagination.total}
                label="reports"
              />
            )}
          </>
        )}
      </div>
    </StaffBoundary>
  );
}
