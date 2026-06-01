'use client';

import { useEffect, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Users, Building2, Activity, Zap, Shield, TrendingUp,
  CheckCircle2, XCircle, AlertCircle, Clock, RefreshCw,
  Database, Server, Cpu, MemoryStick, ArrowUpRight, ArrowDownRight,
  Plug, CreditCard, KeyRound,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import LiveEventFeed from '@/components/realtime/LiveEventFeed';
import { useUIStore } from '@/lib/store/uiStore';
import { useRealtimeStore } from '@/lib/store/realtimeStore';
import { identityAdminApi } from '@/lib/api/identity-admin';
import { useIntegrationsSummary } from '@/lib/queries/cms-integrations.queries';
import { cn } from '@/lib/utils/cn';

// ── Live clock ────────────────────────────────────────────────────────────────
function LiveClock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const fmt = () => new Date().toLocaleTimeString([], { hour12: false });
    setTime(fmt());
    const t = setInterval(() => setTime(fmt()), 1000);
    return () => clearInterval(t);
  }, []);
  return <span className="font-mono text-sm text-muted-foreground">{time}</span>;
}

// ── Service status dot ────────────────────────────────────────────────────────
function StatusDot({ status }: { status: 'up' | 'down' | 'degraded' | string }) {
  return (
    <span className={cn(
      'h-2 w-2 rounded-full shrink-0',
      status === 'up'       ? 'bg-green-500' :
      status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
    )} />
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
interface KpiProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ComponentType<{ className?: string }>;
  iconColor?: string;
  loading?: boolean;
  unit?: string;
}

function KpiCard({ title, value, change, icon: Icon, iconColor = 'text-primary', loading, unit }: KpiProps) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between mb-3">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{title}</p>
          <Icon className={cn('h-4 w-4', iconColor)} />
        </div>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <div className="flex items-end gap-2">
            <p className="text-2xl font-bold tabular-nums">
              {value}{unit && <span className="text-sm font-normal text-muted-foreground ml-0.5">{unit}</span>}
            </p>
            {change !== undefined && (
              <span className={cn(
                'flex items-center text-xs mb-1',
                change >= 0 ? 'text-green-500' : 'text-red-500'
              )}>
                {change >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {Math.abs(change)}%
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Login trend chart ─────────────────────────────────────────────────────────
function LoginTrendChart({ data }: { data: Array<{ date: string; success: number; failed: number }> }) {
  if (!data?.length) return (
    <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No trend data</div>
  );
  const fmt = (d: string) => {
    try { return new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric' }); }
    catch { return d; }
  };
  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}    />
          </linearGradient>
          <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}    />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
        <XAxis dataKey="date" tickFormatter={fmt} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval={4} />
        <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={32} />
        <Tooltip contentStyle={{ fontSize: 12 }} labelFormatter={fmt} />
        <Area type="monotone" dataKey="success" name="Logins"        stroke="#6366f1" fill="url(#g1)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
        <Area type="monotone" dataKey="failed"  name="Failed Logins" stroke="#ef4444" fill="url(#g2)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── Gauge bar ─────────────────────────────────────────────────────────────────
function MetricBar({ label, value, max = 100, color = 'bg-primary', unit = '%' }: {
  label: string; value: number; max?: number; color?: string; unit?: string;
}) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono font-medium">{value}{unit !== '%' ? unit : ''} <span className="text-muted-foreground">({pct}%)</span></span>
      </div>
      <Progress value={pct} className="h-1.5" />
    </div>
  );
}

// Compact count formatter: 45200 -> "45.2k", 1200000 -> "1.2M".
function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { setBreadcrumbs } = useUIStore();
  const wsState   = useRealtimeStore((s) => s.wsState);
  const services  = useRealtimeStore((s) => s.services);
  const rtStats   = useRealtimeStore((s) => s.stats);
  const infra     = useRealtimeStore((s) => s.infra);
  const queues    = useRealtimeStore((s) => s.queues);

  const { data: integrationSummary } = useIntegrationsSummary();
  const connected = (integrationSummary ?? []).filter((w) => w.configured > 0);

  const [refetchKey, setRefetchKey] = useState(0);

  useEffect(() => { setBreadcrumbs([{ label: 'Command Center' }]); }, [setBreadcrumbs]);

  const { data: identityStats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['identity-stats', refetchKey],
    queryFn: () => identityAdminApi.getStats().then((r) => r.data.data),
    refetchInterval: 30_000,
    retry: false,
  });

  const { data: healthData, isLoading: healthLoading } = useQuery({
    queryKey: ['service-health', refetchKey],
    queryFn: () => fetch('/api/health-check').then((r) => r.json()),
    refetchInterval: 15_000,
    retry: false,
  });

  // Merge: prefer WS services if available, fall back to HTTP health check
  const displayServices = services.length > 0 ? services : (healthData ?? []);

  const refresh = useCallback(() => {
    setRefetchKey((k) => k + 1);
    refetchStats();
  }, [refetchStats]);

  const s = identityStats;
  const rt = rtStats;

  const activeUsers    = rt?.activeUsers     ?? s?.users?.total       ?? 0;
  const activeSessions = rt?.activeSessions  ?? s?.activeSessions     ?? 0;
  const logins24h      = rt?.logins24h       ?? s?.last24h?.logins    ?? 0;
  const failed24h      = rt?.failedLogins24h ?? s?.last24h?.failedLogins ?? 0;
  const orgs           = rt?.orgs            ?? s?.orgs?.total        ?? 0;
  const failureRate    = logins24h > 0 ? Math.round((failed24h / logins24h) * 100) : 0;

  const upCount   = displayServices.filter((sv: { status: string }) => sv.status === 'up').length;
  const downCount = displayServices.filter((sv: { status: string }) => sv.status === 'down').length;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Command Center</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Baalvion Internal Operating System · Real-time platform overview</p>
        </div>
        <div className="flex items-center gap-3">
          <LiveClock />
          <Badge variant="outline" className={cn('gap-1.5 text-xs', wsState === 'connected' ? 'text-green-500 border-green-500/50' : 'text-muted-foreground')}>
            <span className={cn('h-1.5 w-1.5 rounded-full', wsState === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground')} />
            {wsState === 'connected' ? 'Live' : 'Polling'}
          </Badge>
          <Button variant="outline" size="sm" onClick={refresh}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <KpiCard title="Total Users"     value={activeUsers.toLocaleString()}    icon={Users}      iconColor="text-blue-500"   loading={statsLoading} />
        <KpiCard title="Organizations"   value={orgs.toLocaleString()}           icon={Building2}  iconColor="text-purple-500" loading={statsLoading} />
        <KpiCard title="Active Sessions" value={activeSessions.toLocaleString()} icon={Activity}   iconColor="text-green-500"  loading={statsLoading} />
        <KpiCard title="Logins (24h)"    value={logins24h.toLocaleString()}      icon={TrendingUp} iconColor="text-cyan-500"   loading={statsLoading} />
        <KpiCard title="Failed Logins"   value={failed24h.toLocaleString()}      icon={Shield}     iconColor={failed24h > 50 ? 'text-red-500' : 'text-yellow-500'} loading={statsLoading} />
        <KpiCard title="Failure Rate"    value={failureRate}                     icon={Zap}        iconColor={failureRate > 10 ? 'text-red-500' : 'text-muted-foreground'} loading={statsLoading} unit="%" />
      </div>

      {/* ── Row 2: Login Trend + Service Health ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Login trend chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Auth Traffic — 30 Day Trend</CardTitle>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-indigo-500" />Logins</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-500" />Failed</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {statsLoading ? <Skeleton className="h-44 w-full" /> : (
              <LoginTrendChart data={s?.loginTrend ?? []} />
            )}
          </CardContent>
        </Card>

        {/* Service Health */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Service Health</CardTitle>
              {!healthLoading && (
                <div className="flex gap-1">
                  {upCount > 0   && <Badge variant="outline" className="text-xs text-green-500 border-green-500/50 h-5 px-1.5">{upCount} up</Badge>}
                  {downCount > 0 && <Badge variant="destructive" className="text-xs h-5 px-1.5">{downCount} down</Badge>}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-0">
            {healthLoading && services.length === 0 ? (
              Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full mb-1" />)
            ) : displayServices.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">No services configured</p>
            ) : (
              displayServices.map((svc: { name: string; status: string; latencyMs: number | null }) => (
                <div key={svc.name} className="flex items-center gap-2 py-2 border-b border-border/40 last:border-0">
                  <StatusDot status={svc.status} />
                  <span className="text-xs flex-1 font-medium">{svc.name}</span>
                  {svc.latencyMs !== null && (
                    <span className={cn(
                      'text-[11px] font-mono',
                      svc.latencyMs > 500 ? 'text-red-500' : svc.latencyMs > 200 ? 'text-yellow-500' : 'text-green-500'
                    )}>
                      {svc.latencyMs}ms
                    </span>
                  )}
                  <span className={cn(
                    'text-[10px] uppercase font-medium',
                    svc.status === 'up' ? 'text-green-500' : svc.status === 'degraded' ? 'text-yellow-500' : 'text-red-500'
                  )}>
                    {svc.status}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Row 3: Queue Health + Infra Metrics + Live Events ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Queue Health */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              Queue Health
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            {(queues.length > 0
              ? queues.slice(0, 6)
              : [
                  { name: 'email',   displayName: 'Email Queue',       waiting: 0, active: 0, failed: 0 },
                  { name: 'webhook', displayName: 'Webhook Queue',     waiting: 0, active: 0, failed: 0 },
                  { name: 'dlq',     displayName: 'Dead Letter Queue', waiting: 0, active: 0, failed: 0 },
                ]
            ).map((q) => (
              <div key={q.name} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">{q.displayName || q.name}</span>
                  {q.failed > 0 ? (
                    <Badge variant="destructive" className="text-[10px] h-4 px-1">{q.failed} failed</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] h-4 px-1 text-green-500 border-green-500/50">healthy</Badge>
                  )}
                </div>
                <div className="flex gap-3 text-[11px] text-muted-foreground">
                  <span>waiting: <span className="text-foreground font-mono">{q.waiting}</span></span>
                  <span>active: <span className="text-foreground font-mono">{q.active}</span></span>
                </div>
              </div>
            ))}
            {queues.length === 0 && (
              <>
                <Separator />
                <p className="text-xs text-muted-foreground text-center">Waiting for live queue data…</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Infrastructure Metrics */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Server className="h-4 w-4 text-blue-500" />
              Infrastructure
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3.5">
            <MetricBar label="CPU Usage" value={infra ? Math.round(infra.cpu) : 0} color="bg-blue-500" />
            <MetricBar label="Memory"    value={infra ? Math.round(infra.memory) : 0} color="bg-purple-500" />
            <MetricBar label="Disk"      value={infra ? Math.round(infra.disk) : 0} color="bg-cyan-500" />
            <Separator />
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-muted-foreground">Redis Keys</p>
                <p className="font-mono font-semibold">{infra ? formatCount(infra.redis.keyCount) : '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Hit Rate</p>
                <p className="font-mono font-semibold text-green-500">{infra ? `${Math.round(infra.redis.hitRate)}%` : '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">DB Conns</p>
                <p className="font-mono font-semibold">{infra ? `${infra.postgres.connections}/${infra.postgres.maxConnections}` : '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Active Queries</p>
                <p className="font-mono font-semibold">{infra ? infra.postgres.activeQueries : '—'}</p>
              </div>
            </div>
            {!infra && (
              <p className="text-[11px] text-muted-foreground text-center pt-1">Waiting for realtime metrics…</p>
            )}
          </CardContent>
        </Card>

        {/* Live Event Feed */}
        <Card className="flex flex-col">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-green-500" />
              Live Events
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 flex-1">
            <LiveEventFeed maxHeight={320} />
          </CardContent>
        </Card>
      </div>

      {/* ── Row 4: Audit snapshot ── */}
      {s?.loginTrend && s.loginTrend.length > 0 && (
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-medium">Daily Auth Distribution (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <ResponsiveContainer width="100%" height={100}>
              <BarChart data={s.loginTrend} margin={{ top: 2, right: 8, bottom: 0, left: 0 }}>
                <XAxis dataKey="date" tickFormatter={(d) => { try { return new Date(d).toLocaleDateString([], { day: 'numeric' }); } catch { return d; } }} tick={{ fontSize: 9 }} tickLine={false} axisLine={false} interval={3} />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Bar dataKey="success" name="Success" fill="#6366f1" radius={[2, 2, 0, 0]} isAnimationActive={false} />
                <Bar dataKey="failed"  name="Failed"  fill="#ef4444" radius={[2, 2, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* ── Row 5: Website Connections (per-website API & payment keys) ── */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Plug className="h-4 w-4 text-orange-500" />
              Website Connections
            </span>
            {integrationSummary && (
              <span className="text-xs font-normal text-muted-foreground">
                {connected.length}/{integrationSummary.length} configured
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <p className="mb-3 text-xs text-muted-foreground">
            Per-website API endpoints &amp; payment keys. Add a key on any site and the platform uses it live.
          </p>
          <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
            {(integrationSummary ?? []).map((w) => (
              <Link
                key={w.websiteId}
                href={`/cms/websites/${w.websiteId}/integrations`}
                className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-xs transition-colors hover:bg-muted/50"
              >
                <span className="truncate font-medium">{w.name}</span>
                <span className="flex shrink-0 items-center gap-1">
                  <KeyRound
                    className={cn('h-3.5 w-3.5', w.hasApi ? 'text-green-500' : 'text-muted-foreground/40')}
                  />
                  <CreditCard
                    className={cn('h-3.5 w-3.5', w.hasPayment ? 'text-green-500' : 'text-muted-foreground/40')}
                  />
                  {w.configured > 0 ? (
                    <Badge variant="outline" className="h-4 border-green-500/40 px-1 text-[9px] text-green-600">
                      {w.configured}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="h-4 px-1 text-[9px] text-muted-foreground">
                      set up
                    </Badge>
                  )}
                </span>
              </Link>
            ))}
            {!integrationSummary?.length && (
              <p className="col-span-full py-4 text-center text-xs text-muted-foreground">
                Loading website connections…
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
