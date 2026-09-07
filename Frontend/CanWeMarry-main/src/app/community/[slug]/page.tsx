import { Suspense } from 'react';
import Link from 'next/link';
import { notFoundIfMissing } from '@/lib/api/not-found';
import { privateMetadata } from '@/lib/seo';
import {
  Badge, Breadcrumbs, ButtonLink, Card, CardBody, CardTitle, Container, EmptyState, ErrorState,
  RelativeTime, Section, Stat, Tabs,
} from '@/components/ui';
import { JoinButton } from '@/components/community/join-button';
import { PostComposer } from '@/components/community/post-composer';
import { ManagePanel } from '@/components/community/manage-panel';
import { CaseCard } from '@/components/cases/case-card';
import { communities, posts as postsApi, cases as casesApi } from '@/lib/api';
import { serverOptions } from '@/lib/api/server';
import type { CommunityMember, Post } from '@/lib/api/types';

export const metadata = privateMetadata('Community');
export const dynamic = 'force-dynamic';

const POLICY_LABEL = { OPEN: 'Anyone can join', REQUEST: 'Join by request', INVITE: 'Invitation only' } as const;

export default async function CommunityDetailPage({
  params, searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { slug } = await params;
  const { tab = 'discussion' } = await searchParams;
  const options = await serverOptions();

  const result = await communities.getBySlug(slug, options);
  if (!result.ok) {
    // A private community returns 404 to a non-member — its existence is not public either,
    // so a genuine 404 is the whole "missing or not yours" answer. Anything else is a
    // failure to reach the service, and saying "not found" for that would report an outage
    // as ordinary absence.
    const failure = notFoundIfMissing(result.error);
    return (
      <Container className="py-16">
        <ErrorState
          as="h1"
          message={failure.message}
          action={<ButtonLink href="/community" variant="secondary">Back to communities</ButtonLink>}
        />
      </Container>
    );
  }
  const community = result.data;

  const readable = community.isMember || community.visibility === 'PUBLIC';

  // Only the selected tab's data is fetched. A client-side tab switch would mean sending
  // every panel to every visitor, including panels they may not be entitled to.
  // Who may run this community. `myRole` is the server's answer about the CALLER, so it is
  // safe to branch on — and every management route re-checks it anyway.
  const canManage = community.myRole === 'MODERATOR' || community.myRole === 'ADMIN';

  const [postsResult, membersResult, casesResult, pendingResult] = await Promise.all([
    tab === 'discussion' && readable ? postsApi.list({ communityId: community.id, pageSize: 30 }, options) : null,
    tab === 'members' && community.isMember ? communities.members(community.id, { pageSize: 60 }, options) : null,
    tab === 'cases' ? casesApi.list({ communityId: community.id, pageSize: 20 }, options) : null,
    // Requests to join are fetched only for the people who act on them; the server refuses
    // this to anyone else, so an ordinary member cannot learn who applied.
    tab === 'manage' && canManage ? communities.members(community.id, { pageSize: 60, status: 'PENDING' }, options) : null,
  ]);

  const discussions: Post[] = postsResult?.ok ? (postsResult.data as Post[]) : [];
  const members: CommunityMember[] = membersResult?.ok ? membersResult.data : [];
  const communityCases = casesResult?.ok ? casesResult.data : [];
  const pendingMembers: CommunityMember[] = pendingResult?.ok ? pendingResult.data : [];

  const tabs = [
    { key: 'discussion', label: 'Discussion', count: community.postCount },
    { key: 'cases', label: 'Cases' },
    ...(community.isMember ? [{ key: 'members', label: 'Members', count: community.memberCount }] : []),
    { key: 'about', label: 'About' },
    ...(canManage ? [{ key: 'manage', label: 'Manage' }] : []),
  ];

  return (
    <>
      <div className="border-b border-line bg-surface">
        <Container className="py-section">
          <Breadcrumbs items={[
            { href: '/', label: 'Home' },
            { href: '/community', label: 'Community' },
            { label: community.name },
          ]} />

          <div className="flex flex-wrap items-center gap-2">
            {community.visibility === 'PRIVATE' && <Badge tone="ok">Private</Badge>}
            <Badge>{POLICY_LABEL[community.joinPolicy]}</Badge>
            {community.isMember && <Badge tone="accent">You are a member</Badge>}
          </div>

          <h1 className="heading mt-4 text-3xl sm:text-4xl">{community.name}</h1>
          {community.description && (
            <p className="mt-3 max-w-2xl text-body leading-relaxed text-muted">{community.description}</p>
          )}

          {/* Rules before the join button, not behind a tab. Somebody deciding whether to
              join should not have to go looking for what is expected of them. */}
          {!community.isMember && community.rules && (
            <div className="mt-5 max-w-2xl rounded-card border border-line bg-ground p-4">
              <h2 className="text-sm font-semibold">Before you join, the rules here</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted">{community.rules}</p>
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <JoinButton community={community} />
            <dl className="flex gap-3">
              <div className="rounded-md border border-line bg-ground px-3 py-1.5">
                <dt className="sr-only">Members</dt>
                <dd className="text-sm tabular-nums">
                  <span className="font-medium">{community.memberCount}</span>{' '}
                  <span className="text-muted">member{community.memberCount === 1 ? '' : 's'}</span>
                </dd>
              </div>
              <div className="rounded-md border border-line bg-ground px-3 py-1.5">
                <dt className="sr-only">Discussions</dt>
                <dd className="text-sm tabular-nums">
                  <span className="font-medium">{community.postCount}</span>{' '}
                  <span className="text-muted">discussion{community.postCount === 1 ? '' : 's'}</span>
                </dd>
              </div>
            </dl>
          </div>
        </Container>
      </div>

      <Container className="py-8">
        <Suspense fallback={<div className="h-11 border-b border-line" />}>
          <Tabs items={tabs} label="Community sections" />
        </Suspense>

        <div className="pt-8">
          {/* ── Discussion ─────────────────────────────────────────────── */}
          {tab === 'discussion' && (
            <Section
              title="Discussions"
              description={community.isMember ? undefined : 'Join to take part.'}
              action={community.isMember ? <PostComposer communityId={community.id} /> : undefined}
            >
              {!readable ? (
                <EmptyState title="Members only" description="Join this community to see and take part in its discussions." />
              ) : discussions.length === 0 ? (
                <EmptyState
                  title="No discussions yet"
                  description={community.isMember
                    ? 'Start one — a question is as good a beginning as an answer.'
                    : 'Join to start the first one.'}
                />
              ) : (
                <ul className="divide-y divide-line rounded-card border border-line bg-surface px-5">
                  {discussions.map((p) => (
                    <li key={p.id} className="py-4">
                      <Link href={`/community/${slug}/posts/${p.id}`} className="focus-ring rounded-sm font-medium hover:text-accent-strong">
                        {p.title}
                      </Link>
                      <p className="mt-1 line-clamp-2 text-sm text-muted">{p.body}</p>
                      <p className="mt-1 text-xs text-muted-2">
                        {p.commentCount} repl{p.commentCount === 1 ? 'y' : 'ies'} · <RelativeTime value={p.createdAt} />
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          )}

          {/* ── Cases ──────────────────────────────────────────────────── */}
          {tab === 'cases' && (
            <Section
              title="Cases in this community"
              description="Scoped to this community by their authors. The same visibility rules apply — you see only what you are entitled to."
            >
              {communityCases.length === 0 ? (
                <EmptyState
                  title="No cases here yet"
                  description="Someone can scope a case to this community when they open it, or later from the case itself. Private cases never appear here."
                />
              ) : (
                <ul className="grid gap-4 md:grid-cols-2">
                  {communityCases.map((c) => <li key={c.id}><CaseCard case={c} /></li>)}
                </ul>
              )}
            </Section>
          )}

          {/* ── Members ────────────────────────────────────────────────── */}
          {tab === 'members' && (
            <Section title="Members" description="Only members can see who else is here.">
              {members.length === 0 ? (
                <EmptyState title="No active members" description="Nobody has joined yet." />
              ) : (
                // Handles are not shown: the membership list tells you a community's size,
                // not who is in it. Belonging to a group about family opposition is itself
                // sensitive, and nobody joined expecting to be listed.
                <>
                  <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {members.map((m) => (
                      <li key={m.id} className="rounded-card border border-line bg-surface px-4 py-3">
                        <p className="text-sm font-medium">{m.role === 'MEMBER' ? 'Member' : m.role.toLowerCase()}</p>
                        {m.joinedAt && <p className="mt-0.5 text-xs text-muted-2">Joined <RelativeTime value={m.joinedAt} /></p>}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 max-w-2xl text-sm text-muted">
                    Members are listed by their standing, not by name. Being part of a group about
                    family opposition is itself sensitive, and nobody joined expecting a roster.
                  </p>
                </>
              )}
            </Section>
          )}

          {/* ── Manage ─────────────────────────────────────────────────── */}
          {tab === 'manage' && canManage && (
            <Section
              title="Managing this community"
              description="Yours to look after. These powers stop at this community — they are not platform moderation."
            >
              <ManagePanel community={community} pending={pendingMembers} />
            </Section>
          )}

          {/* ── About ──────────────────────────────────────────────────── */}
          {tab === 'about' && (
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                {community.purpose && (
                  <Section title="What this community is for" as="h2">
                    <p className="whitespace-pre-line text-body leading-relaxed">{community.purpose}</p>
                  </Section>
                )}
                <Section title="Rules here" as="h2">
                  {community.rules ? (
                    <p className="whitespace-pre-line text-body leading-relaxed">{community.rules}</p>
                  ) : (
                    <p className="text-muted">This community has not set rules of its own.</p>
                  )}
                  <Card className="mt-4">
                    <CardBody>
                      <p className="text-sm leading-relaxed text-muted">
                        The platform rules apply here whatever a community writes: no threats, no
                        harassment, and nothing about people who have not agreed to appear. A
                        community&rsquo;s own rules add to those; they cannot relax them.
                      </p>
                    </CardBody>
                  </Card>
                </Section>
              </div>

              <aside className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Stat value={community.memberCount} label="Members" />
                  <Stat value={community.postCount} label="Discussions" />
                </div>
                <Card>
                  <CardBody>
                    <CardTitle className="text-base">Access</CardTitle>
                    <dl className="mt-3 space-y-2 text-sm">
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted">Visibility</dt>
                        <dd>{community.visibility === 'PRIVATE' ? 'Private' : 'Public'}</dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted">Joining</dt>
                        <dd>{POLICY_LABEL[community.joinPolicy]}</dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted">Created</dt>
                        <dd><RelativeTime value={community.createdAt} /></dd>
                      </div>
                    </dl>
                  </CardBody>
                </Card>
              </aside>
            </div>
          )}
        </div>
      </Container>
    </>
  );
}
