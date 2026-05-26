'use client';

import { CheckCircle, AlertTriangle, XCircle, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useServiceHealth } from '@/lib/queries/analytics.queries';
import { cn } from '@/lib/utils/cn';

const statusIcons = {
  healthy: CheckCircle,
  degraded: AlertTriangle,
  down: XCircle,
};

const statusColors = {
  healthy: 'text-green-500',
  degraded: 'text-yellow-500',
  down: 'text-red-500',
};

export default function ServiceHealthGrid() {
  const { data: services, isLoading } = useServiceHealth();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4" />
          Service Health
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-md" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {services?.map((svc) => {
              const Icon = statusIcons[svc.status];
              return (
                <div
                  key={svc.name}
                  className="flex flex-col gap-1 rounded-md border p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium truncate">{svc.name}</span>
                    <Icon className={cn('h-3.5 w-3.5 shrink-0', statusColors[svc.status])} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">:{svc.port}</span>
                    <span className="text-[10px] text-muted-foreground">{svc.latencyMs}ms</span>
                  </div>
                  <div className="mt-1 h-1 w-full rounded-full bg-muted">
                    <div
                      className={cn(
                        'h-full rounded-full',
                        svc.status === 'healthy'
                          ? 'bg-green-500'
                          : svc.status === 'degraded'
                          ? 'bg-yellow-500'
                          : 'bg-red-500',
                      )}
                      style={{ width: `${svc.uptimePercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
