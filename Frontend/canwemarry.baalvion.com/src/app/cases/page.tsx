import { Suspense } from 'react';
import { privateMetadata } from '@/lib/seo';
import {
  Breadcrumbs, ButtonLink, Container, EmptyState, ErrorState, FilterBar,
  Pagination,
} from '@/components/ui';
import { PageHeader } from '@/components/site/page-header';
import { CaseCard } from '@/components/cases/case-card';
import { cases, communities } from '@/lib/api';
import { serverOptions } from '@/lib/api/server';

export const metadata = privateMetadata('Explore cases');
// One person's view of this list differs from another's, and it changes as people open,
// close and re-scope cases. Nothing here is cacheable — and caching it publicly would be
// the single worst mistake available in this product.
export const dynamic = 'force-dynamic';

const SORTS = [
  { value: '', label: 'Most recent' },
  { value: 'updated', label: 'Recently active' },
  { value: 'supported', label: 'Most supported' },
  { value: 'oldest', label: 'Oldest first' },
];

const NEEDS = [
  { value: '', label: 'All' },
  { value: 'LISTENING', label: 'Listening' },
  { value: 'MEDIATION', label: 'Mediation' },
  { value: 'LEGAL', label: 'Legal' },
  { value: 'COUNSELLING', label: 'Counselling' },
  { value: 'COMMUNITY', label: 'Community' },
  { value: 'PRACTICAL', label: 'Practical' },
];

const STATUSES = [
  { value: '', label: 'Any' },
  { value: 'OPEN', label: 'Open' },
  { value: 'ON_HOLD', label: 'On hold' },
  { value: 'RESOLVED', label: 'Resolved' },
];

interface SearchParams {
  q?: string; sort?: string; supportNeeded?: string; status?: string;
  communityId?: string; page?: string;
}

export default async function CasesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const options = await serverOptions();

  // The community filter is populated from what the CALLER can see. A private community
  // they do not belong to never appears as an option, so the filter itself cannot be used
  // to discover that one exists.
  const [result, communityResult] = await Promise.all([
    cases.list({
      page, pageSize: 12,
      q: sp.q,
      sort: sp.sort || undefined,
      supportNeeded: sp.supportNeeded || undefined,
      status: sp.status || undefined,
      communityId: sp.communityId || undefined,
    }, options),
    communities.list({ pageSize: 50 }, options),
  ]);

  const visibleCommunities = communityResult.ok ? communityResult.data : [];
  const communityNames = new Map(visibleCommunities.map((c) => [c.id, c.name]));

  const pagination = result.ok ? result.meta.pagination : undefined;
  const filtered = Boolean(sp.q || sp.supportNeeded || sp.status || sp.communityId);

  const filters = [
    { name: 'supportNeeded', label: 'Support needed', options: NEEDS },
    { name: 'status', label: 'Status', options: STATUSES },
    ...(visibleCommunities.length > 0
      ? [{
          name: 'communityId',
          label: 'Community',
          options: [{ value: '', label: 'All' }, ...visibleCommunities.map((c) => ({ value: c.id, label: c.name }))],
        }]
      : []),
    { name: 'sort', label: 'Sort', options: SORTS },
  ];

  return (
    <>
      <PageHeader
        title="Explore cases"
        lead="Accounts people have chosen to share. What appears here depends on what each person decided to make visible — and on who you are."
        actions={<ButtonLink href="/create-case">Open a case</ButtonLink>}
      />

      <Container className="py-10">
        <Breadcrumbs items={[{ href: '/', label: 'Home' }, { label: 'Cases' }]} />

        <Suspense fallback={<div className="mb-8 h-11" />}>
          <FilterBar searchPlaceholder="Search titles and summaries" filters={filters} />
        </Suspense>

        {!result.ok ? (
          <ErrorState
            message={result.error.message}
            action={<ButtonLink href="/cases" variant="secondary">Try again</ButtonLink>}
          />
        ) : result.data.length === 0 ? (
          <EmptyState
            title={filtered ? 'No cases match those filters' : 'No cases to show yet'}
            description={
              filtered
                ? 'Try widening the search, or clear the filters to see everything shared with you.'
                : 'Cases appear here when someone chooses to share one with a community or the wider site. Yours stays private unless you decide otherwise — writing it down privately is a complete first step.'
            }
            action={
              filtered
                ? <ButtonLink href="/cases" variant="secondary">Clear filters</ButtonLink>
                : <ButtonLink href="/create-case">Open a case</ButtonLink>
            }
          />
        ) : (
          <>
            <p className="mb-5 text-sm text-muted" role="status">
              {pagination?.total ?? result.data.length} case
              {(pagination?.total ?? result.data.length) === 1 ? '' : 's'}
              {sp.q && <> matching &ldquo;{sp.q}&rdquo;</>}
            </p>

            <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {result.data.map((c) => (
                <li key={c.id}>
                  <CaseCard case={c} communityName={c.communityId ? communityNames.get(c.communityId) : null} />
                </li>
              ))}
            </ul>

            {pagination && (
              <Pagination page={pagination.page} totalPages={pagination.totalPages} total={pagination.total} label="cases" />
            )}
          </>
        )}
      </Container>
    </>
  );
}
