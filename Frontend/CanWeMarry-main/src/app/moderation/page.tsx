import { moderation } from '@/lib/api';
import { serverOptions } from '@/lib/api/server';
import { StaffBoundary } from './staff-boundary';
import { QueueHealthPanel } from '@/components/moderation/queue-health';
import { privateMetadata } from '@/lib/seo';

export const metadata = privateMetadata('Moderation overview');
// A moderator deciding what to do next needs the queue as it is, not as it was cached.
export const dynamic = 'force-dynamic';

/**
 * What a moderator sees first.
 *
 * One request, answered by aggregates on the server. The alternative — fetching the queue
 * and counting it in the browser — would be both slower and wrong: it would count only the
 * page that happened to be fetched while looking like a count of everything.
 *
 * Nothing on this page identifies anybody or quotes any content. Opening a report is a
 * deliberate act with an audit trail behind it; walking past a screen should not be.
 */
export default async function ModerationOverviewPage() {
  const result = await moderation.summary(await serverOptions());

  return (
    <StaffBoundary error={result.ok ? null : result.error}>
      {result.ok ? <QueueHealthPanel summary={result.data} /> : null}
    </StaffBoundary>
  );
}
