
import Link from 'next/link';
import {
  Badge, Breadcrumbs, ButtonLink, Card, CardBody, CardTitle, Container,
  EmptyState, ErrorState, RelativeTime, Section, VisibilityBadge,
} from '@/components/ui';
import { PageHeader } from '@/components/site/page-header';
import { cases, me } from '@/lib/api';
import { serverOptions } from '@/lib/api/server';
import type { CaseSummary, Participant } from '@/lib/api/types';
import { privateMetadata } from '@/lib/seo';

export const metadata = privateMetadata('My cases');
export const dynamic = 'force-dynamic';

const GROUPS = [
  { key: 'DRAFT', title: 'Drafts', description: 'Visible to nobody but you. Open one when you are ready.' },
  { key: 'OPEN', title: 'Open', description: 'Accepting support and discussion.' },
  { key: 'ON_HOLD', title: 'On hold', description: 'Paused, and still private to the people already in them.' },
  { key: 'RESOLVED', title: 'Resolved', description: 'Situations that have moved on.' },
  { key: 'CLOSED', title: 'Closed', description: 'No longer active.' },
] as const;

function CaseRow({ c }: { c: CaseSummary }) {
  return (
    <li className="flex flex-wrap items-center gap-3 border-t border-line py-4 first:border-t-0">
      <div className="min-w-0 flex-1">
        <Link href={`/cases/${c.id}`} className="focus-ring rounded-sm font-medium hover:text-accent-strong">
          {c.title}
        </Link>
        <p className="mt-1 line-clamp-1 text-sm text-muted">{c.summary}</p>
        <p className="mt-1 text-xs text-muted-2">
          <span className="font-mono">{c.reference}</span> · {c.supporterCount} supporter
          {c.supporterCount === 1 ? '' : 's'} · {c.commentCount} comment{c.commentCount === 1 ? '' : 's'}
          {' · updated '}<RelativeTime value={c.updatedAt} />
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <VisibilityBadge visibility={c.visibility} />
        {/* Edit is offered only for a case this person owns — and every one on this page is
            theirs, because the list was fetched with mine=true and the server enforces it. */}
        <Link
          href={`/cases/${c.id}/edit`}
          className="focus-ring rounded-md border border-line-strong bg-surface px-3 py-1.5 text-sm hover:bg-surface-2"
        >
          {c.status === 'DRAFT' ? 'Continue' : 'Edit'}
        </Link>
      </div>
    </li>
  );
}

export default async function MyCasesPage() {
  const options = await serverOptions();
  const [result, invitationsResult, supportingResult] = await Promise.all([
    cases.list({ mine: true, pageSize: 100, status: undefined }, options),
    me.invitations(options),
    cases.list({ supporting: true, pageSize: 50 }, options),
  ]);

  if (!result.ok) {
    const signedOut = result.error.status === 401 || result.error.status === 403;
    return (
      <Container width="prose" className="py-16">
        <ErrorState
          as="h1"
          title={signedOut ? 'You are not signed in' : 'Could not load your cases'}
          message={signedOut ? 'Sign in to see the cases you have opened.' : result.error.message}
          action={<ButtonLink href={signedOut ? '/login' : '/my-cases'} variant="secondary">
            {signedOut ? 'Sign in' : 'Try again'}
          </ButtonLink>}
        />
      </Container>
    );
  }

  const all = result.data;
  const invitations: Participant[] = invitationsResult.ok ? invitationsResult.data : [];
  const supporting = supportingResult.ok ? supportingResult.data : [];

  return (
    <>
      <PageHeader
        title="My cases"
        lead="Everything you have written, and everything you have been asked to take part in."
        actions={
          <>
            <ButtonLink href="/invitations" variant="secondary">Invitations</ButtonLink>
            <ButtonLink href="/create-case">Open a case</ButtonLink>
          </>
        }
      />

      <Container className="space-y-12 py-10">
        <Breadcrumbs items={[{ href: '/', label: 'Home' }, { label: 'My cases' }]} />

        {/* Invitations first: somebody is waiting on an answer only this person can give. */}
        {invitations.length > 0 && (
          <Section title="Waiting for your answer" description="You have been invited to take part in these cases. Only you can accept or decline.">
            <ul className="grid gap-4 sm:grid-cols-2">
              {invitations.map((inv) => (
                <li key={inv.id}>
                  <Card>
                    <CardBody>
                      <Badge tone="accent">Invitation pending</Badge>
                      <CardTitle className="mt-3 text-base">You were invited as a {inv.relation.replace('_', ' ').toLowerCase()}</CardTitle>
                      <p className="mt-2 text-sm text-muted">
                        Open the case to accept or decline. Nobody else can answer on your behalf.
                      </p>
                      <ButtonLink href={`/cases/${inv.caseId}`} size="sm" variant="secondary" className="mt-4">
                        View the invitation
                      </ButtonLink>
                    </CardBody>
                  </Card>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {all.length === 0 ? (
          <EmptyState
            title="You have not opened a case yet"
            description="Writing down what is happening is a complete first step. It stays private until you decide otherwise."
            action={<ButtonLink href="/create-case">Open a case</ButtonLink>}
          />
        ) : (
          GROUPS.map((g) => {
            const items = all.filter((c) => c.status === g.key);
            if (items.length === 0) return null;
            return (
              <Section key={g.key} title={g.title} description={g.description}>
                <ul className="rounded-card border border-line bg-surface px-5">
                  {items.map((c) => <CaseRow key={c.id} c={c} />)}
                </ul>
              </Section>
            );
          })
        )}

        {supporting.length > 0 && (
          <Section title="Cases you support" description="You accepted an invitation to stand with these.">
            <ul className="grid gap-4 md:grid-cols-2">
              {supporting.map((c) => (
                <li key={c.id}>
                  <Card href={`/cases/${c.id}`} className="h-full">
                    <CardBody>
                      <VisibilityBadge visibility={c.visibility} />
                      <CardTitle className="mt-3 text-base">{c.title}</CardTitle>
                      <p className="mt-2 line-clamp-2 text-sm text-muted">{c.summary}</p>
                    </CardBody>
                  </Card>
                </li>
              ))}
            </ul>
          </Section>
        )}
      </Container>
    </>
  );
}