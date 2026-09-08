import { EmptyState, FilterBar, Pagination, RelativeTime } from '@/components/ui';
import { moderation } from '@/lib/api';
import { serverOptions } from '@/lib/api/server';
import { StaffBoundary } from '../staff-boundary';
import { RequestDecision } from './request-decision';
import { privateMetadata } from '@/lib/seo';

export const metadata = privateMetadata('Standing requests');
export const dynamic = 'force-dynamic';

/**
 * People asking to become supporters or volunteers.
 *
 * The queue is ordered oldest-first by the service, not here — a review list sorted newest
 * first leaves whoever has waited longest permanently at the bottom.
 *
 * What a moderator is deciding is whether this person should be able to approach somebody in
 * a family crisis. The applicant's own paragraph is the whole basis for that, and it is read
 * here and nowhere else: it never travels with a support offer and never appears on a profile.
 */
const STATUS = [
  { value: '', label: 'Waiting' },
  { value: 'APPROVED', label: 'Accepted' },
  { value: 'DECLINED', label: 'Not accepted' },
  { value: 'WITHDRAWN', label: 'Withdrawn' },
  { value: 'ALL', label: 'Everything' },
];

export default async function RoleRequestQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const { status, page } = await searchParams;
  const pageNumber = Math.max(1, Number(page) || 1);

  const result = await moderation.roleRequests(
    { status: status || 'PENDING', page: pageNumber, pageSize: 20 },
    await serverOptions(),
  );

  if (!result.ok) return <StaffBoundary error={result.error}>{null}</StaffBoundary>;

  const items = result.data;
  const total = result.meta.pagination?.total ?? items.length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="heading text-2xl">Standing requests</h1>
        <p className="mt-2 max-w-2xl leading-relaxed text-muted">
          Offering support is not something a new account can do. These are the people asking
          for it. Accepting grants the role immediately; declining sends them your reason.
        </p>
      </div>

      <FilterBar filters={[{ name: 'status', label: 'Request status', options: STATUS }]} />

      {items.length === 0 ? (
        <EmptyState
          title="Nothing waiting"
          description="Nobody has asked for supporter or volunteer standing at the moment."
        />
      ) : (
        <ul className="space-y-4">
          {items.map((r) => (
            <li key={r.id} className="rounded-card border border-line bg-surface p-6">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-medium">
                  {r.applicant?.displayName || (r.applicant?.handle ? `@${r.applicant.handle}` : 'A member')}
                </span>
                <span className="text-sm text-muted-2">
                  asking to be a {r.role.toLowerCase()} ·{' '}
                  {r.applicant && <>member since <RelativeTime value={r.applicant.memberSince} /> · </>}
                  asked <RelativeTime value={r.createdAt} />
                </span>
              </div>

              {/* The applicant's own words, quoted rather than summarised. */}
              <blockquote className="mt-4 border-l-2 border-line-strong pl-4 leading-relaxed text-muted">
                {r.reason}
              </blockquote>

              {r.status === 'PENDING' ? (
                <RequestDecision id={r.id} role={r.role} />
              ) : (
                <p className="mt-4 text-sm text-muted-2">
                  {r.status === 'APPROVED' ? 'Accepted' : r.status === 'DECLINED' ? 'Not accepted' : 'Withdrawn'}
                  {r.decidedAt && <> · <RelativeTime value={r.decidedAt} /></>}
                  {r.decisionNote && <span className="block mt-1 text-muted">{r.decisionNote}</span>}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      <Pagination
        page={pageNumber}
        totalPages={Math.max(1, Math.ceil(total / 20))}
        total={total}
        label="Standing requests"
      />
    </div>
  );
}
