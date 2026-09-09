import { Badge, Card, CardBody, CardTitle, RelativeTime, StatLine } from '@/components/ui';
import type { Community } from '@/lib/api/types';

const POLICY_LABEL = {
  OPEN: 'Anyone can join',
  REQUEST: 'Join by request',
  INVITE: 'Invitation only',
} as const;

/**
 * A community as it appears in a list.
 *
 * The counts are server counts. An empty community says "No members yet" rather than
 * rounding up to something that sounds livelier — a hub that overstates its activity is
 * the same category of dishonesty as a fabricated testimonial, and it is the first thing
 * a careful reader checks.
 */
export function CommunityCard({ community: c, as: Heading = 'h3' }: { community: Community; as?: 'h2' | 'h3' }) {
  return (
    <Card href={`/community/${c.slug}`} className="h-full">
      <CardBody className="flex h-full flex-col">
        <div className="flex flex-wrap items-center gap-2">
          {c.visibility === 'PRIVATE' && <Badge tone="ok">Private</Badge>}
          <Badge>{POLICY_LABEL[c.joinPolicy]}</Badge>
          {c.isMember && <Badge tone="accent">Member</Badge>}
        </div>

        <CardTitle as={Heading} className="mt-3 text-base">{c.name}</CardTitle>

        {/* Purpose first when it exists: it is what somebody deciding whether to join
            actually needs, and the description is often just a restatement. */}
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">
          {c.purpose || c.description || 'No description yet.'}
        </p>

        <StatLine
          className="mt-auto pt-4"
          items={[
            c.memberCount === 0 ? 'No members yet' : `${c.memberCount} member${c.memberCount === 1 ? '' : 's'}`,
            c.postCount > 0 && `${c.postCount} discussion${c.postCount === 1 ? '' : 's'}`,
            [c.region, c.countryCode].filter(Boolean).join(', ') || null,
          ]}
        />
        {c.lastActivityAt && (
          <p className="mt-1 text-xs text-muted-2">Last discussion <RelativeTime value={c.lastActivityAt} /></p>
        )}
      </CardBody>
    </Card>
  );
}
