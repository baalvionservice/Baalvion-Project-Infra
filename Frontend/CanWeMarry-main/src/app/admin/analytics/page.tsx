import { Suspense } from 'react';
import { Card, CardBody, CardTitle, FilterBar } from '@/components/ui';
import { admin } from '@/lib/api';
import { serverOptions } from '@/lib/api/server';
import { StaffBoundary } from '../../moderation/staff-boundary';
import { privateMetadata } from '@/lib/seo';
import type { Analytics } from '@/lib/api/types';

export const metadata = privateMetadata('Analytics');
export const dynamic = 'force-dynamic';

const WINDOWS = [
  { value: '', label: 'Last 30 days' },
  { value: '24h', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },
  { value: '90d', label: 'Last 90 days' },
];

const REASON_LABEL: Record<string, string> = {
  HARASSMENT: 'Harassment', THREAT_OR_VIOLENCE: 'Threat or violence',
  PRIVACY_VIOLATION: 'Privacy violation', IMPERSONATION: 'Impersonation',
  SPAM: 'Spam', HATE_SPEECH: 'Hate speech', SELF_HARM_RISK: 'Self-harm risk',
  COERCION: 'Coercion', OFF_TOPIC: 'Off topic', OTHER: 'Other',
};

/**
 * A figure with its definition attached.
 *
 * The definition is not decoration and is not written here: it comes from the server with
 * the number, so a label on this page cannot describe a metric differently from the query
 * that produced it. `title` and the visible note carry the same text, so it is available to
 * a screen reader and to somebody who cannot hover.
 */
function Figure({ label, value, definition }: { label: string; value: string | number; definition?: string }) {
  return (
    <div className="rounded-card border border-line bg-surface px-5 py-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 font-display text-3xl tabular-nums">{value}</p>
      {definition && <p className="mt-2 text-xs leading-relaxed text-muted-2">{definition}</p>}
    </div>
  );
}

/**
 * A proportional bar with the number beside it.
 *
 * Not a chart library: a bar whose only content is its width would carry its meaning in a
 * visual property alone. The count is always present as text, and the bar is marked
 * `aria-hidden` because it repeats what the text already says.
 */
function Bar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100);
  return (
    <li className="py-2">
      <div className="flex items-baseline gap-3">
        <span className="text-sm">{label}</span>
        <span className="ml-auto tabular-nums text-sm text-muted">{value}</span>
      </div>
      <div aria-hidden="true" className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
        <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
      </div>
    </li>
  );
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ window?: string }>;
}) {
  const sp = await searchParams;
  const result = await admin.analytics({ window: sp.window || undefined }, await serverOptions());

  if (!result.ok) return <StaffBoundary error={result.error}>{null}</StaffBoundary>;
  const a: Analytics = result.data;
  const d = a.definitions;
  const maxReason = Math.max(0, ...a.reportsByReason.map((r) => r.count));

  return (
    <div className="space-y-10">
      <div>
        <Suspense fallback={<div className="h-11" />}>
          <FilterBar
            searchPlaceholder="Search is not available here"
            filters={[{ name: 'window', label: 'Period', options: WINDOWS }]}
          />
        </Suspense>
        <p className="text-sm text-muted">
          {a.window.label}, from {new Date(a.window.since).toISOString().replace('T', ' ').slice(0, 16)} {a.window.timezone}.
          Point-in-time figures — how many cases are open, how many suspensions are in force —
          describe now, not the period.
        </p>
      </div>

      <section aria-labelledby="an-safety">
        <h2 id="an-safety" className="heading text-lg">Safety</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Figure label="Reports filed" value={a.safety.reports} definition={d['safety.reports']} />
          <Figure label="Awaiting a decision" value={a.safety.open} definition={d['safety.open']} />
          <Figure label="About someone’s safety" value={a.safety.critical} definition={d['safety.critical']} />
          <Figure
            label="Median time to decide"
            value={a.safety.medianResolutionHours === null ? 'Not enough data' : `${a.safety.medianResolutionHours} h`}
            definition={d['safety.medianResolutionHours']}
          />
          <Figure label="Reports decided" value={a.safety.resolved} definition={d['safety.resolved']} />
          <Figure label="Moderation actions" value={a.safety.actions} definition={d['safety.actions']} />
          <Figure
            label="Oldest still waiting"
            value={a.safety.oldestOpenHours === null ? 'Nothing waiting' : `${a.safety.oldestOpenHours} h`}
            definition={d['safety.oldestOpenHours']}
          />
          <Figure label="Suspensions in force" value={a.users.suspended} definition={d['users.suspended']} />
        </div>

        {a.reportsByReason.length > 0 && (
          <Card className="mt-5">
            <CardBody>
              <CardTitle className="text-base">Reports by reason</CardTitle>
              <ul className="mt-3 divide-y divide-line">
                {a.reportsByReason.map((r) => (
                  <Bar key={r.reason} label={REASON_LABEL[r.reason] ?? r.reason} value={r.count} max={maxReason} />
                ))}
              </ul>
            </CardBody>
          </Card>
        )}
      </section>

      <section aria-labelledby="an-cases">
        <h2 id="an-cases" className="heading text-lg">Cases</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Figure label="Opened in this period" value={a.cases.created} definition={d['cases.created']} />
          <Figure label="Currently open" value={a.cases.opened} definition={d['cases.opened']} />
          <Figure label="Still drafts" value={a.cases.draft} definition={d['cases.draft']} />
          <Figure label="Marked resolved" value={a.cases.resolved} definition={d['cases.resolved']} />
          <Figure label="Closed" value={a.cases.closed} definition={d['cases.closed']} />
          <Figure label="Under review" value={a.cases.underReview} definition={d['cases.underReview']} />
        </div>
      </section>

      <section aria-labelledby="an-support">
        <h2 id="an-support" className="heading text-lg">Support</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Figure label="Offers made" value={a.support.offered} definition={d['support.offered']} />
          <Figure label="Currently accepted" value={a.support.accepted} definition={d['support.accepted']} />
          <Figure label="Withdrawn" value={a.support.withdrawn} definition={d['support.withdrawn']} />
          <Figure label="Supporters per open case" value={a.support.perOpenCase} definition={d['support.perOpenCase']} />
        </div>
      </section>

      <section aria-labelledby="an-community">
        <h2 id="an-community" className="heading text-lg">Communities</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Figure label="Communities" value={a.community.total} definition={d['community.total']} />
          <Figure label="Memberships" value={a.community.memberships} definition={d['community.memberships']} />
          <Figure label="With activity" value={a.community.withActivity} definition={d['community.withActivity']} />
          <Figure label="Posts" value={a.community.posts} definition={d['community.posts']} />
          <Figure label="Comments" value={a.community.comments} definition={d['community.comments']} />
        </div>
      </section>

      <section aria-labelledby="an-people">
        <h2 id="an-people" className="heading text-lg">People</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Figure label="Registered in this period" value={a.users.registered} definition={d['users.registered']} />
          <Figure label="Seen in this period" value={a.users.active} definition={d['users.active']} />
          <Figure label="Accounts in total" value={a.users.total} />
        </div>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted">
          These are counts of rows, never of named people, and there is no way to open one.
          Taking part here means having said that your family opposes your relationship — a
          screen that let staff browse that by person would be surveillance whatever it was
          called, so nothing on this page can be narrowed to an individual.
        </p>
      </section>
    </div>
  );
}
