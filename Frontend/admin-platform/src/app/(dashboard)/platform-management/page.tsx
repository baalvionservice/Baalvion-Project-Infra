'use client';

import { useEffect } from 'react';
import { ExternalLink, Server, Clock, Tag } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePlatformRegistry } from '@/lib/queries/platform-registry.queries';
import { useUIStore } from '@/lib/store/uiStore';
import type { PlatformEntry, PlatformStatus } from '@/lib/api/platform-registry';
import { cn } from '@/lib/utils/cn';

const STATUS_META: Record<PlatformStatus, { label: string; dot: string; text: string }> = {
  online:          { label: 'Online',        dot: 'bg-green-500',  text: 'text-green-500' },
  down:            { label: 'Degraded',      dot: 'bg-yellow-500', text: 'text-yellow-500' },
  unreachable:     { label: 'Unreachable',   dot: 'bg-red-500',    text: 'text-red-500' },
  not_configured:  { label: 'Not configured', dot: 'bg-muted-foreground/40', text: 'text-muted-foreground' },
  not_deployed:    { label: 'Not deployed',  dot: 'bg-muted-foreground/40', text: 'text-muted-foreground' },
};

function PlatformCard({ platform }: { platform: PlatformEntry }) {
  const meta = STATUS_META[platform.status];
  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-sm font-medium">{platform.name}</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">{platform.domain}</p>
          </div>
          <Badge variant="outline" className={cn('gap-1.5 text-[10px] shrink-0', meta.text)}>
            <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
            {meta.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Server className="h-3 w-3" />
            {platform.latencyMs !== null ? `${platform.latencyMs}ms` : '—'}
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Tag className="h-3 w-3" />
            {platform.version ?? '—'}
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground col-span-2">
            <Clock className="h-3 w-3" />
            {platform.lastDeploy ? new Date(platform.lastDeploy).toLocaleString() : 'No sync data'}
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="w-full"
          disabled={!platform.adminUrl}
          onClick={() => platform.adminUrl && window.open(platform.adminUrl, '_blank', 'noopener,noreferrer')}
        >
          <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
          {platform.adminUrl ? 'Open Admin' : 'No admin URL configured'}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function PlatformManagementPage() {
  const { setBreadcrumbs } = useUIStore();
  const { data: platforms, isLoading } = usePlatformRegistry();

  useEffect(() => { setBreadcrumbs([{ label: 'Platform Management' }]); }, [setBreadcrumbs]);

  return (
    <div>
      <PageHeader
        title="Platform Management"
        description="Status, health, and quick access across every Baalvion ecosystem property"
      />
      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {(platforms ?? []).map((p) => <PlatformCard key={p.key} platform={p} />)}
        </div>
      )}
      <p className="mt-4 text-xs text-muted-foreground">
        Properties without a live health/admin URL show &quot;Not configured&quot; rather than a
        fabricated status — set the corresponding service URL env var on admin-service to wire them up.
      </p>
    </div>
  );
}
