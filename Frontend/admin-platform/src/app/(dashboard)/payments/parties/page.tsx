'use client';

import { useEffect, useState } from 'react';
import { Users, ShieldQuestion } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { usePartyReviews, useResolvePartyReview } from '@/lib/queries/payment-records.queries';
import { useUIStore } from '@/lib/store/uiStore';
import { formatDate } from '@/lib/utils/format';
import type { PartyReview } from '@/lib/api/payment-records';

/**
 * Identity matches a human has to settle.
 *
 * Nothing here merges automatically. Two verified signals pointing at different people, or a
 * match that rests only on an unverified email, are genuine questions — and a wrong merge joins
 * two people's payment history and entitlements, which is very hard to unpick. So they queue.
 */
function ReviewRow({ review }: { review: PartyReview }) {
  const resolve = useResolvePartyReview();
  const [survivor, setSurvivor] = useState(review.conflicts[0] ?? '');
  const canMerge = review.conflicts.length > 0 && Boolean(survivor);

  const unverified = review.reason.includes('unverified');

  return (
    <Card>
      <CardContent className="py-4 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={unverified ? 'secondary' : 'destructive'} className="font-mono text-[10px]">
                {unverified ? 'unverified match' : 'conflicting identities'}
              </Badge>
              {review.siteId && (
                <span className="font-mono text-[11px] text-muted-foreground">{review.siteId}</span>
              )}
              <span className="text-[11px] text-muted-foreground">{formatDate(review.createdAt)}</span>
            </div>
            <p className="text-sm">{review.reason}</p>
            <p className="font-mono text-xs text-muted-foreground">
              {review.signal.email ?? review.signal.phone ?? review.signal.siteCustomerId ?? 'no contact detail'}
              {review.signal.email && !review.signal.emailVerified && ' · not verified'}
            </p>
            {review.conflicts.length > 0 && (
              <p className="font-mono text-[11px] text-muted-foreground">
                candidates: {review.conflicts.join(', ')}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {review.conflicts.length > 1 && (
              <select
                aria-label="Party to keep"
                value={survivor}
                onChange={(e) => setSurvivor(e.target.value)}
                className="h-9 rounded-md border bg-background px-2 font-mono text-xs"
              >
                {review.conflicts.map((c) => <option key={c} value={c}>keep {c.slice(0, 8)}…</option>)}
              </select>
            )}
            <Button
              size="sm"
              variant="default"
              disabled={!canMerge || resolve.isPending}
              onClick={() => resolve.mutate({ id: review.id, action: 'merge', survivorId: survivor })}
            >
              Same person — merge
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={resolve.isPending}
              onClick={() => resolve.mutate({ id: review.id, action: 'separate' })}
            >
              Different people
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={resolve.isPending}
              onClick={() => resolve.mutate({ id: review.id, action: 'dismiss' })}
            >
              Dismiss
            </Button>
          </div>
        </div>
        {resolve.isError && (
          <p className="text-xs text-destructive">Could not settle this review. Try again, or check the payment record.</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function PartyReviewsPage() {
  const { setBreadcrumbs } = useUIStore();
  const { data, isLoading } = usePartyReviews();

  useEffect(() => {
    setBreadcrumbs([{ label: 'Payments', href: '/payments' }, { label: 'Identity reviews' }]);
  }, [setBreadcrumbs]);

  const reviews = data?.reviews ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Identity reviews"
        description="Customers whose identity could not be matched safely. Merging joins two people's payment history and entitlements, so nothing here happens automatically."
      />

      {isLoading ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-28" />)}</div>
      ) : reviews.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <Users className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm font-medium">Nothing waiting</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Every payment so far has resolved to an identity on its own, or carried nothing to match on.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldQuestion className="h-4 w-4" />
            {reviews.length} waiting
          </p>
          {reviews.map((r) => <ReviewRow key={r.id} review={r} />)}
        </div>
      )}
    </div>
  );
}
