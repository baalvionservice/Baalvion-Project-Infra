import { Badge, Card, CardBody, CardTitle, EmptyState, RelativeTime } from '@/components/ui';
import { moderation } from '@/lib/api';
import { serverOptions } from '@/lib/api/server';
import { StaffBoundary } from '../staff-boundary';
import { privateMetadata } from '@/lib/seo';

export const metadata = privateMetadata('Suspensions');
export const dynamic = 'force-dynamic';

/**
 * Suspensions, reported as the platform actually enforces them.
 *
 * This screen exists because the stored state and the enforced state disagree, and only one
 * of them answers the question a moderator is asking.
 *
 * `users.status` is set to SUSPENDED when a suspension is applied and nothing ever sets it
 * back — there is no sweeper and no scheduled job. What the authentication middleware
 * actually checks on every request is:
 *
 *     status = 'SUSPENDED' AND (suspended_until IS NULL OR suspended_until > now())
 *
 * so a suspension with a past expiry stops blocking access by itself, while the column still
 * reads SUSPENDED. Showing the column would tell a moderator somebody is locked out when
 * they are not — so the effective state leads, and the stale column is shown beside it and
 * explained rather than hidden.
 *
 * Accounts are listed by identifier only. Why somebody was suspended is on the moderation
 * action, with the written reason that made it reviewable.
 */
export default async function SuspensionsPage() {
  const result = await moderation.summary(await serverOptions());
  const suspensions = result.ok ? result.data.suspensions : null;

  return (
    <StaffBoundary error={result.ok ? null : result.error}>
      {suspensions && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-card border border-line bg-surface px-5 py-4">
              <p className="text-sm text-muted">In force now</p>
              <p className="mt-1 font-display text-3xl tabular-nums">{suspensions.active}</p>
            </div>
            <div className="rounded-card border border-line bg-surface px-5 py-4">
              <p className="text-sm text-muted">Expired, record not cleared</p>
              <p className="mt-1 font-display text-3xl tabular-nums">{suspensions.expiredButNotCleared}</p>
            </div>
          </div>

          <Card>
            <CardBody>
              <CardTitle as="h2" className="text-base">How expiry works here</CardTitle>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                A suspension with an expiry stops blocking access the moment it passes — the
                check happens on every request, so access returns without anyone doing
                anything. What does <em>not</em> happen is the record being tidied up: the
                account row still reads <code className="text-xs">SUSPENDED</code> afterwards.
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                That is why the state below is shown as <strong>in force</strong> or{' '}
                <strong>expired</strong> rather than as the stored value. An expired
                suspension needs no action; lifting one early is a deliberate act with its own
                recorded reason.
              </p>
            </CardBody>
          </Card>

          {suspensions.items.length === 0 ? (
            <EmptyState title="No suspensions" description="No account is suspended, and none has an uncleared record." />
          ) : (
            <div className="overflow-x-auto rounded-card border border-line bg-surface">
              <table className="w-full min-w-[38rem] text-sm">
                <caption className="sr-only">
                  Accounts with a suspension record, showing whether it is still in force
                </caption>
                <thead>
                  <tr className="border-b border-line text-left text-muted">
                    <th scope="col" className="px-4 py-3 font-medium">Account</th>
                    <th scope="col" className="px-4 py-3 font-medium">State</th>
                    <th scope="col" className="px-4 py-3 font-medium">Expires</th>
                    <th scope="col" className="px-4 py-3 font-medium">Applied</th>
                  </tr>
                </thead>
                <tbody>
                  {suspensions.items.map((s) => (
                    <tr key={s.userId} className="border-b border-line last:border-0">
                      <td className="px-4 py-3 font-mono text-xs">{s.userId}</td>
                      <td className="px-4 py-3">
                        {/* The word carries the meaning; the tone only reinforces it. */}
                        <Badge tone={s.effectiveState === 'ACTIVE' ? 'warn' : 'neutral'}>
                          {s.effectiveState === 'ACTIVE' ? 'in force' : 'expired'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {s.indefinite ? 'No expiry set' : <RelativeTime value={s.expiresAt as string} />}
                      </td>
                      <td className="px-4 py-3 text-muted"><RelativeTime value={s.appliedAt} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="text-xs leading-relaxed text-muted-2">
            Accounts are listed by identifier. Why a suspension was applied is recorded against
            the moderation action, with the written reason that makes it reviewable.
          </p>
        </div>
      )}
    </StaffBoundary>
  );
}
