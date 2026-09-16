
import Link from 'next/link';
import { Badge, Breadcrumbs, Card, CardBody, CardTitle, RelativeTime, Section } from '@/components/ui';
import { moderation } from '@/lib/api';
import { serverOptions } from '@/lib/api/server';
import type { ModerationActionRecord, Report } from '@/lib/api/types';
import { StaffBoundary } from '../../staff-boundary';
import { ReviewPanel } from '@/components/moderation/review-panel';
import { privateMetadata } from '@/lib/seo';

export const metadata = privateMetadata('Report');
export const dynamic = 'force-dynamic';

const SEVERITY_TONE = { CRITICAL: 'danger', HIGH: 'warn', NORMAL: 'neutral', LOW: 'neutral' } as const;

/** Where the reported thing actually lives, so a moderator can read it before deciding. */
const targetHref = (r: Report) =>
  r.targetType === 'CASE' ? `/cases/${r.targetId}` : null;

export default async function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const options = await serverOptions();

  const result = await moderation.report(id, options);
  if (!result.ok) return <StaffBoundary error={result.error}>{null}</StaffBoundary>;

  const report = result.data as Report;
  const historyResult = await moderation.history(
    { targetType: report.targetType, targetId: report.targetId, pageSize: 20 },
    options,
  );
  const history = (historyResult.ok ? historyResult.data : []) as ModerationActionRecord[];
  const href = targetHref(report);

  return (
    <div className="space-y-8">
      <Breadcrumbs items={[
        { href: '/moderation', label: 'Report queue' },
        { label: report.reason.replace(/_/g, ' ').toLowerCase() },
      ]} />

      <Card>
        <CardBody>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={SEVERITY_TONE[report.severity]}>{report.severity.toLowerCase()}</Badge>
            <Badge>{report.reason.replace(/_/g, ' ').toLowerCase()}</Badge>
            <Badge>{report.status.toLowerCase()}</Badge>
            <span className="ml-auto text-xs text-muted-2">Reported <RelativeTime value={report.createdAt} /></span>
          </div>

          <CardTitle as="h2" className="mt-4 text-lg">
            A {report.targetType.toLowerCase()} was reported
          </CardTitle>

          {report.details ? (
            <p className="mt-3 whitespace-pre-line leading-relaxed">{report.details}</p>
          ) : (
            <p className="mt-3 text-sm text-muted">The reporter left no further explanation.</p>
          )}

          <p className="mt-4 font-mono text-xs text-muted-2">{report.targetType} {report.targetId}</p>

          {href && (
            <Link href={href} className="focus-ring mt-3 inline-block rounded-sm text-sm font-medium text-accent-strong underline underline-offset-2">
              Open the reported {report.targetType.toLowerCase()}
            </Link>
          )}

          {report.resolutionNote && (
            <div className="mt-5 rounded-md border border-line bg-ground p-3">
              <p className="text-xs font-medium text-muted">Previous note</p>
              <p className="mt-1 text-sm leading-relaxed">{report.resolutionNote}</p>
            </div>
          )}
        </CardBody>
      </Card>

      <Section title="Review" as="h2">
        <ReviewPanel report={report} />
      </Section>

      <Section title="What has already happened to this content" as="h2">
        {history.length === 0 ? (
          <p className="text-sm text-muted">No moderation action has been taken on it yet.</p>
        ) : (
          <ul className="space-y-2">
            {history.map((m) => (
              <li key={m.id} className="rounded-card border border-line bg-surface p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="accent">{m.action.replace(/_/g, ' ').toLowerCase()}</Badge>
                  <span className="ml-auto text-xs text-muted-2"><RelativeTime value={m.createdAt} /></span>
                </div>
                <p className="mt-2 text-sm leading-relaxed">{m.reason}</p>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}