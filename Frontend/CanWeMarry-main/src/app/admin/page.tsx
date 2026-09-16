
import Link from 'next/link';
import { Card, CardBody, CardTitle } from '@/components/ui';
import { admin, moderation } from '@/lib/api';
import { serverOptions } from '@/lib/api/server';
import { StaffBoundary } from '../moderation/staff-boundary';
import { privateMetadata } from '@/lib/seo';

export const metadata = privateMetadata('Administration');
export const dynamic = 'force-dynamic';

const SECTIONS = [
  { href: '/admin/users', label: 'Users', blurb: 'Accounts and the standing they hold. Moderators may confer supporter and volunteer; only an administrator can appoint a moderator.' },
  { href: '/admin/cases', label: 'Cases', blurb: 'Every case, including drafts and withheld ones. The same visibility rules apply — staff simply satisfy all of them.' },
  { href: '/admin/reports', label: 'Reports', blurb: 'The safety queue. Threats, coercion and self-harm risk are raised to the top automatically.' },
  { href: '/admin/moderation', label: 'Moderation log', blurb: 'Every action taken, with the written reason that made it reviewable.' },
  { href: '/admin/audit', label: 'Audit trail', blurb: 'Administrative and moderation events. IP addresses are stored only as keyed hashes.' },
];

/**
 * The overview reads live counts rather than inventing metrics. Where an endpoint refuses,
 * the tile shows a dash — an administrator seeing "—" learns something true; a fabricated
 * zero would not.
 */
export default async function AdminOverviewPage() {
  const options = await serverOptions();
  const [usersResult, casesResult, queueResult] = await Promise.all([
    admin.users({ pageSize: 1 }, options),
    admin.cases({ pageSize: 1 }, options),
    moderation.queue({ status: 'OPEN', pageSize: 1 }, options),
  ]);

  // The user list is admin-only, so its refusal is the one that decides the boundary here.
  if (!usersResult.ok && (usersResult.error.status === 401 || usersResult.error.status === 403)) {
    return <StaffBoundary error={usersResult.error}>{null}</StaffBoundary>;
  }

  const stats = [
    { label: 'Accounts', value: usersResult.ok ? usersResult.meta.pagination?.total ?? 0 : null },
    { label: 'Cases', value: casesResult.ok ? casesResult.meta.pagination?.total ?? 0 : null },
    { label: 'Open reports', value: queueResult.ok ? queueResult.meta.pagination?.total ?? 0 : null },
  ];

  return (
    <div className="space-y-10">
      <dl className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-card border border-line bg-surface px-5 py-4">
            <dt className="text-sm text-muted">{s.label}</dt>
            <dd className="mt-1 font-display text-3xl tabular-nums">
              {s.value === null ? <span className="text-muted-2">—</span> : s.value}
            </dd>
          </div>
        ))}
      </dl>

      <ul className="grid gap-4 md:grid-cols-2">
        {SECTIONS.map((s) => (
          <li key={s.href}>
            <Link href={s.href} className="focus-ring block rounded-card">
              <Card className="h-full transition-shadow hover:shadow-lift">
                <CardBody>
                  <CardTitle as="h2" className="text-base">{s.label}</CardTitle>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{s.blurb}</p>
                </CardBody>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}