'use client';

import { HeartPulse, Globe, Database, HardDrive, DatabaseBackup } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils/cn';
import { formatRelative } from '@/lib/utils/format';
import type { HealthOverview } from './dashboard-data';
import type { WebsiteStatus } from '@/lib/types/cms-website.types';

interface Props {
  data: HealthOverview;
}

const SITE_STATUS_META: Record<WebsiteStatus, { label: string; dot: string; text: string }> = {
  active: { label: 'Operational', dot: 'bg-green-500', text: 'text-green-500' },
  maintenance: { label: 'Maintenance', dot: 'bg-amber-500', text: 'text-amber-500' },
  inactive: { label: 'Offline', dot: 'bg-rose-500', text: 'text-rose-500' },
  archived: { label: 'Archived', dot: 'bg-muted-foreground', text: 'text-muted-foreground' },
};

function StatusRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2 py-2">
      <span className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </span>
      {children}
    </div>
  );
}

export default function WebsiteHealth({ data }: Props) {
  const site = SITE_STATUS_META[data.siteStatus] ?? SITE_STATUS_META.active;
  const storagePct = data.storageQuotaMb
    ? Math.min(100, Math.round((data.storageUsedMb / data.storageQuotaMb) * 100))
    : 0;
  const storageBar =
    storagePct >= 90 ? 'bg-rose-500' : storagePct >= 70 ? 'bg-amber-500' : 'bg-green-500';

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <HeartPulse className="h-4 w-4 text-rose-500" />
          Website Health
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 divide-y divide-border/60">
        <StatusRow icon={Globe} label="Site status">
          <span className={cn('flex items-center gap-1.5 text-xs font-medium', site.text)}>
            <span className={cn('h-2 w-2 rounded-full', site.dot)} />
            {site.label}
          </span>
        </StatusRow>

        <StatusRow icon={Database} label="Database">
          <span
            className={cn(
              'flex items-center gap-1.5 text-xs font-medium',
              data.databaseOnline ? 'text-green-500' : 'text-rose-500',
            )}
          >
            <span
              className={cn(
                'h-2 w-2 rounded-full',
                data.databaseOnline ? 'bg-green-500' : 'bg-rose-500',
              )}
            />
            {data.databaseOnline ? 'Connected' : 'Degraded'}
          </span>
        </StatusRow>

        <div className="py-2.5">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              <HardDrive className="h-3.5 w-3.5" />
              Storage usage
            </span>
            <span className="text-xs font-medium tabular-nums">
              {data.storageUsedMb} / {data.storageQuotaMb} MB
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className={cn('h-full rounded-full transition-all', storageBar)}
              style={{ width: `${storagePct}%` }}
            />
          </div>
        </div>

        {data.lastBackup && (
          <StatusRow icon={DatabaseBackup} label="Last backup">
            <span className="text-xs font-medium">{formatRelative(data.lastBackup)}</span>
          </StatusRow>
        )}
      </CardContent>
    </Card>
  );
}
