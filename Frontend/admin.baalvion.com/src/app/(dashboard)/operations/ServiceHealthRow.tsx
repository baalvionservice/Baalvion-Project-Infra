'use client';

import { Server, CheckCircle2, XCircle, AlertTriangle, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatRelative } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import type { ServiceStatus } from '@/lib/types/realtime.types';

function HealthBadge({ status }: { status: ServiceStatus['status'] }) {
  if (status === 'up')
    return (
      <Badge variant="outline" className="gap-1 text-green-600 border-green-500">
        <CheckCircle2 className="h-3 w-3" />
        Up
      </Badge>
    );
  if (status === 'degraded')
    return (
      <Badge variant="outline" className="gap-1 text-yellow-600 border-yellow-500">
        <AlertTriangle className="h-3 w-3" />
        Degraded
      </Badge>
    );
  return (
    <Badge variant="destructive" className="gap-1">
      <XCircle className="h-3 w-3" />
      Down
    </Badge>
  );
}

interface ServiceHealthRowProps {
  service: ServiceStatus & { url?: string };
  critical?: boolean;
}

export default function ServiceHealthRow({ service, critical = false }: ServiceHealthRowProps) {
  const latency = service.latencyMs;
  const latencyColor =
    latency == null
      ? 'text-muted-foreground'
      : latency < 50
        ? 'text-green-500'
        : latency < 200
          ? 'text-yellow-500'
          : 'text-red-500';

  return (
    <div
      className={cn(
        'flex items-center gap-4 py-3 border-b last:border-0',
        critical && 'bg-primary/5 -mx-6 px-6 border-l-2 border-l-primary',
      )}
    >
      <Server className="h-4 w-4 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium truncate">{service.name}</p>
          {critical && <Star className="h-3 w-3 text-primary fill-primary shrink-0" />}
        </div>
        {service.url && <p className="text-xs text-muted-foreground font-mono truncate">{service.url}</p>}
      </div>
      <span className={cn('text-xs hidden sm:block tabular-nums', latencyColor)}>
        {latency != null ? `${latency}ms` : '—'}
      </span>
      <span className="text-[11px] text-muted-foreground hidden md:block">
        {service.checkedAt ? formatRelative(service.checkedAt) : '—'}
      </span>
      <HealthBadge status={service.status} />
    </div>
  );
}
