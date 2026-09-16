import { privateMetadata } from '@/lib/seo';
import { Suspense } from 'react';
import {
  Breadcrumbs, ButtonLink, Card, CardBody, Container, EmptyState, ErrorState,
  FilterBar, Pagination, Section,
} from '@/components/ui';
import { PageHeader } from '@/components/site/page-header';
import { CommunityCard } from '@/components/community/community-card';
import { communities, identity as identityApi } from '@/lib/api';
import { serverOptions } from '@/lib/api/server';
import type { Community } from '@/lib/api/types';

export const metadata = privateMetadata('Community');
export const dynamic = 'force-dynamic';

/**
 * The community hub.
 *
 * The sections are derived from the one list the server returns, sorted differently — not
 * from separate "featured" or "trending" endpoints, because nothing in this product should
 * be promoted by an algorithm nobody can inspect. "Active" means it has discussions and a
 * recent one; "new" means recently created. Both are facts about the data.
 *
 * A section is omitted entirely when it would be empty, rather than shown with a placeholder.
 */
const SORTS = [
  { value: '', label: 'By name' },
  { value: 'active', label: 'Recently active' },
  { value: 'newest', label: 'Newest' },
];

const VISIBILITY = [
  { value: '', label: 'Any' },
  { value: 'PUBLIC', label: 'Public' },
  { value: 'PRIVATE', label: 'Private (yours)' },
];

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; sort?: string; visibility?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);

  // Filtering happens on the server, against what this caller may see. A PRIVATE filter
  // narrows to the private communities they are already in — it never widens anything.
  const filtered = Boolean(sp.q || sp.sort || sp.visibility);
  const options = await serverOptions();
  const [result, meResult] = await Promise.all([
    communities.list({ page, pageSize: 24, q: sp.q, sort: sp.sort, visibility: sp.visibility }, options),
    identityApi.me(options),
  ]);
  // Hosting a community is granted standing, not something every account has. Offering the
  // button to everyone sends most people to a page that tells them no.
  const canCreate = meResult.ok && meResult.data.permissions.includes('community:create');

  if (!result.ok) {
    return (
      <>
        <PageHeader title="Community" lead="Groups organised around a shared situation or place." />
        <Container className="py-10">
          <ErrorState message={result.error.message} action={<ButtonLink href="/community" variant="secondary">Try again</ButtonLink>} />
        </Container>
      </>
    );
  }

  const all: Community[] = result.data;
  const pagination = result.meta.pagination;
  // Grouping into "yours / active / explore" only makes sense for the unfiltered hub. Once
  // somebody has searched, three headings over one short list reads as three lists.
  const onFirstPage = page === 1 && !filtered;

  const mine = all.filter((c) => c.isMember);
  const active = all
    .filter((c) => !c.isMember && c.lastActivityAt)
    .sort((a, b) => new Date(b.lastActivityAt!).getTime() - new Date(a.lastActivityAt!).getTime())
    .slice(0, 3);
  const activeIds = new Set(active.map((c) => c.id));
  // When a search is on, every match belongs in one list — including ones already joined.
  const rest = filtered ? all : all.filter((c) => !c.isMember && !activeIds.has(c.id));

  return (
    <>
      <PageHeader
        title="Community"
        lead="Groups organised around a shared situation or place. Private communities are not listed to people outside them — their existence is part of what membership protects."
        actions={canCreate ? <ButtonLink href="/community/create" variant="secondary">Create a community</ButtonLink> : undefined}
      />

      <Container className="space-y-12 py-10">
        <Breadcrumbs items={[{ href: '/', label: 'Home' }, { label: 'Community' }]} />

        {/* What these are, before the list of them. Somebody arriving here mid-crisis should
            not have to work out what a "community" is from a grid of cards. */}
        {!filtered && (
          <Card>
            <CardBody className="max-w-3xl">
              <h2 className="heading text-base">What a community is here</h2>
              <p className="mt-2 text-ui leading-relaxed text-muted">
                A place to talk with people who understand a particular situation — a
                conversation, not a campaign. Each one sets its own rules, and the platform
                rules apply on top of them. Some are open to anyone; others admit people by
                request, and a private community is not listed to anyone outside it.
              </p>
              <p className="mt-2 text-ui leading-relaxed text-muted">
                Joining lets you read and take part in the discussions. It does not give you
                access to anybody&rsquo;s private case.
              </p>
            </CardBody>
          </Card>
        )}

        <Suspense fallback={<div className="h-11" />}>
          <FilterBar
            searchPlaceholder="Search communities"
            filters={[
              { name: 'sort', label: 'Sort', options: SORTS },
              { name: 'visibility', label: 'Visibility', options: VISIBILITY },
            ]}
          />
        </Suspense>

        {all.length === 0 && filtered ? (
          <EmptyState
            title="No communities match that"
            description="Try a different word, or clear the filters to see everything you can."
            action={<ButtonLink href="/community" variant="secondary">Clear filters</ButtonLink>}
          />
        ) : all.length === 0 ? (
          <EmptyState
            title="No communities yet"
            description="Communities are created by volunteers and moderators. When one exists that you can see, it will appear here — and if you help people through this kind of situation, you can ask about hosting one."
            action={canCreate ? <ButtonLink href="/community/create" variant="secondary">Create a community</ButtonLink> : undefined}
          />
        ) : (
          <>
            {onFirstPage && mine.length > 0 && (
              <Section title="Your communities" description="Groups you have joined.">
                <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {mine.map((c) => <li key={c.id}><CommunityCard community={c} /></li>)}
                </ul>
              </Section>
            )}

            {onFirstPage && active.length > 0 && (
              <Section title="Recently active" description="Where a conversation has happened most recently.">
                <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {active.map((c) => <li key={c.id}><CommunityCard community={c} /></li>)}
                </ul>
              </Section>
            )}

            {rest.length > 0 && (
              <Section
                title={filtered ? 'Results' : onFirstPage && (mine.length > 0 || active.length > 0) ? 'Explore' : 'All communities'}
                description="Everything you can see, whether or not you have joined."
              >
                <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {rest.map((c) => <li key={c.id}><CommunityCard community={c} /></li>)}
                </ul>
              </Section>
            )}

            {pagination && (
              <Pagination page={pagination.page} totalPages={pagination.totalPages} total={pagination.total} label="communities" />
            )}
          </>
        )}
      </Container>
    </>
  );
}
