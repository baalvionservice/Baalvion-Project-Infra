'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { toast } from 'sonner';
import { RotateCw } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { normalizeError } from '@/lib/api/client';
import { formatRelative, formatDateTime } from '@/lib/utils/format';
import { imperialpediaMarketSyncApi, type SyncStatus } from '@/lib/api/imperialpedia-market-sync';

/**
 * Surfaces imperialpedia-service's own market-data sync loop health — the
 * piece that was silently broken in production (2026-07-19: /market-news'
 * MarketsBreakdown panels all showed "No data" because asset_summaries was
 * empty, with zero prior visibility into why). Polls every 30s so staff see
 * state changes without a manual refresh, and offers a "Resync now" action
 * that bypasses the service's own 60s TTL.
 */
function statusColor(status: SyncStatus): 'green' | 'amber' | 'red' {
  if (!status.configOk) return 'red';
  if (!status.lastSuccessAt) return status.lastErrorMessage ? 'red' : 'amber';
  if (status.lastErrorAt && (!status.lastSuccessAt || status.lastErrorAt > status.lastSuccessAt)) return 'amber';
  return 'green';
}

const DOT_CLASS: Record<ReturnType<typeof statusColor>, string> = {
  green: 'bg-emerald-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
};

const LABEL: Record<ReturnType<typeof statusColor>, string> = {
  green: 'Healthy',
  amber: 'Degraded',
  red: 'Down',
};

export function SyncHealthPanel() {
  const queryClient = useQueryClient();

  const { data: status, isLoading } = useQuery({
    queryKey: ['imperialpedia', 'sync-status'],
    queryFn: () => imperialpediaMarketSyncApi.status(),
    refetchInterval: 30_000,
  });

  const resync = useMutation({
    mutationFn: () => imperialpediaMarketSyncApi.resync(),
    onSuccess: (next) => {
      queryClient.setQueryData(['imperialpedia', 'sync-status'], next);
      toast.success('Market-data resync triggered');
    },
    onError: (e) => toast.error(normalizeError(e as AxiosError).message),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Market-Data Sync Health</CardTitle>
        <Button size="sm" variant="outline" onClick={() => resync.mutate()} disabled={resync.isPending}>
          <RotateCw className={`mr-1 h-4 w-4 ${resync.isPending ? 'animate-spin' : ''}`} />
          {resync.isPending ? 'Resyncing…' : 'Resync now'}
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading || !status ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}
          </div>
        ) : (
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${DOT_CLASS[statusColor(status)]}`} />
              <span className="font-semibold">{LABEL[statusColor(status)]}</span>
              {!status.configOk && (
                <span className="text-xs text-muted-foreground">
                  — CMS_BASE_URL / INTERNAL_SERVICE_SECRET not configured
                </span>
              )}
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-4">
              <div>
                <dt className="text-muted-foreground">Last success</dt>
                <dd className="font-medium" title={status.lastSuccessAt ? formatDateTime(status.lastSuccessAt) : undefined}>
                  {status.lastSuccessAt ? formatRelative(status.lastSuccessAt) : 'never'}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Last attempt</dt>
                <dd className="font-medium" title={status.lastAttemptAt ? formatDateTime(status.lastAttemptAt) : undefined}>
                  {status.lastAttemptAt ? formatRelative(status.lastAttemptAt) : 'never'}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Rows upserted</dt>
                <dd className="font-medium">{status.lastRowCount ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Rows skipped (null price)</dt>
                <dd className="font-medium">{status.lastSkippedCount ?? '—'}</dd>
              </div>
            </dl>
            {status.lastErrorMessage && (
              <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                Last error{status.lastErrorAt ? ` (${formatRelative(status.lastErrorAt)})` : ''}: {status.lastErrorMessage}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default SyncHealthPanel;
