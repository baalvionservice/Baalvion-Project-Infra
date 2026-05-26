'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Code2, Webhook, Activity, RefreshCw, Globe, CheckCircle2,
  XCircle, Clock, BarChart3, BookOpen, Package, Zap,
  AlertTriangle, Plus, RotateCcw, ExternalLink, Terminal,
  TrendingUp, TrendingDown, Minus,
} from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUIStore } from '@/lib/store/uiStore';
import { developersApi } from '@/lib/api/developers';
import { formatRelative, formatDateTime, formatNumber } from '@/lib/utils/format';
import type {
  WebhookEndpoint, WebhookDelivery, ChangelogEntry,
  SdkRelease, ApiEndpointStat, SandboxEnvironment,
} from '@/lib/types/developer.types';
import { cn } from '@/lib/utils/cn';

// ── API stat row ──────────────────────────────────────────────────────────────

function ApiStatRow({ stat }: { stat: ApiEndpointStat }) {
  const errorPct = stat.callsToday > 0 ? ((stat.errorsToday / stat.callsToday) * 100).toFixed(1) : '0';
  const TrendIcon = stat.trend === 'up' ? TrendingUp : stat.trend === 'down' ? TrendingDown : Minus;
  const trendColor = stat.trend === 'up' ? 'text-green-400' : stat.trend === 'down' ? 'text-red-400' : 'text-muted-foreground';

  return (
    <div className="flex items-center gap-3 py-2.5 border-b last:border-0 text-xs">
      <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-mono shrink-0">
        {stat.method}
      </Badge>
      <span className="flex-1 font-mono text-muted-foreground truncate min-w-0">{stat.endpoint}</span>
      <div className="flex items-center gap-4 shrink-0 text-right">
        <div className="hidden sm:flex items-center gap-1">
          <TrendIcon className={cn('h-3 w-3', trendColor)} />
          <span>{formatNumber(stat.callsToday)}</span>
        </div>
        <span className={cn(parseFloat(errorPct) > 5 ? 'text-red-400' : 'text-muted-foreground')}>
          {errorPct}% err
        </span>
        <span className="hidden md:inline text-muted-foreground">{stat.p95Ms}ms p95</span>
      </div>
    </div>
  );
}

// ── Webhook row ───────────────────────────────────────────────────────────────

function WebhookRow({
  hook, selected, onClick,
}: { hook: WebhookEndpoint; selected: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-start gap-3 py-3 border-b last:border-0 cursor-pointer hover:bg-muted/40 px-1 rounded transition-colors',
        selected && 'bg-muted/60',
      )}
    >
      <div className={cn(
        'mt-0.5 h-2 w-2 rounded-full shrink-0',
        hook.enabled ? 'bg-green-500' : 'bg-muted-foreground',
      )} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{hook.description || hook.url}</p>
        <p className="text-xs text-muted-foreground font-mono truncate">{hook.url}</p>
        <div className="flex gap-1 flex-wrap mt-1">
          {hook.events.slice(0, 3).map((e) => (
            <Badge key={e} variant="secondary" className="text-[10px] h-4 px-1">{e}</Badge>
          ))}
          {hook.events.length > 3 && (
            <Badge variant="secondary" className="text-[10px] h-4 px-1">+{hook.events.length - 3}</Badge>
          )}
        </div>
      </div>
      <div className="shrink-0 text-right text-[11px] text-muted-foreground">
        <p className={hook.successRate >= 0.95 ? 'text-green-400' : hook.successRate >= 0.8 ? 'text-yellow-400' : 'text-red-400'}>
          {(hook.successRate * 100).toFixed(1)}% ok
        </p>
        {hook.lastTriggeredAt && <p>{formatRelative(hook.lastTriggeredAt)}</p>}
      </div>
    </div>
  );
}

// ── Delivery row ──────────────────────────────────────────────────────────────

function DeliveryRow({ delivery, onRetry }: { delivery: WebhookDelivery; onRetry: (id: string) => void }) {
  const statusIcon = {
    success: <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />,
    failed:  <XCircle className="h-3.5 w-3.5 text-red-400" />,
    pending: <Clock className="h-3.5 w-3.5 text-muted-foreground" />,
    retrying: <RefreshCw className="h-3.5 w-3.5 text-yellow-400 animate-spin" />,
  }[delivery.status];

  return (
    <div className="flex items-center gap-3 py-2.5 border-b last:border-0 text-xs">
      <div className="shrink-0">{statusIcon}</div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{delivery.eventType}</p>
        <p className="text-muted-foreground">
          {delivery.statusCode ? `HTTP ${delivery.statusCode}` : 'No response'}
          {delivery.latencyMs && ` · ${delivery.latencyMs}ms`}
          {delivery.attempts > 1 && ` · ${delivery.attempts} attempts`}
        </p>
      </div>
      <div className="shrink-0 flex items-center gap-2">
        <span className="text-muted-foreground">{formatRelative(delivery.createdAt)}</span>
        {delivery.status === 'failed' && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-[10px]"
            onClick={() => onRetry(delivery.id)}
          >
            <RotateCcw className="h-3 w-3 mr-1" />Retry
          </Button>
        )}
      </div>
    </div>
  );
}

// ── Changelog entry ───────────────────────────────────────────────────────────

function ChangelogRow({ entry }: { entry: ChangelogEntry }) {
  const typeColor: Record<string, string> = {
    feature:     'text-blue-400 border-blue-500/50',
    fix:         'text-green-400 border-green-500/50',
    breaking:    'text-red-400 border-red-500/50',
    deprecation: 'text-yellow-400 border-yellow-500/50',
    security:    'text-purple-400 border-purple-500/50',
  };
  return (
    <div className="flex items-start gap-3 py-3 border-b last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <Badge variant="outline" className={cn('text-[10px] h-4 px-1.5 capitalize', typeColor[entry.type] ?? '')}>
            {entry.type}
          </Badge>
          <Badge variant="secondary" className="text-[10px] h-4 px-1.5 font-mono">{entry.version}</Badge>
          {!entry.publishedAt && <Badge variant="outline" className="text-[10px] h-4 px-1">Draft</Badge>}
        </div>
        <p className="text-sm font-medium">{entry.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{entry.body}</p>
      </div>
      <div className="shrink-0 text-right text-[11px] text-muted-foreground">
        {entry.publishedAt ? formatRelative(entry.publishedAt) : 'Unpublished'}
      </div>
    </div>
  );
}

// ── SDK card ──────────────────────────────────────────────────────────────────

const SDK_ICONS: Record<string, string> = {
  typescript: '🟦', python: '🐍', go: '🐹', ruby: '💎', java: '☕', php: '🐘',
};

function SdkCard({ sdk }: { sdk: SdkRelease }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b last:border-0">
      <span className="text-lg shrink-0">{SDK_ICONS[sdk.language] ?? '📦'}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium capitalize">{sdk.language}</span>
          <Badge variant="secondary" className="text-[10px] h-4 px-1 font-mono">v{sdk.version}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">{formatRelative(sdk.publishedAt)}</p>
      </div>
      <Button variant="ghost" size="sm" className="gap-1 text-xs h-7" asChild>
        <a href={sdk.downloadUrl} target="_blank" rel="noopener noreferrer">
          <ExternalLink className="h-3 w-3" /> Download
        </a>
      </Button>
    </div>
  );
}

// ── Sandbox row ───────────────────────────────────────────────────────────────

function SandboxRow({ env, onReset }: { env: SandboxEnvironment; onReset: (id: string) => void }) {
  const statusColor = env.status === 'running' ? 'bg-green-500' : env.status === 'creating' ? 'bg-yellow-500 animate-pulse' : 'bg-muted-foreground';
  return (
    <div className="flex items-center gap-3 py-3 border-b last:border-0">
      <span className={cn('h-2 w-2 rounded-full shrink-0', statusColor)} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{env.name}</p>
        <p className="text-xs text-muted-foreground font-mono truncate">{env.baseUrl}</p>
        {env.expiresAt && (
          <p className="text-[11px] text-muted-foreground">Expires {formatRelative(env.expiresAt)}</p>
        )}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => onReset(env.id)}>
          <RotateCcw className="h-3 w-3" />Reset
        </Button>
        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" asChild>
          <a href={env.baseUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-3 w-3" />Open
          </a>
        </Button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function DevelopersPage() {
  const { setBreadcrumbs } = useUIStore();
  const [tab, setTab] = useState('api');
  const [selectedHook, setSelectedHook] = useState<WebhookEndpoint | null>(null);
  const qc = useQueryClient();

  useEffect(() => { setBreadcrumbs([{ label: 'Developer Platform' }]); }, [setBreadcrumbs]);

  const { data: apiStats }    = useQuery({ queryKey: ['dev-api-stats'], queryFn: () => developersApi.getApiStats({ period: '7d' }).then((r) => r.data.data), refetchInterval: 60_000 });
  const { data: webhooks, isLoading: hooksLoading } = useQuery({ queryKey: ['webhooks'], queryFn: () => developersApi.listWebhooks({ page: 1, limit: 50 }).then((r) => r.data.data) });
  const { data: deliveries, isLoading: deliveriesLoading } = useQuery({
    queryKey: ['webhook-deliveries', selectedHook?.id],
    queryFn: () => selectedHook ? developersApi.listDeliveries(selectedHook.id, { page: 1, limit: 30 }).then((r) => r.data.data) : null,
    enabled: !!selectedHook,
  });
  const { data: changelog, isLoading: changelogLoading } = useQuery({ queryKey: ['changelog'], queryFn: () => developersApi.listChangelog({ page: 1, limit: 30 }).then((r) => r.data.data) });
  const { data: sdks }        = useQuery({ queryKey: ['sdks'],       queryFn: () => developersApi.listSdks().then((r) => r.data.data) });
  const { data: sandboxes, isLoading: sandboxLoading } = useQuery({ queryKey: ['sandboxes'], queryFn: () => developersApi.listSandboxes({ page: 1, limit: 20 }).then((r) => r.data.data) });

  const retryDelivery = useMutation({
    mutationFn: (id: string) => developersApi.retryDelivery(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['webhook-deliveries'] }),
  });

  const resetSandbox = useMutation({
    mutationFn: (id: string) => developersApi.resetSandbox(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sandboxes'] }),
  });

  const hookList:      WebhookEndpoint[]  = webhooks?.data ?? [];
  const deliveryList:  WebhookDelivery[]  = deliveries?.data ?? [];
  const changelogList: ChangelogEntry[]   = changelog?.data ?? [];
  const sdkList:       SdkRelease[]       = sdks ?? [];
  const sandboxList:   SandboxEnvironment[] = sandboxes?.data ?? [];

  const totalCalls  = apiStats?.totalCalls ?? 0;
  const totalErrors = apiStats?.totalErrors ?? 0;
  const errorPct    = totalCalls > 0 ? ((totalErrors / totalCalls) * 100).toFixed(2) : '0';
  const activeHooks = hookList.filter((h) => h.enabled).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Developer Platform"
        description="API analytics, webhooks, rate limits, changelog, SDK registry, and sandbox environments"
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'API Calls (7d)',   value: formatNumber(totalCalls),   icon: Activity, color: 'text-blue-500'  },
          { label: 'Error Rate',       value: `${errorPct}%`,             icon: AlertTriangle, color: parseFloat(errorPct) > 1 ? 'text-red-500' : 'text-green-500' },
          { label: 'Active Webhooks',  value: `${activeHooks}/${hookList.length}`, icon: Webhook, color: 'text-purple-500' },
          { label: 'Avg Latency p95',  value: apiStats?.avgLatencyMs ? `${apiStats.avgLatencyMs}ms` : '—', icon: Zap, color: 'text-orange-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs text-muted-foreground">{label}</p>
                <Icon className={cn('h-4 w-4', color)} />
              </div>
              <p className="text-2xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4 flex-wrap h-auto gap-1">
          <TabsTrigger value="api">API Analytics</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="changelog">Changelog</TabsTrigger>
          <TabsTrigger value="sdks">SDKs</TabsTrigger>
          <TabsTrigger value="sandbox">Sandboxes</TabsTrigger>
        </TabsList>

        {/* API Analytics */}
        <TabsContent value="api">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="h-4 w-4" /> Top Endpoints (7d)
              </CardTitle>
              <CardDescription>Sorted by call volume · p95 latency · error rate</CardDescription>
            </CardHeader>
            <CardContent>
              {!apiStats ? (
                <div className="space-y-2">{Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
              ) : apiStats.endpoints.length === 0 ? (
                <div className="flex flex-col items-center py-10 gap-2 text-muted-foreground">
                  <BarChart3 className="h-8 w-8 opacity-30" />
                  <p className="text-sm">No API data yet</p>
                </div>
              ) : (
                <div>
                  {apiStats.endpoints.map((s, i) => <ApiStatRow key={i} stat={s} />)}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Webhooks */}
        <TabsContent value="webhooks">
          <div className="grid lg:grid-cols-5 gap-6">
            {/* Webhook list */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Webhook className="h-4 w-4" /> Endpoints
                    </CardTitle>
                    <Button size="sm" variant="outline" className="text-xs gap-1">
                      <Plus className="h-3.5 w-3.5" /> Add
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {hooksLoading ? (
                    <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
                  ) : hookList.length === 0 ? (
                    <div className="flex flex-col items-center py-8 gap-2 text-muted-foreground">
                      <Webhook className="h-7 w-7 opacity-30" />
                      <p className="text-sm">No webhooks configured</p>
                    </div>
                  ) : (
                    hookList.map((h) => (
                      <WebhookRow
                        key={h.id}
                        hook={h}
                        selected={selectedHook?.id === h.id}
                        onClick={() => setSelectedHook(h)}
                      />
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Delivery log */}
            <div className="lg:col-span-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    {selectedHook ? `Deliveries — ${selectedHook.description || selectedHook.url}` : 'Delivery Log'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!selectedHook ? (
                    <div className="flex flex-col items-center py-10 gap-2 text-muted-foreground">
                      <Activity className="h-8 w-8 opacity-30" />
                      <p className="text-sm">Select a webhook endpoint to view deliveries</p>
                    </div>
                  ) : deliveriesLoading ? (
                    <div className="space-y-2">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
                  ) : deliveryList.length === 0 ? (
                    <div className="flex flex-col items-center py-8 gap-2 text-muted-foreground">
                      <CheckCircle2 className="h-6 w-6 opacity-30" />
                      <p className="text-sm">No deliveries recorded yet</p>
                    </div>
                  ) : (
                    deliveryList.map((d) => (
                      <DeliveryRow key={d.id} delivery={d} onRetry={(id) => retryDelivery.mutate(id)} />
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Changelog */}
        <TabsContent value="changelog">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <BookOpen className="h-4 w-4" /> API Changelog
                </CardTitle>
                <Button size="sm" variant="outline" className="text-xs gap-1">
                  <Plus className="h-3.5 w-3.5" /> New Entry
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {changelogLoading ? (
                <div className="space-y-3">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
              ) : changelogList.length === 0 ? (
                <div className="flex flex-col items-center py-10 gap-2 text-muted-foreground">
                  <BookOpen className="h-8 w-8 opacity-30" />
                  <p className="text-sm">No changelog entries yet</p>
                </div>
              ) : (
                changelogList.map((e) => <ChangelogRow key={e.id} entry={e} />)
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SDKs */}
        <TabsContent value="sdks">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Package className="h-4 w-4" /> SDK Registry
              </CardTitle>
              <CardDescription>Published SDK releases across all languages</CardDescription>
            </CardHeader>
            <CardContent>
              {sdkList.length === 0 ? (
                <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : (
                sdkList.map((s) => <SdkCard key={s.id} sdk={s} />)
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sandbox */}
        <TabsContent value="sandbox">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Terminal className="h-4 w-4" /> Sandbox Environments
                  </CardTitle>
                  <CardDescription>Isolated test environments with seeded data</CardDescription>
                </div>
                <Button size="sm" variant="outline" className="text-xs gap-1">
                  <Plus className="h-3.5 w-3.5" /> Create
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {sandboxLoading ? (
                <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
              ) : sandboxList.length === 0 ? (
                <div className="flex flex-col items-center py-10 gap-2 text-muted-foreground">
                  <Terminal className="h-8 w-8 opacity-30" />
                  <p className="text-sm">No sandbox environments</p>
                </div>
              ) : (
                sandboxList.map((env) => (
                  <SandboxRow key={env.id} env={env} onReset={(id) => resetSandbox.mutate(id)} />
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
