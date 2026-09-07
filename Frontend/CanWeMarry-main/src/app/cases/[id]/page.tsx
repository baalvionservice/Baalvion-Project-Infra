
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Badge, Breadcrumbs, ButtonLink, Card, CardBody, CardTitle, Container,
  ErrorState, RelativeTime, Section, VisibilityBadge,
} from '@/components/ui';
import { CaseActions } from '@/components/cases/case-actions';
import { SupportPanel } from '@/components/cases/support-panel';
import { ParticipantsPanel } from '@/components/cases/participants-panel';
import { InvitePanel } from '@/components/cases/invite-panel';
import { CaseUpdates } from '@/components/cases/case-updates';
import { Reactions } from '@/components/cases/reactions';
import { RelatedPanel } from '@/components/cases/related-panel';
import { OwnerGuide } from '@/components/cases/owner-guide';
import { CommentThread } from '@/components/comments/comment-thread';
import { NEED_LABEL } from '@/components/cases/case-card';
import { cases, communities, identity as identityApi } from '@/lib/api';
import { serverOptions } from '@/lib/api/server';
import type { CaseDetail, CaseSummary, Participant, RelatedContent, Supporter } from '@/lib/api/types';
import { privateMetadata } from '@/lib/seo';

export const metadata = privateMetadata('Case');
export const dynamic = 'force-dynamic';

const isDetail = (c: CaseSummary | CaseDetail): c is CaseDetail => c.viewLevel !== 'SUMMARY';

const STATUS_TONE = {
  OPEN: 'accent', ON_HOLD: 'warn', RESOLVED: 'ok', CLOSED: 'neutral', DRAFT: 'neutral',
} as const;

export default async function CasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const options = await serverOptions();

  const result = await cases.get(id, options);
  // The service returns 404 for a case the caller may not see, so an unauthorized read and
  // a genuinely missing case are indistinguishable here — which is the intended behaviour.
  if (!result.ok && result.error.status === 404) notFound();

  if (!result.ok) {
    return (
      <Container className="py-16">
        <ErrorState message={result.error.message} action={<ButtonLink href="/cases" variant="secondary">Back to cases</ButtonLink>} />
      </Container>
    );
  }

  const c = result.data;
  const detail = isDetail(c) ? c : null;

  // Everything below is fetched with the caller's own cookies, so each call applies its own
  // authorization. A panel that the reader may not see simply comes back empty.
  const [meResult, supportersResult, communityResult, invitationsResult, relatedResult] = await Promise.all([
    identityApi.me(options),
    detail ? cases.supporters(id, options) : Promise.resolve(null),
    // Fetched by id. This used to list up to 100 communities and match client-side, because
    // there was no by-id route — wrong past one page of results, and a wasted query on every
    // case view.
    c.communityId ? communities.get(c.communityId, options) : Promise.resolve(null),
    // Owner-only on the server; a non-owner simply gets nothing back.
    detail ? cases.invitations(id, options) : Promise.resolve(null),
    cases.related(id, options),
  ]);

  const viewerId = meResult.ok ? meResult.data.userId : null;
  const caseInvitations = invitationsResult?.ok ? invitationsResult.data : [];
  const isOwner = Boolean(detail && viewerId && detail.ownerId === viewerId);
  const supporters: Supporter[] = supportersResult?.ok ? supportersResult.data : [];
  const participants: Participant[] = detail?.participants ?? [];
  const community = communityResult?.ok ? communityResult.data : null;
  const related: RelatedContent | null = relatedResult.ok ? relatedResult.data : null;

  // Mirrors domain/visibility.canComment. The server decides for real; this only picks the
  // right explanation instead of showing a composer that would fail.
  const isParticipant = participants.some((p) => p.isSelf && ['SELF', 'GRANTED'].includes(p.consentStatus));
  const isSupporter = Boolean(viewerId && supporters.some((s) => s.userId === viewerId && s.status === 'ACCEPTED'));
  const canComment = Boolean(viewerId) && !c.isLocked && (isOwner || isParticipant || isSupporter);
  const commentReason = !viewerId
    ? 'Sign in to take part in this discussion.'
    : c.isLocked
      ? 'This case has been locked by a moderator. No new comments can be added.'
      : 'Only people taking part in this case, or its community, can comment on it.';

  const place = [c.region, c.countryCode].filter(Boolean).join(', ');

  return (
    <>
      {/* ── Case header ────────────────────────────────────────────────── */}
      <div className="border-b border-line bg-surface">
        <Container className="py-8 sm:py-10">
          <Breadcrumbs items={[{ href: '/', label: 'Home' }, { href: '/cases', label: 'Cases' }, { label: c.reference }]} />

          <div className="flex flex-wrap items-center gap-2">
            <VisibilityBadge visibility={c.visibility} />
            <Badge tone={STATUS_TONE[c.status]}>{c.status.replace('_', ' ').toLowerCase()}</Badge>
            {c.isLocked && <Badge tone="warn">Locked</Badge>}
            <span className="ml-auto font-mono text-xs text-muted-2">{c.reference}</span>
          </div>

          <h1 className="heading mt-4 text-3xl sm:text-4xl">{c.title}</h1>
          <p className="mt-3 max-w-2xl text-body leading-relaxed text-muted">{c.summary}</p>

          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-2">
            <span>{c.supporterCount} supporter{c.supporterCount === 1 ? '' : 's'}</span>
            <span>{c.commentCount} comment{c.commentCount === 1 ? '' : 's'}</span>
            {place && <span>{place}</span>}
            <span>Opened <RelativeTime value={c.createdAt} /></span>
          </div>

          <div className="mt-6"><CaseActions caseId={c.id} isOwner={isOwner} isLocked={c.isLocked} /></div>
        </Container>
      </div>

      <Container className="grid gap-10 py-10 lg:grid-cols-3">
        {/* ── Main column ──────────────────────────────────────────────── */}
        <div className="space-y-12 lg:col-span-2">
          <Section title="The situation" as="h2">
            {detail?.situation ? (
              <article className="whitespace-pre-line text-body leading-relaxed">{detail.situation}</article>
            ) : (
              // Not an error: the summary is all a non-participant is entitled to, and
              // saying so reads better than an empty column that looks broken.
              <p className="rounded-card border border-dashed border-line-strong px-5 py-6 text-sm text-muted">
                The full account of this case is shared only with the people taking part in it.
              </p>
            )}

            {c.supportNeeded.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium">Support asked for</h3>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {c.supportNeeded.map((n) => (
                    <li key={n}><Badge tone="accent">{NEED_LABEL[n] ?? n.toLowerCase()}</Badge></li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-6"><Reactions targetType="CASE" targetId={c.id} /></div>
          </Section>

          <Section title="Updates" description="Posted by the person who opened this case." as="h2">
            <CaseUpdates caseId={c.id} isOwner={isOwner} isLocked={c.isLocked} />
          </Section>

          <Section title="Discussion" as="h2">
            <CommentThread targetType="CASE" targetId={c.id} canComment={canComment} cannotCommentReason={commentReason} />
          </Section>

          {related && <RelatedPanel related={related} />}
        </div>

        {/* ── Sidebar ──────────────────────────────────────────────────── */}
        <aside className="space-y-5">
          {/* The owner's own settings, spelled out. Somebody deciding how much of their
              family situation to expose should not have to infer the rules from a badge. */}
          {isOwner && detail && <OwnerGuide case={detail} />}

          <SupportPanel case={c} supporters={supporters} isOwner={isOwner} />

          {detail ? (
            <>
              <ParticipantsPanel caseId={c.id} participants={participants} isOwner={isOwner} />
              {isOwner && <InvitePanel caseId={c.id} invitations={caseInvitations} />}
            </>
          ) : (
            <Card>
              <CardBody>
                <CardTitle className="text-base">People in this case</CardTitle>
                <p className="mt-2 text-sm text-muted">Who is involved in a case is never shown outside it.</p>
              </CardBody>
            </Card>
          )}

          {community && (
            <Card>
              <CardBody>
                <CardTitle className="text-base">Community</CardTitle>
                <p className="mt-2 text-sm font-medium">{community.name}</p>
                {community.description && <p className="mt-1 text-sm text-muted">{community.description}</p>}
                <Link href={`/community/${community.slug}`} className="focus-ring mt-3 inline-block rounded-sm text-sm font-medium text-accent-strong underline underline-offset-2">
                  View community
                </Link>
              </CardBody>
            </Card>
          )}

          <Card>
            <CardBody>
              <CardTitle className="text-base">Safety</CardTitle>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                If something here is a threat, a privacy violation, or puts someone at risk, report it
                and a moderator will look. If anyone is in immediate danger, contact your local
                emergency number — this platform cannot respond quickly.
              </p>
              <Link href="/resources?category=SAFETY" className="focus-ring mt-3 inline-block rounded-sm text-sm font-medium text-accent-strong underline underline-offset-2">
                Safety resources
              </Link>
            </CardBody>
          </Card>
        </aside>
      </Container>
    </>
  );
}