'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Activity, Server, CheckCircle2, XCircle, Clock, ExternalLink,
  Cpu, HardDrive, Network, Database, Zap, BarChart3,
  RefreshCw, AlertTriangle, Layers, Container, GitBranch,
} from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useUIStore } from '@/lib/store/uiStore';
import { useRealtimeStore } from '@/lib/store/realtimeStore';
import { formatNumber, formatBytes } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ServiceStatus {
  name: string;
  url: string;
  port: number;
  status: 'up' | 'down' | 'unknown';
  latencyMs?: number;
  checkedAt?: string;
}

// ── Health check API ──────────────────────────────────────────────────────────

async function fetchServiceHealth(): Promise<ServiceStatus[]> {
  const res = await fetch('/api/health-check');
  if (!res.ok) throw new Error('Health check failed');
  return res.json();
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ServiceStatus['status'] }) {
  if (status === 'up')
    return <Badge variant="outline" className="gap-1 text-green-600 border-green-500"><CheckCircle2 className="h-3 w-3" />Up</Badge>;
  if (status === 'down')
    return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Down</Badge>;
  return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />Unknown</Badge>;
}

// ── Service row ───────────────────────────────────────────────────────────────

function ServiceRow({ svc }: { svc: ServiceStatus }) {
  return (
    <div className="flex items-center gap-4 py-3 border-b last:border-0">
      <Server className="h-4 w-4 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{svc.name}</p>
        <p className="text-xs text-muted-foreground font-mono">{svc.url}</p>
      </div>
      {svc.latencyMs !== undefined && (
        <span className={cn(
          'text-xs hidden sm:block',
          svc.latencyMs < 50 ? 'text-green-500' : svc.latencyMs < 200 ? 'text-yellow-500' : 'text-red-500'
        )}>
          {svc.latencyMs}ms
        </span>
      )}
      <StatusBadge status={svc.status} />
    </div>
  );
}

// ── Metric gauge ──────────────────────────────────────────────────────────────

function MetricGauge({ label, value, max = 100, unit = '%', warn = 75, danger = 90, icon: Icon }: {
  label: string; value: number; max?: number; unit?: string;
  warn?: number; danger?: number; icon: React.ComponentType<{ className?: string }>;
}) {
  const pct = Math.min((value / max) * 100, 100);
  const color = pct >= danger ? 'text-red-500' : pct >= warn ? 'text-yellow-500' : 'text-green-500';
  const barColor = pct >= danger ? 'bg-red-500' : pct >= warn ? 'bg-yellow-500' : 'bg-green-500';

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5 text-xs">
          <Icon className={cn('h-3.5 w-3.5', color)} />
          <span>{label}</span>
        </div>
        <span className={cn('text-xs font-semibold', color)}>{value.toFixed(1)}{unit}</span>
      </div>
      <div className="h-2 bg-muted rounded overflow-hidden">
        <div className={cn('h-full rounded transition-all', barColor)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ── Queue stat row ────────────────────────────────────────────────────────────

function QueueRow({ q }: { q: { name: string; displayName: string; waiting: number; active: number; completed: number; failed: number; delayed: number } }) {
  const hasFailures = q.failed > 0;
  return (
    <div className="flex items-center gap-3 py-3 border-b last:border-0">
      <div className={cn(
        'h-2 w-2 rounded-full shrink-0',
        hasFailures ? 'bg-red-500' : q.active > 0 ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground',
      )} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{q.displayName}</p>
        <p className="text-xs text-muted-foreground font-mono">{q.name}</p>
      </div>
      <div className="flex items-center gap-3 text-xs shrink-0">
        {q.active > 0    && <span className="text-blue-400">{q.active} active</span>}
        {q.waiting > 0   && <span className="text-yellow-400">{q.waiting} waiting</span>}
        {q.delayed > 0   && <span className="text-muted-foreground">{q.delayed} delayed</span>}
        {q.failed > 0    && <span className="text-red-400">{q.failed} failed</span>}
        <span className="text-muted-foreground">{formatNumber(q.completed)} done</span>
      </div>
    </div>
  );
}

// ── Mock K8s pod data ─────────────────────────────────────────────────────────

const MOCK_PODS = [
  { name: 'auth-service-7d4b9c-xkv2p',       status: 'Running',   restarts: 0,  cpu: '12m',  memory: '128Mi',  age: '8d'  },
  { name: 'auth-service-7d4b9c-m2bsp',       status: 'Running',   restarts: 0,  cpu: '9m',   memory: '118Mi',  age: '8d'  },
  { name: 'session-service-6c9f-48vzt',       status: 'Running',   restarts: 1,  cpu: '8m',   memory: '96Mi',   age: '5d'  },
  { name: 'notification-svc-9b7f8d-vr4lq',   status: 'Running',   restarts: 0,  cpu: '6m',   memory: '80Mi',   age: '12d' },
  { name: 'oauth-service-5d8c-pqrtx',         status: 'Running',   restarts: 0,  cpu: '5m',   memory: '72Mi',   age: '12d' },
  { name: 'realtime-service-4e6b-lkmwj',      status: 'Running',   restarts: 2,  cpu: '22m',  memory: '192Mi',  age: '2d'  },
  { name: 'admin-service-8f3a2c-nvzqt',       status: 'Running',   restarts: 0,  cpu: '4m',   memory: '64Mi',   age: '3d'  },
  { name: 'cms-service-3b7d1e-xpqrt',         status: 'Pending',   restarts: 0,  cpu: '0m',   memory: '0',      age: '4m'  },
  { name: 'jobs-service-2c4a6f-mnvqz',        status: 'CrashLoop', restarts: 14, cpu: '0m',   memory: '0',      age: '1h'  },
  { name: 'kong-gateway-8d2b5f-trxzp',        status: 'Running',   restarts: 0,  cpu: '45m',  memory: '256Mi',  age: '30d' },
];

const POD_STATUS_COLOR: Record<string, string> = {
  Running:   'text-green-500 bg-green-500/10 border-green-500/30',
  Pending:   'text-yellow-500 bg-yellow-500/10 border-yellow-500/30',
  CrashLoop: 'text-red-500 bg-red-500/10 border-red-500/30',
  Failed:    'text-red-500 bg-red-500/10 border-red-500/30',
};

// ── Observability links ───────────────────────────────────────────────────────

const OBSERVABILITY_LINKS = [
  { label: 'Grafana',    href: 'http://localhost:3100',  desc: 'Dashboards & metrics',    icon: BarChart3 },
  { label: 'Jaeger',     href: 'http://localhost:16686', desc: 'Distributed tracing',     icon: GitBranch },
  { label: 'Prometheus', href: 'http://localhost:9090',  desc: 'Raw metrics & alerts',    icon: Activity  },
  { label: 'Loki',       href: 'http://localhost:3200',  desc: 'Log aggregation',         icon: Layers    },
];

// ── Main page ─────────────────────────────────────────────────────────────────

export default function InfrastructurePage() {
  const { setBreadcrumbs } = useUIStore();
  const [tab, setTab] = useState('services');
  const infra  = useRealtimeStore((s) => s.infra);
  const queues = useRealtimeStore((s) => s.queues);

  useEffect(() => { setBreadcrumbs([{ label: 'Infrastructure' }]); }, [setBreadcrumbs]);

  const { data: services, isLoading, dataUpdatedAt } = useQuery({
    queryKey: ['service-health'],
    queryFn: fetchServiceHealth,
    refetchInterval: 30_000,
    retry: false,
  });

  const upCount   = services?.filter((s) => s.status === 'up').length   ?? 0;
  const downCount = services?.filter((s) => s.status === 'down').length ?? 0;
  const runningPods   = MOCK_PODS.filter((p) => p.status === 'Running').length;
  const problemPods   = MOCK_PODS.filter((p) => p.status !== 'Running').length;
  const queueFailures = queues.reduce((acc, q) => acc + q.failed, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Infrastructure Control Plane"
        description="Service health, Kubernetes pods, queues, metrics, and observability"
        actions={
          <Badge variant="outline" className="gap-1">
            <Activity className="h-3 w-3" /> Refreshes every 30s
          </Badge>
        }
      />

      {/* Summary row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground">Services Up</p>
              <Server className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-green-600">{upCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground">Services Down</p>
              <AlertTriangle className={cn('h-4 w-4', downCount > 0 ? 'text-red-500' : 'text-muted-foreground')} />
            </div>
            <p className={cn('text-2xl font-bold', downCount > 0 ? 'text-red-500' : '')}>{downCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground">K8s Pods Running</p>
              <Container className={cn('h-4 w-4', problemPods > 0 ? 'text-yellow-500' : 'text-green-500')} />
            </div>
            <p className="text-2xl font-bold">{runningPods}<span className="text-sm text-muted-foreground">/{MOCK_PODS.length}</span></p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground">Queue Failures</p>
              <Zap className={cn('h-4 w-4', queueFailures > 0 ? 'text-red-500' : 'text-muted-foreground')} />
            </div>
            <p className={cn('text-2xl font-bold', queueFailures > 0 ? 'text-red-500' : '')}>{queueFailures}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4 flex-wrap h-auto gap-1">
          <TabsTrigger value="services">Backend Services</TabsTrigger>
          <TabsTrigger value="k8s">
            Kubernetes
            {problemPods > 0 && <Badge variant="destructive" className="ml-1.5 text-[10px] h-4 px-1">{problemPods}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="metrics">System Metrics</TabsTrigger>
          <TabsTrigger value="queues">
            Queues
            {queueFailures > 0 && <Badge variant="destructive" className="ml-1.5 text-[10px] h-4 px-1">{queueFailures}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="observability">Observability</TabsTrigger>
        </TabsList>

        {/* Backend Services */}
        <TabsContent value="services">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Server className="h-4 w-4" /> Backend Services
              </CardTitle>
              <CardDescription>
                Last checked: {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : '—'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : !services?.length ? (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  No service data — ensure the health-check API route is configured
                </p>
              ) : (
                services.map((s) => <ServiceRow key={s.name} svc={s} />)
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Kubernetes */}
        <TabsContent value="k8s">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Container className="h-4 w-4" /> Pod Explorer
                  </CardTitle>
                  <CardDescription>Namespace: baalvion-production</CardDescription>
                </div>
                <Badge variant="outline" className="text-xs">
                  {runningPods}/{MOCK_PODS.length} running
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b">
                      {['Pod Name', 'Status', 'CPU', 'Memory', 'Restarts', 'Age'].map((h) => (
                        <th key={h} className="text-left pb-2 pr-4 font-medium text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_PODS.map((pod) => (
                      <tr key={pod.name} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 pr-4 font-mono text-[11px] text-muted-foreground truncate max-w-[200px]">{pod.name}</td>
                        <td className="py-2.5 pr-4">
                          <Badge variant="outline" className={cn('text-[10px] h-4 px-1.5', POD_STATUS_COLOR[pod.status] ?? '')}>
                            {pod.status}
                          </Badge>
                        </td>
                        <td className="py-2.5 pr-4 font-mono">{pod.cpu}</td>
                        <td className="py-2.5 pr-4 font-mono">{pod.memory}</td>
                        <td className={cn('py-2.5 pr-4 font-medium', pod.restarts > 5 ? 'text-red-400' : pod.restarts > 0 ? 'text-yellow-400' : 'text-muted-foreground')}>
                          {pod.restarts}
                        </td>
                        <td className="py-2.5 pr-4 text-muted-foreground">{pod.age}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Metrics */}
        <TabsContent value="metrics">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Host metrics */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Cpu className="h-4 w-4" /> Host Resources
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {infra ? (
                  <>
                    <MetricGauge label="CPU Usage"    value={infra.cpu}    unit="%" icon={Cpu}      />
                    <MetricGauge label="Memory Usage" value={infra.memory} unit="%" icon={HardDrive} />
                    <MetricGauge label="Disk Usage"   value={infra.disk}   unit="%" icon={HardDrive} warn={80} danger={90} />
                    <div className="pt-2 border-t space-y-1 text-xs text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Network In</span>
                        <span className="font-medium text-foreground">{infra.network.inKbps.toFixed(0)} KB/s</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Network Out</span>
                        <span className="font-medium text-foreground">{infra.network.outKbps.toFixed(0)} KB/s</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
                    <p className="text-xs text-muted-foreground text-center pt-2">Waiting for realtime metrics…</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* DB / Redis metrics */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Database className="h-4 w-4" /> PostgreSQL
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {infra ? (
                    <>
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <p className="text-muted-foreground">Connections</p>
                          <p className="text-lg font-bold">{infra.postgres.connections}<span className="text-muted-foreground text-xs">/{infra.postgres.maxConnections}</span></p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Active Queries</p>
                          <p className="text-lg font-bold">{infra.postgres.activeQueries}</p>
                        </div>
                      </div>
                      <MetricGauge
                        label="Connection pool"
                        value={(infra.postgres.connections / infra.postgres.maxConnections) * 100}
                        unit="%"
                        icon={Database}
                        warn={70}
                        danger={90}
                      />
                      {infra.postgres.replicationLag > 0 && (
                        <div className="flex items-center gap-2 text-xs text-yellow-500 pt-1">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Replication lag: {infra.postgres.replicationLag}ms
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}</div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Zap className="h-4 w-4" /> Redis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {infra ? (
                    <>
                      <div className="grid grid-cols-2 gap-4 text-xs mb-2">
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
                        <span>Memory</span>
                        <span className="font-medium">{infra.redis.memoryMb.toFixed(0)} MB</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span>Hit rate</span>
                        <span className={cn('font-medium', infra.redis.hitRate >= 0.9 ? 'text-green-500' : 'text-yellow-500')}>
                          {(infra.redis.hitRate * 100).toFixed(1)}%
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Queues */}
        <TabsContent value="queues">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Zap className="h-4 w-4" /> BullMQ Job Queues
              </CardTitle>
              <CardDescription>Live queue state from realtime websocket feed</CardDescription>
            </CardHeader>
            <CardContent>
              {queues.length === 0 ? (
                <div className="flex flex-col items-center py-10 gap-2 text-muted-foreground">
                  <Zap className="h-8 w-8 opacity-30" />
                  <p className="text-sm">No queue data — waiting for realtime connection</p>
                  <p className="text-xs">Queue stats are pushed via WebSocket from the realtime service</p>
                </div>
              ) : (
                queues.map((q) => <QueueRow key={q.name} q={q} />)
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Observability */}
        <TabsContent value="observability">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4" /> Observability Stack
                </CardTitle>
                <CardDescription>Quick links to monitoring tools</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {OBSERVABILITY_LINKS.map((link) => (
                  <div key={link.label} className="flex items-center gap-3 py-3 border-b last:border-0">
                    <div className="h-8 w-8 rounded-md border bg-muted flex items-center justify-center shrink-0">
                      <link.icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{link.label}</p>
                      <p className="text-xs text-muted-foreground">{link.desc}</p>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <a href={link.href} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </Button>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground pt-2">
                  Links point to localhost — update for production via environment variables.
                </p>
              </CardContent>
            </Card>

            {/* OpenTelemetry summary */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Network className="h-4 w-4" /> OpenTelemetry Status
                </CardTitle>
                <CardDescription>Tracing, metrics, and log exporters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: 'Traces (Jaeger OTLP)',      status: 'active',   rate: '1,240 spans/min' },
                  { label: 'Metrics (Prometheus)',       status: 'active',   rate: '980 metrics/min'  },
                  { label: 'Logs (Loki)',                status: 'active',   rate: '4,200 logs/min'   },
                  { label: 'Error tracking (Sentry)',    status: 'inactive', rate: 'Not configured'   },
                ].map(({ label, status, rate }) => (
                  <div key={label} className="flex items-center gap-3 py-2 border-b last:border-0">
                    <div className={cn(
                      'h-2 w-2 rounded-full shrink-0',
                      status === 'active' ? 'bg-green-500' : 'bg-muted-foreground',
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{label}</p>
                      <p className="text-xs text-muted-foreground">{rate}</p>
                    </div>
                    <Badge
                      variant={status === 'active' ? 'outline' : 'secondary'}
                      className={cn('text-[10px] h-4 px-1.5', status === 'active' && 'text-green-500 border-green-500/50')}
                    >
                      {status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
