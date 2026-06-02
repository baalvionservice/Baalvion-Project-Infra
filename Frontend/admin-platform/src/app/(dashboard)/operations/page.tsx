'use client';

import { Suspense, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Activity, Server, Database, Zap, Scale, AlertTriangle,
  CheckCircle2, XCircle, Layers, RefreshCw, Wallet,
} from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ServiceHealthRow from './ServiceHealthRow';
import { useRealtimeStore } from '@/lib/store/realtimeStore';
import { useCommerceStore } from '@/lib/store/commerceStore';
import { useUIStore } from '@/lib/store/uiStore';
import { useReconciliation, useRunBackfill } from '@/lib/queries/ops.queries';
import { formatCurrency, formatNumber } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import type { ServiceStatus } from '@/lib/types/realtime.types';

// Services we surface first because the operations dashboard cares about them most.
const CRITICAL_MATCHERS = ['commerce', 'order', 'inventory', 'ledger'];

const TAB_VALUES = ['services', 'dependencies', 'queues', 'reconciliation'] as const;
type OpsTab = (typeof TAB_VALUES)[number];

function isCritical(name: string): boolean {
  const n = name.toLowerCase();
  return CRITICAL_MATCHERS.some((m) => n.includes(m));
}

function findLedgerService(services: ServiceStatus[]): ServiceStatus | undefined {
  return services.find((s) => s.name.toLowerCase().includes('ledger'));
}

// ── Live / Offline indicator ────────────────────────────────────────────────────

function LiveIndicator() {
  const wsState = useRealtimeStore((s) => s.wsState);
  const connected = wsState === 'connected';
  return (
    <Badge
      variant="outline"
      className={cn('gap-1', connected ? 'text-green-600 border-green-500' : 'text-muted-foreground')}
    >
      <Activity className={cn('h-3 w-3', connected && 'animate-pulse')} />
      {connected ? 'Live' : wsState === 'connecting' ? 'Connecting…' : 'Offline (polling)'}
    </Badge>
  );
}

// ── Tab: Service Health ───────────────────────────────────────────────────────────

function ServiceHealthTab() {
  const services = useRealtimeStore((s) => s.services);

  const { critical, others } = useMemo(() => {
    const crit = services.filter((s) => isCritical(s.name));
    const rest = services.filter((s) => !isCritical(s.name));
    return { critical: crit, others: rest };
  }, [services]);

  if (services.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center py-12 gap-2 text-muted-foreground">
          <Server className="h-8 w-8 opacity-30" />
          <p className="text-sm">No service health yet — waiting for the realtime feed.</p>
          <p className="text-xs">Service status is pushed over WebSocket once connected.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Server className="h-4 w-4" /> Service Health
        </CardTitle>
        <CardDescription>Commerce-critical services are highlighted at the top.</CardDescription>
      </CardHeader>
      <CardContent>
        {critical.map((s) => (
          <ServiceHealthRow key={s.name} service={s} critical />
        ))}
        {others.map((s) => (
          <ServiceHealthRow key={s.name} service={s} />
        ))}
      </CardContent>
    </Card>
  );
}

// ── Tab: Dependencies (Postgres / Redis / host) ───────────────────────────────────

function DependenciesTab() {
  const infra = useRealtimeStore((s) => s.infra);

  if (!infra) {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="space-y-3 pt-6">
              {Array.from({ length: 3 }).map((__, j) => <Skeleton key={j} className="h-6 w-full" />)}
              <p className="text-xs text-muted-foreground text-center pt-1">Waiting for realtime metrics…</p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const poolPct = infra.postgres.maxConnections
    ? (infra.postgres.connections / infra.postgres.maxConnections) * 100
    : 0;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* PostgreSQL */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Database className="h-4 w-4" /> PostgreSQL
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-muted-foreground">Connections</p>
              <p className="text-lg font-bold">
                {infra.postgres.connections}
                <span className="text-muted-foreground text-xs">/{infra.postgres.maxConnections}</span>
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Active Queries</p>
              <p className="text-lg font-bold">{infra.postgres.activeQueries}</p>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1 text-xs">
              <span>Connection pool</span>
              <span className={cn('font-semibold', poolPct >= 90 ? 'text-red-500' : poolPct >= 70 ? 'text-yellow-500' : 'text-green-500')}>
                {poolPct.toFixed(0)}%
              </span>
            </div>
            <div className="h-2 bg-muted rounded overflow-hidden">
              <div
                className={cn('h-full rounded transition-all', poolPct >= 90 ? 'bg-red-500' : poolPct >= 70 ? 'bg-yellow-500' : 'bg-green-500')}
                style={{ width: `${Math.min(poolPct, 100)}%` }}
              />
            </div>
          </div>
          {infra.postgres.replicationLag > 0 && (
            <div className="flex items-center gap-2 text-xs text-yellow-500">
              <AlertTriangle className="h-3.5 w-3.5" />
              Replication lag: {infra.postgres.replicationLag}ms
            </div>
          )}
        </CardContent>
      </Card>

      {/* Redis */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Zap className="h-4 w-4" /> Redis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-muted-foreground">Key Count</p>
              <p className="text-lg font-bold">{formatNumber(infra.redis.keyCount)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Clients</p>
              <p className="text-lg font-bold">{infra.redis.connectedClients}</p>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Memory</span>
            <span className="font-medium">{infra.redis.memoryMb.toFixed(0)} MB</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Hit rate</span>
            <span className={cn('font-semibold', infra.redis.hitRate >= 0.9 ? 'text-green-500' : 'text-yellow-500')}>
              {(infra.redis.hitRate * 100).toFixed(1)}%
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Host resources */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Layers className="h-4 w-4" /> Host Resources
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          {([
            { label: 'CPU', value: infra.cpu },
            { label: 'Memory', value: infra.memory },
            { label: 'Disk', value: infra.disk },
          ] as const).map(({ label, value }) => {
            const color = value >= 90 ? 'text-red-500' : value >= 75 ? 'text-yellow-500' : 'text-green-500';
            const bar = value >= 90 ? 'bg-red-500' : value >= 75 ? 'bg-yellow-500' : 'bg-green-500';
            return (
              <div key={label}>
                <div className="flex items-center justify-between mb-1 text-xs">
                  <span>{label}</span>
                  <span className={cn('font-semibold', color)}>{value.toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-muted rounded overflow-hidden">
                  <div className={cn('h-full rounded transition-all', bar)} style={{ width: `${Math.min(value, 100)}%` }} />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Tab: Queues ────────────────────────────────────────────────────────────────────

function QueuesTab() {
  const queues = useRealtimeStore((s) => s.queues);

  if (queues.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center py-12 gap-2 text-muted-foreground">
          <Zap className="h-8 w-8 opacity-30" />
          <p className="text-sm">No queue data — waiting for the realtime connection.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Zap className="h-4 w-4" /> Job Queues
        </CardTitle>
        <CardDescription>Backlog and failures across BullMQ queues.</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b">
              {['Queue', 'Waiting', 'Active', 'Failed', 'Completed', 'Delayed'].map((h) => (
                <th key={h} className="text-left pb-2 pr-4 font-medium text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {queues.map((q) => (
              <tr key={q.name} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                <td className="py-2.5 pr-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'h-2 w-2 rounded-full shrink-0',
                        q.failed > 0 ? 'bg-red-500' : q.active > 0 ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground',
                      )}
                    />
                    <div className="min-w-0">
                      <p className="font-medium">{q.displayName}</p>
                      <p className="text-[11px] text-muted-foreground font-mono truncate">{q.name}</p>
                    </div>
                  </div>
                </td>
                <td className={cn('py-2.5 pr-4 tabular-nums', q.waiting > 0 && 'text-yellow-500 font-medium')}>{q.waiting}</td>
                <td className={cn('py-2.5 pr-4 tabular-nums', q.active > 0 && 'text-blue-500 font-medium')}>{q.active}</td>
                <td className={cn('py-2.5 pr-4 tabular-nums', q.failed > 0 && 'text-red-500 font-medium')}>{q.failed}</td>
                <td className="py-2.5 pr-4 tabular-nums text-muted-foreground">{formatNumber(q.completed)}</td>
                <td className="py-2.5 pr-4 tabular-nums text-muted-foreground">{q.delayed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

// ── Tab: Reconciliation (store-scoped) ─────────────────────────────────────────────

function ReconciliationTab() {
  const activeStoreId = useCommerceStore((s) => s.activeStoreId);
  const storeId = activeStoreId ?? '';
  const services = useRealtimeStore((s) => s.services);
  const ledgerService = useMemo(() => findLedgerService(services), [services]);

  const { data, isLoading, isError } = useReconciliation(storeId);
  const runBackfill = useRunBackfill(storeId);

  if (!storeId) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center py-16 gap-4 text-center">
          <Scale className="h-10 w-10 text-muted-foreground opacity-40" />
          <div>
            <p className="text-sm font-medium">No store selected</p>
            <p className="text-sm text-muted-foreground">Select a store from the Commerce overview to view reconciliation.</p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/commerce">Go to Commerce</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="grid gap-6 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center py-12 gap-2 text-muted-foreground">
          <AlertTriangle className="h-8 w-8 opacity-40" />
          <p className="text-sm">Could not load the reconciliation report for this store.</p>
        </CardContent>
      </Card>
    );
  }

  // Ledger sync status is derived from BOTH the ledger-service health AND the report flag.
  const ledgerUp = ledgerService?.status === 'up';
  const ledgerSynced = data.ledgerAvailable && ledgerUp;
  const ledgerLabel = !data.ledgerAvailable
    ? 'Unavailable'
    : ledgerUp
      ? 'Synced'
      : ledgerService
        ? 'Service unreachable'
        : 'Available';

  return (
    <div className="space-y-6">
      {/* Status cards */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="h-4 w-4" /> Ledger Sync
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Badge
              variant="outline"
              className={cn('gap-1', ledgerSynced ? 'text-green-600 border-green-500' : 'text-yellow-600 border-yellow-500')}
            >
              {ledgerSynced ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
              {ledgerLabel}
            </Badge>
            <p className="text-xs text-muted-foreground">
              {ledgerService
                ? `ledger-service is ${ledgerService.status}`
                : 'ledger-service not reporting health'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Scale className="h-4 w-4" /> Balance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Badge
              variant="outline"
              className={cn('gap-1', data.balanced ? 'text-green-600 border-green-500' : 'text-red-600 border-red-500')}
            >
              {data.balanced ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
              {data.balanced ? 'Balanced' : 'Out of balance'}
            </Badge>
            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div>
                <p className="text-muted-foreground">Missing</p>
                <p className={cn('font-bold', data.counts.missing > 0 && 'text-red-500')}>{data.counts.missing}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Mismatched</p>
                <p className={cn('font-bold', data.counts.mismatched > 0 && 'text-red-500')}>{data.counts.mismatched}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Matched</p>
                <p className="font-bold text-green-600">{data.counts.matched}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Expected</p>
                <p className="font-bold">{data.counts.expected}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Wallet className="h-4 w-4" /> Settlement Totals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Captured</span>
              <span className="font-semibold tabular-nums">{formatCurrency(data.totals.capturedMinor)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Refunded</span>
              <span className="font-semibold tabular-nums text-red-500">{formatCurrency(data.totals.refundedMinor)}</span>
            </div>
            <div className="flex items-center justify-between border-t pt-2">
              <span className="text-muted-foreground">Net</span>
              <span className="font-bold tabular-nums">{formatCurrency(data.totals.netMinor)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Backfill action — only when not balanced */}
      {!data.balanced && (
        <Card className="border-yellow-500/40">
          <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">This store is out of balance</p>
                <p className="text-xs text-muted-foreground">
                  Run a backfill to post the {data.counts.missing} missing ledger {data.counts.missing === 1 ? 'entry' : 'entries'}.
                  Requires store_admin.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => runBackfill.mutate(undefined)}
              disabled={runBackfill.isPending || !data.ledgerAvailable}
            >
              <RefreshCw className={cn('mr-2 h-4 w-4', runBackfill.isPending && 'animate-spin')} />
              {runBackfill.isPending ? 'Running…' : 'Run backfill'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Page shell ──────────────────────────────────────────────────────────────────

function OperationsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setBreadcrumbs = useUIStore((s) => s.setBreadcrumbs);

  const rawTab = searchParams.get('tab');
  const tab: OpsTab = (TAB_VALUES as readonly string[]).includes(rawTab ?? '')
    ? (rawTab as OpsTab)
    : 'services';

  useEffect(() => {
    setBreadcrumbs([{ label: 'Operations' }]);
  }, [setBreadcrumbs]);

  const handleTabChange = (next: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === 'services') params.delete('tab');
    else params.set('tab', next);
    const qs = params.toString();
    router.replace(qs ? `/operations?${qs}` : '/operations', { scroll: false });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operations"
        description="Service health, dependencies, job queues, and ledger reconciliation"
        actions={<LiveIndicator />}
      />

      <Tabs value={tab} onValueChange={handleTabChange}>
        <TabsList className="mb-4 flex-wrap h-auto gap-1">
          <TabsTrigger value="services">Service Health</TabsTrigger>
          <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
          <TabsTrigger value="queues">Queues</TabsTrigger>
          <TabsTrigger value="reconciliation">Reconciliation</TabsTrigger>
        </TabsList>

        <TabsContent value="services"><ServiceHealthTab /></TabsContent>
        <TabsContent value="dependencies"><DependenciesTab /></TabsContent>
        <TabsContent value="queues"><QueuesTab /></TabsContent>
        <TabsContent value="reconciliation"><ReconciliationTab /></TabsContent>
      </Tabs>
    </div>
  );
}

export default function OperationsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <OperationsContent />
    </Suspense>
  );
}
