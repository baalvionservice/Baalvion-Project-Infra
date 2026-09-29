'use client';

import { Radio } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useLiveVisitors } from '@/lib/queries/presence.queries';

type Props = {
  storeId: string | null;
  storeName?: string;
};

/**
 * Live shoppers currently on the storefront for the selected store. Polls the public
 * presence count every 15s (see useLiveVisitors). Answers "how many people are live on
 * this website right now" directly in the admin.
 */
export default function LiveVisitorsCard({ storeId, storeName }: Props) {
  const { data, isLoading, isError } = useLiveVisitors(storeId ?? '');
  const count = data ?? 0;
  const isLive = !!storeId && !isError;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                {isLive && count > 0 && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
                )}
                <span
                  className={`relative inline-flex h-2 w-2 rounded-full ${
                    isLive && count > 0 ? 'bg-green-500' : 'bg-muted-foreground/40'
                  }`}
                />
              </span>
              <p className="text-xs text-muted-foreground">Live visitors</p>
            </div>

            {!storeId ? (
              <p className="mt-2 text-sm text-muted-foreground">Select a store</p>
            ) : isLoading ? (
              <Skeleton className="mt-1 h-7 w-12" />
            ) : (
              // On error the count is unknown — show "—", not a misleading 0.
              <p className="mt-1 text-2xl font-bold tabular-nums">{isError ? '—' : count}</p>
            )}

            <p className="mt-0.5 text-xs text-muted-foreground truncate">
              {!storeId
                ? 'on the storefront right now'
                : storeName
                  ? `on ${storeName} now · updates every 15s`
                  : 'on the storefront now · updates every 15s'}
            </p>
          </div>
          <Radio className="h-5 w-5 shrink-0 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}
