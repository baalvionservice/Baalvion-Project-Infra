import Link from 'next/link';
import { Card, CardBody, CardTitle, RelativeTime } from '@/components/ui';
import type { OperationsSummary } from '@/lib/api/types';

/**
 * The state of the queue, in the four numbers that decide what to do next.
 *
 * Everything here is a count or an age. No case titles, no names, no report details — a
 * dashboard sits on a screen and is read by whoever walks past it, so it says "3 reports
 * require review" and never what they are about.
 *
 * There is also deliberately nothing here about WHO has been working: no per-moderator
 * totals, no resolution counts by person, no streaks. Careful review takes as long as it
 * takes, and a number that rewards speed would make the queue less safe rather than more.
 */

const REASON_LABEL: Record<string, string> = {
  HARASSMENT: 'Harassment',
  THREAT_OR_VIOLENCE: 'Threat or violence',
  PRIVACY_VIOLATION: 'Privacy violation',
  IMPERSONATION: 'Impersonation',
  SPAM: 'Spam',
  HATE_SPEECH: 'Hate speech',
  SELF_HARM_RISK: 'Self-harm risk',
  COERCION: 'Coercion',
  OFF_TOPIC: 'Off topic',
  OTHER: 'Other',
};

/** An age in hours, said the way a person would say it. */
function age(hours: number | null): string {
  if (hours === null) return 'nothing waiting';
  if (hours < 1) return 'under an hour';
  if (hours < 48) return `${Math.round(hours)} hours`;
  return `${Math.round(hours / 24)} days`;
}

/**
 * The oldest waiting report is the honest measure of whether the queue is safe: forty
 * reports with the oldest an hour old is fine, two with the oldest a week old is not.
 */
function queueTone(hours: number | null, critical: number): { tone: string; note: string } {
  if (critical > 0) return { tone: 'text-danger', note: 'Reports about safety are waiting.' };
  if (hours === null) return { tone: 'text-muted', note: 'Nothing is waiting for review.' };
  if (hours > 72) return { tone: 'text-danger', note: 'Something has been waiting several days.' };
  if (hours > 24) return { tone: 'text-warn', note: 'Something has been waiting over a day.' };
  return { tone: 'text-muted', note: 'The queue is current.' };
}

export function QueueHealthPanel({ summary }: { summary: OperationsSummary }) {
  const { queue, suspensions, recentActions, awaitingByReason } = summary;
  const { tone, note } = queueTone(queue.oldestOpenHours, queue.critical);

  const figures = [
    { label: 'Awaiting review', value: queue.awaiting, href: '/moderation/queue?unresolved=true' },
    { label: 'About someone’s safety', value: queue.critical, href: '/moderation/queue?severity=CRITICAL&unresolved=true', urgent: queue.critical > 0 },
    { label: 'Decided in the last 7 days', value: queue.resolvedLast7Days, href: '/moderation/queue?status=ACTIONED' },
    { label: 'Suspensions in force', value: suspensions.active, href: '/moderation/suspensions' },
  ];

  return (
    <div className="space-y-6">
      <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {figures.map((f) => (
          <div key={f.label} className="rounded-card border border-line bg-surface">
            <Link href={f.href} className="focus-ring block rounded-card px-5 py-4">
              <dt className="text-sm text-muted">{f.label}</dt>
              <dd className={`mt-1 font-display text-3xl tabular-nums ${f.urgent ? 'text-danger' : ''}`}>
                {f.value}
              </dd>
            </Link>
          </div>
        ))}
      </dl>

      <Card>
        <CardBody>
          <CardTitle as="h2" className="text-base">How long people are waiting</CardTitle>
          <p className={`mt-2 text-ui ${tone}`}>
            Oldest report still waiting: <strong>{age(queue.oldestOpenHours)}</strong>. {note}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Reports about threats, coercion or self-harm risk are raised to the top of the
            queue automatically when they are filed — they are not waiting on triage.
          </p>
        </CardBody>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardBody>
            <CardTitle as="h2" className="text-base">What is waiting</CardTitle>
            {awaitingByReason.length === 0 ? (
              <p className="mt-2 text-sm text-muted">Nothing is waiting for review.</p>
            ) : (
              <ul className="mt-3 divide-y divide-line">
                {awaitingByReason.map((r) => (
                  <li key={`${r.reason}-${r.severity}`} className="flex items-center gap-3 py-2">
                    <span className="text-sm">{REASON_LABEL[r.reason] ?? r.reason}</span>
                    {r.severity === 'CRITICAL' && (
                      <span className="rounded-full border border-danger px-2 py-0.5 text-xs font-medium text-danger">
                        safety
                      </span>
                    )}
                    <span className="ml-auto tabular-nums text-sm text-muted">{r.count}</span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-xs text-muted-2">
              Categories only. What a report is about is on the report.
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <CardTitle as="h2" className="text-base">Recent decisions</CardTitle>
            {recentActions.length === 0 ? (
              <p className="mt-2 text-sm text-muted">No moderation actions have been recorded yet.</p>
            ) : (
              <ul className="mt-3 divide-y divide-line">
                {recentActions.map((a, i) => (
                  <li key={`${a.at}-${i}`} className="flex items-center gap-3 py-2 text-sm">
                    <span className="font-medium">{a.action.replace(/_/g, ' ').toLowerCase()}</span>
                    <span className="text-muted">{a.targetType.toLowerCase()}</span>
                    <span className="ml-auto text-xs text-muted-2"><RelativeTime value={a.at} /></span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-xs leading-relaxed text-muted-2">
              What was decided, not who decided it. Who acted is recorded against every action
              in the{' '}
              <Link href="/moderation/history" className="focus-ring rounded-sm underline underline-offset-2">
                moderation log
              </Link>
              , where it is attributable and reviewable.
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
