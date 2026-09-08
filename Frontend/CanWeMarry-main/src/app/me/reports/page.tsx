
import {
  Badge, Breadcrumbs, ButtonLink, Card, CardBody, Container,
  EmptyState, ErrorState, Pagination, RelativeTime,
} from '@/components/ui';
import { PageHeader } from '@/components/site/page-header';
import { me } from '@/lib/api';
import { serverOptions } from '@/lib/api/server';
import type { ReporterReport } from '@/lib/api/types';
import { privateMetadata } from '@/lib/seo';

export const metadata = privateMetadata('Your reports');
export const dynamic = 'force-dynamic';

const STATUS: Record<string, { label: string; tone: 'neutral' | 'accent' | 'ok' | 'warn'; blurb: string }> = {
  OPEN: { label: 'Waiting for review', tone: 'accent', blurb: 'A moderator has not looked at this yet.' },
  TRIAGED: { label: 'Being looked at', tone: 'warn', blurb: 'A moderator has seen it and is working on it.' },
  ACTIONED: { label: 'Action taken', tone: 'ok', blurb: 'A moderator acted on this report.' },
  DISMISSED: { label: 'No action taken', tone: 'neutral', blurb: 'A moderator reviewed it and decided nothing was needed.' },
};

const REASON_LABEL: Record<string, string> = {
  HARASSMENT: 'Harassment', THREAT_OR_VIOLENCE: 'Threat or violence',
  PRIVACY_VIOLATION: 'Privacy violation', IMPERSONATION: 'Impersonation', SPAM: 'Spam',
  HATE_SPEECH: 'Hate speech', SELF_HARM_RISK: 'Risk of self-harm', COERCION: 'Coercion',
  OFF_TOPIC: 'Off topic', OTHER: 'Something else',
};

export default async function MyReportsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const result = await me.reports({ page, pageSize: 25 }, await serverOptions());

  if (!result.ok) {
    const signedOut = result.error.status === 401;
    return (
      <Container width="prose" className="py-16">
        <ErrorState
          as="h1"
          title={signedOut ? 'You are not signed in' : 'Could not load your reports'}
          message={signedOut ? 'Sign in to see the reports you have submitted.' : result.error.message}
          action={<ButtonLink href={signedOut ? '/login' : '/me/reports'} variant="secondary">
            {signedOut ? 'Sign in' : 'Try again'}
          </ButtonLink>}
        />
      </Container>
    );
  }

  const reports: ReporterReport[] = result.data;
  const pagination = result.meta.pagination;

  return (
    <>
      <PageHeader
        title="Your reports"
        lead="What happened to the things you reported. Your name is never shown to the person you reported."
      />

      <Container width="prose" className="py-10">
        <Breadcrumbs items={[{ href: '/', label: 'Home' }, { label: 'Your reports' }]} />

        {reports.length === 0 ? (
          <EmptyState
            title="You have not reported anything"
            description="If something here feels unsafe, dishonest or aimed at a person who did not agree to be involved, report it — the report button is on every case, post and comment."
            action={<ButtonLink href="/safety" variant="secondary">How reporting works</ButtonLink>}
          />
        ) : (
          <>
            <ul className="space-y-3">
              {reports.map((r) => {
                const status = STATUS[r.status] ?? { label: r.status, tone: 'neutral' as const, blurb: '' };
                return (
                  <li key={r.id}>
                    <Card>
                      <CardBody>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge tone={status.tone}>{status.label}</Badge>
                          <Badge>{REASON_LABEL[r.reason] ?? r.reason.toLowerCase()}</Badge>
                          <Badge>{r.targetType.toLowerCase()}</Badge>
                          <span className="ml-auto text-xs text-muted-2">
                            Reported <RelativeTime value={r.createdAt} />
                          </span>
                        </div>
                        <p className="mt-3 text-sm leading-relaxed text-muted">{status.blurb}</p>
                        {r.resolvedAt && (
                          <p className="mt-1 text-xs text-muted-2">Closed <RelativeTime value={r.resolvedAt} /></p>
                        )}
                      </CardBody>
                    </Card>
                  </li>
                );
              })}
            </ul>
            {pagination && (
              <Pagination page={pagination.page} totalPages={pagination.totalPages} total={pagination.total} label="reports" />
            )}
          </>
        )}

        {/* Explains an absence people notice and would otherwise read as evasion. */}
        <p className="mt-8 text-sm leading-relaxed text-muted">
          You can see whether a report was acted on, but not what a moderator wrote about it or
          which action they took. Those notes often concern someone else&rsquo;s account, and
          they are not ours to hand over.
        </p>
      </Container>
    </>
  );
}