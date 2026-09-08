
import Link from 'next/link';
import {
  Badge, Breadcrumbs, ButtonLink, Card, CardBody, CardTitle, Container,
  EmptyState, ErrorState, RelativeTime, Section,
} from '@/components/ui';
import { PageHeader } from '@/components/site/page-header';
import { invitations, me } from '@/lib/api';
import { serverOptions } from '@/lib/api/server';
import type { Invitation, Participant } from '@/lib/api/types';
import { privateMetadata } from '@/lib/seo';

export const metadata = privateMetadata('Invitations');
export const dynamic = 'force-dynamic';

const RELATION_LABEL: Record<string, string> = {
  PARTNER: 'Partner', FAMILY_MEMBER: 'Family member', MEDIATOR: 'Mediator',
  LEGAL_ADVISOR: 'Legal adviser', COUNSELLOR: 'Counsellor', OTHER: 'Someone else', SELF: 'You',
};

const STATUS_TONE: Record<string, 'neutral' | 'accent' | 'ok' | 'warn'> = {
  PENDING: 'accent', ACCEPTED: 'ok', DECLINED: 'neutral', REVOKED: 'neutral', EXPIRED: 'warn',
};

const GROUPS = [
  { key: 'PENDING', title: 'Waiting to be used', blurb: 'Nobody has answered these yet. You can withdraw one at any time.' },
  { key: 'ACCEPTED', title: 'Accepted', blurb: 'These people joined the case. Who they are appears on the case itself.' },
  { key: 'DECLINED', title: 'Declined', blurb: 'Answered, and final. A new code would be needed.' },
  { key: 'EXPIRED', title: 'Expired', blurb: 'These stopped working on their own, so an old code cannot be used by whoever finds it.' },
  { key: 'REVOKED', title: 'Withdrawn', blurb: 'You withdrew these before they were used.' },
] as const;

export default async function InvitationsPage() {
  const options = await serverOptions();
  const [sentResult, receivedResult] = await Promise.all([
    invitations.sent(options),
    me.invitations(options),
  ]);

  if (!sentResult.ok) {
    const signedOut = sentResult.error.status === 401;
    return (
      <Container width="prose" className="py-16">
        <ErrorState
          as="h1"
          title={signedOut ? 'You are not signed in' : 'Could not load your invitations'}
          message={signedOut ? 'Sign in to see the invitations you have sent and received.' : sentResult.error.message}
          action={<ButtonLink href={signedOut ? '/login' : '/invitations'} variant="secondary">
            {signedOut ? 'Sign in' : 'Try again'}
          </ButtonLink>}
        />
      </Container>
    );
  }

  const sent: Invitation[] = sentResult.data;
  // Direct invitations addressed to this account — the older account-to-account path, which
  // is still how a participant row appears when somebody was invited by id.
  const received: Participant[] = receivedResult.ok ? receivedResult.data : [];

  return (
    <>
      <PageHeader
        title="Invitations"
        lead="Codes you have created, and invitations waiting for your answer. Nobody can answer an invitation on your behalf."
      />

      <Container className="space-y-12 py-10">
        <Breadcrumbs items={[{ href: '/', label: 'Home' }, { label: 'Invitations' }]} />

        {received.length > 0 && (
          <Section title="Waiting for your answer" description="Only you can accept or decline these.">
            <ul className="grid gap-4 sm:grid-cols-2">
              {received.map((inv) => (
                <li key={inv.id}>
                  <Card>
                    <CardBody>
                      <Badge tone="accent">Invitation pending</Badge>
                      <CardTitle as="h3" className="mt-3 text-base">
                        You were invited as {(RELATION_LABEL[inv.relation] ?? inv.relation).toLowerCase()}
                      </CardTitle>
                      <p className="mt-2 text-sm text-muted">
                        Open the case to accept or decline.
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

        {sent.length === 0 && received.length === 0 ? (
          <EmptyState
            title="No invitations yet"
            description="When you invite someone into one of your cases, the code appears here with its status. Invitations you receive show up here too."
            action={<ButtonLink href="/my-cases">Go to your cases</ButtonLink>}
          />
        ) : (
          GROUPS.map((g) => {
            const items = sent.filter((i) => i.status === g.key);
            if (items.length === 0) return null;
            return (
              <Section key={g.key} title={g.title} description={g.blurb}>
                <ul className="divide-y divide-line rounded-card border border-line bg-surface px-5">
                  {items.map((inv) => (
                    <li key={inv.id} className="flex flex-wrap items-center gap-3 py-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{RELATION_LABEL[inv.relation] ?? inv.relation}</p>
                        <p className="mt-1 text-xs text-muted-2">
                          Created <RelativeTime value={inv.createdAt} />
                          {inv.status === 'PENDING' && <> · expires <RelativeTime value={inv.expiresAt} /></>}
                          {inv.respondedAt && <> · answered <RelativeTime value={inv.respondedAt} /></>}
                        </p>
                      </div>
                      <Badge tone={STATUS_TONE[inv.status] ?? 'neutral'}>{inv.status.toLowerCase()}</Badge>
                      <Link href={`/cases/${inv.caseId}`}
                        className="focus-ring rounded-md border border-line-strong bg-ground px-3 py-1.5 text-sm hover:bg-surface-2">
                        Open case
                      </Link>
                    </li>
                  ))}
                </ul>
              </Section>
            );
          })
        )}

        {/* Stated once here rather than repeated on every row. */}
        <p className="max-w-2xl text-sm leading-relaxed text-muted">
          Invitation codes carry no name, email or phone number, and we never send them for you.
          A code is shown once when it is created; if you lose one, withdraw it and create
          another rather than trying to recover it.
        </p>
      </Container>
    </>
  );
}