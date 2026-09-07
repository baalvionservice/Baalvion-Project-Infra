import { Badge, Card, CardBody, CardTitle, RelativeTime, StatLine, VisibilityBadge } from '@/components/ui';
import { CASE_STATUS, SUPPORT_NEED } from '@/lib/case-status';
import type { CaseSummary } from '@/lib/api/types';

/** Kept exported: several screens label support needs from the same map. */
export const NEED_LABEL = SUPPORT_NEED;

/**
 * A case as it appears in a list.
 *
 * It renders only what the server chose to send. At SUMMARY level the payload carries no
 * `situation`, no `ownerId` and no participants at all — so there is nothing here to reveal
 * by accident. Location and community appear only when the case has them, which happens
 * only when its author put them there.
 *
 * The support count is stated as a fact, never styled as a score. This is somebody's family
 * situation, not a post competing for attention.
 */
export function CaseCard({
  case: c, communityName, as: Heading = 'h2',
}: { case: CaseSummary; communityName?: string | null; as?: 'h2' | 'h3' }) {
  const status = CASE_STATUS[c.status];
  const place = [c.region, c.countryCode].filter(Boolean).join(', ');

  return (
    <Card href={`/cases/${c.id}`} className="h-full">
      <CardBody className="flex h-full flex-col">
        <div className="flex flex-wrap items-center gap-2">
          <VisibilityBadge visibility={c.visibility} />
          <Badge tone={status.tone}>{status.label}</Badge>
          <span className="ml-auto font-mono text-xs text-muted-2">{c.reference}</span>
        </div>

        <CardTitle as={Heading} className="mt-3 text-base">{c.title}</CardTitle>
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">{c.summary}</p>

        {c.supportNeeded.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {c.supportNeeded.slice(0, 3).map((n) => (
              <li key={n}><Badge tone="accent">{SUPPORT_NEED[n] ?? n.toLowerCase()}</Badge></li>
            ))}
            {c.supportNeeded.length > 3 && <li><Badge>+{c.supportNeeded.length - 3}</Badge></li>}
          </ul>
        )}

        <div className="mt-auto pt-4">
          <StatLine
            items={[
              c.supporterCount === 0 ? null : `${c.supporterCount} supporting`,
              c.commentCount === 0 ? null : `${c.commentCount} comment${c.commentCount === 1 ? '' : 's'}`,
              communityName || null,
              place || null,
            ]}
          />
          <p className="mt-1 text-xs text-muted-2">
            Opened <RelativeTime value={c.createdAt} />
          </p>
        </div>
      </CardBody>
    </Card>
  );
}
