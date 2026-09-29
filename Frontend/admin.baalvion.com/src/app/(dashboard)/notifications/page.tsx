'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ScrollText } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { notificationsApi, type QueueCounts } from '@/lib/api/notifications';
import { useUIStore } from '@/lib/store/uiStore';

const QUEUE_LABELS: Record<string, string> = {
  email: 'Email',
  webhook: 'Webhook',
  sms: 'SMS',
  push: 'Push',
  notification: 'Dispatch',
};

export default function NotificationsPage() {
  const { setBreadcrumbs } = useUIStore();

  // Real, admin-reachable signal from notification-service: per-queue depth across all channels.
  const { data: stats, isLoading } = useQuery({
    queryKey: ['notification-queue-stats'],
    queryFn: () => notificationsApi.queues.stats().then((r) => r.data.data),
    refetchInterval: 15_000,
  });

  useEffect(() => {
    setBreadcrumbs([{ label: 'Notifications' }]);
  }, [setBreadcrumbs]);

  const queues = stats
    ? (Object.entries(stats) as Array<[string, QueueCounts]>)
    : [];

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Channel queue health and failed-delivery management"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/notifications/logs">
                <ScrollText className="mr-2 h-4 w-4" />
                Failed Deliveries
              </Link>
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)
          : queues.map(([key, counts]) => (
              <Card key={key}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">{QUEUE_LABELS[key] ?? key} queue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-2xl font-semibold">{counts.waiting}</p>
                      <p className="text-xs text-muted-foreground">Waiting</p>
                    </div>
                    <div>
                      <p className="text-2xl font-semibold">{counts.active}</p>
                      <p className="text-xs text-muted-foreground">Active</p>
                    </div>
                    <div>
                      <p
                        className={`text-2xl font-semibold ${counts.failed > 0 ? 'text-destructive' : ''}`}
                      >
                        {counts.failed}
                      </p>
                      <p className="text-xs text-muted-foreground">Failed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>
    </div>
  );
}
