'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users, Building2, TrendingUp, Activity, Globe, GitBranch, DollarSign,
} from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import KpiCard from '@/components/common/KpiCard';
import AreaChart from '@/components/charts/AreaChart';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useKpis, useUserGrowth, useOrgGrowth, useRevenue,
  useActivationFunnel, useRetentionCohorts, useSignupChannels, useGeography, useEventTypeBreakdown,
  usePaymentFunnel,
} from '@/lib/queries/analytics.queries';
import { useRevenueByCustomer } from '@/lib/queries/admin-billing.queries';
import { analyticsApi } from '@/lib/api/analytics';
import { useUIStore } from '@/lib/store/uiStore';
import { formatCurrency, formatNumber, formatRelative } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

type Period = '7d' | '30d' | '90d';

// ── Funnel step ───────────────────────────────────────────────────────────────

interface FunnelStep { label: string; count: number }

function FunnelChart({ steps }: { steps: FunnelStep[] }) {
  const max = steps[0]?.count || 1;
  return (
    <div className="space-y-2">
      {steps.map((step, i) => {
        const pct = max > 0 ? (step.count / max) * 100 : 0;
        const prev = i > 0 ? steps[i - 1].count : step.count;
        const drop = prev > 0 ? ((prev - step.count) / prev) * 100 : 0;
        return (
          <div key={step.label}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-medium">{step.label}</span>
              <div className="flex items-center gap-3 text-muted-foreground">
                {i > 0 && drop > 0 && <span className="text-red-400">-{drop.toFixed(0)}%</span>}
                <span className="font-medium text-foreground">{formatNumber(step.count)}</span>
                <span>{pct.toFixed(1)}%</span>
              </div>
            </div>
            <div className="h-6 bg-muted rounded overflow-hidden">
              <div className="h-full bg-primary/70 rounded transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Retention grid ────────────────────────────────────────────────────────────

interface RetentionRow { cohortWeek: string; cohortSize: number; retention: number[] }

function RetentionGrid({ rows }: { rows: RetentionRow[] }) {
  const heatColor = (pct: number) => {
    if (pct >= 80) return 'bg-green-500/70 text-green-50';
    if (pct >= 60) return 'bg-green-500/40 text-green-100';
    if (pct >= 40) return 'bg-yellow-500/40 text-yellow-100';
    if (pct >= 20) return 'bg-orange-500/40 text-orange-100';
    return 'bg-muted text-muted-foreground';
  };
  const weeks = ['W0', 'W1', 'W2', 'W3'];

  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground py-4 text-center">No registration cohorts in this period yet</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr>
            <th className="text-left pb-2 pr-3 font-medium text-muted-foreground">Cohort</th>
            <th className="text-center pb-2 px-1 font-medium text-muted-foreground w-16">Size</th>
            {weeks.map((w) => <th key={w} className="text-center pb-2 px-1 font-medium text-muted-foreground w-14">{w}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.cohortWeek}>
              <td className="py-1 pr-3 text-muted-foreground">{row.cohortWeek}</td>
              <td className="py-1 px-1 text-center text-muted-foreground">{row.cohortSize}</td>
              {row.retention.map((val, i) => (
                <td key={i} className="py-1 px-1 text-center">
                  <div className={cn('rounded px-1 py-0.5 font-mono', heatColor(val))}>
                    {val > 0 ? `${val}%` : '—'}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Top pages table ───────────────────────────────────────────────────────────

function TopPages({ period }: { period: Period }) {
  const { data, isLoading } = useQuery({
    queryKey: ['traffic-by-page', period],
    queryFn: () => analyticsApi.trafficByPage(period === '90d' ? '30d' : period).then((r) => r.data.data),
    staleTime: 60_000,
  });

  const pages = data ?? [];
  const maxViews = pages[0]?.views ?? 1;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Globe className="h-4 w-4" /> Top Pages
        </CardTitle>
        <CardDescription>Most visited pages this period</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
        ) : pages.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No traffic data</p>
        ) : (
          <div>
            {pages.slice(0, 10).map((p) => (
              <div key={p.page} className="flex items-center gap-3 py-2 border-b last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono truncate text-muted-foreground">{p.page}</p>
                  <div className="mt-1 h-1.5 bg-muted rounded overflow-hidden">
                    <div className="h-full bg-primary/60 rounded" style={{ width: `${(p.views / maxViews) * 100}%` }} />
                  </div>
                </div>
                <div className="shrink-0 text-right text-xs">
                  <p className="font-medium">{formatNumber(p.views)}</p>
                  <p className="text-muted-foreground">{formatNumber(p.uniqueVisitors)} uniq</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Recent activity ───────────────────────────────────────────────────────────

function ActivityFeedCard() {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics-activity-full'],
    queryFn: () => analyticsApi.recentActivity(20).then((r) => r.data.data),
    refetchInterval: 30_000,
  });
  const events = data ?? [];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Activity className="h-4 w-4" /> Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : events.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No recent events</p>
        ) : (
          <div>
            {events.map((e) => (
              <div key={e.id} className="flex items-start gap-2.5 py-2 border-b last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{e.action.replace(/\./g, ' › ')}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{e.actor.email} · {e.resource}</p>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0">{formatRelative(e.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Bar list (generic real-data breakdown) ────────────────────────────────────

function BarList({ rows, labelWidth = 'w-28' }: { rows: Array<{ label: string; count: number }>; labelWidth?: string }) {
  if (rows.length === 0) return <p className="text-xs text-muted-foreground py-4 text-center">No data in this period</p>;
  const max = rows[0]?.count || 1;
  return (
    <div className="space-y-2">
      {rows.map(({ label, count }) => (
        <div key={label} className="flex items-center gap-3">
          <span className={cn('text-xs shrink-0 truncate', labelWidth)}>{label}</span>
          <div className="flex-1 h-1.5 bg-muted rounded overflow-hidden">
            <div className="h-full bg-primary/60 rounded" style={{ width: `${(count / max) * 100}%` }} />
          </div>
          <span className="text-xs text-muted-foreground w-14 text-right">{formatNumber(count)}</span>
        </div>
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>('30d');
  const [tab, setTab]       = useState('overview');
  const { setBreadcrumbs }  = useUIStore();

  const { data: kpis, isLoading }  = useKpis(period);
  const { data: userGrowth }       = useUserGrowth(period);
  const { data: orgGrowth }        = useOrgGrowth(period);
  const { data: revenue }          = useRevenue(period);
  const { data: realRevenue }      = useRevenueByCustomer(); // real MRR + per-plan from proxy billing
  const { data: funnel }           = useActivationFunnel(period);
  const { data: retention }        = useRetentionCohorts(period);
  const { data: signupChannels }   = useSignupChannels(period);
  const { data: geography }        = useGeography(period);
  const { data: eventTypes }       = useEventTypeBreakdown(period);
  const { data: paymentFunnel }    = usePaymentFunnel();

  useEffect(() => { setBreadcrumbs([{ label: 'Analytics' }]); }, [setBreadcrumbs]);

  // Prefer the REAL MRR computed from live subscriptions; fall back to the KPI source.
  const revVal = realRevenue?.totals?.mrr ?? kpis?.monthlyRevenue ?? 0;
  const planColors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500', 'bg-pink-500'];
  const titleCase = (s: string) => s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const funnelSteps: FunnelStep[] = (funnel ?? []).map((f) => ({ label: f.step, count: f.count }));
  const avgRetentionWeek = (idx: number) => {
    const vals = (retention ?? []).map((r) => r.retention[idx]).filter((v) => v > 0);
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <PageHeader title="Analytics" description="Growth, funnels, cohorts, retention, traffic, and event analytics — all live data" />
        <div className="flex items-center gap-2">
          {(['7d', '30d', '90d'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                'px-3 py-1 text-xs rounded-md border transition-colors',
                period === p ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted',
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Total Users"    value={kpis?.totalUsers ?? 0}            change={kpis?.userGrowth}         icon={Users}      iconColor="text-blue-500"   isLoading={isLoading} />
        <KpiCard title="Organizations"  value={kpis?.totalOrgs ?? 0}             change={kpis?.orgGrowth}          icon={Building2}  iconColor="text-purple-500" isLoading={isLoading} />
        <KpiCard title="Subscriptions"  value={kpis?.activeSubscriptions ?? 0}   change={kpis?.subscriptionGrowth} icon={Activity}   iconColor="text-green-500"  isLoading={isLoading} />
        <KpiCard title="Revenue (MRR)"  value={`$${revVal.toLocaleString()}`}     change={kpis?.revenueGrowth}      format="raw"      icon={TrendingUp} iconColor="text-orange-500" isLoading={!realRevenue && isLoading} />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4 flex-wrap h-auto gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="funnels">Funnels</TabsTrigger>
          <TabsTrigger value="retention">Retention</TabsTrigger>
          <TabsTrigger value="traffic">Traffic</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader><CardTitle className="text-base">User Growth</CardTitle></CardHeader>
              <CardContent><AreaChart data={userGrowth ?? []} height={200} /></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Organization Growth</CardTitle></CardHeader>
              <CardContent><AreaChart data={orgGrowth ?? []} height={200} color="hsl(270 91.2% 59.8%)" /></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Revenue</CardTitle></CardHeader>
              <CardContent>
                <AreaChart data={revenue ?? []} height={200} color="hsl(142.1 76.2% 36.3%)" formatValue={(v) => formatCurrency(v)} />
              </CardContent>
            </Card>
          </div>

          {/* Revenue breakdown */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Revenue by Plan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(realRevenue?.byPlan ?? [])
                  .filter((p) => p.mrr > 0 || p.lifetimeRevenue > 0)
                  .map((p, i) => (
                    <div key={p.planSlug}>
                      <div className="flex justify-between text-xs mb-1">
                        <span>{titleCase(p.planSlug)}</span>
                        <span className="text-muted-foreground">{p.sharePct}% · ${p.mrr.toLocaleString()}/mo</span>
                      </div>
                      <div className="h-2 bg-muted rounded overflow-hidden">
                        <div className={cn('h-full rounded', planColors[i % planColors.length])} style={{ width: `${Math.max(2, p.sharePct)}%` }} />
                      </div>
                    </div>
                  ))}
                {(realRevenue?.byPlan ?? []).filter((p) => p.mrr > 0 || p.lifetimeRevenue > 0).length === 0 && (
                  <p className="text-xs text-muted-foreground">No revenue yet.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Signup Method</CardTitle>
                <CardDescription>How users registered — not marketing-channel attribution (no UTM/referrer capture exists yet)</CardDescription>
              </CardHeader>
              <CardContent>
                <BarList rows={(signupChannels ?? []).map((c) => ({ label: c.channel, count: c.count }))} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Funnels */}
        <TabsContent value="funnels">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <GitBranch className="h-4 w-4" /> Activation Funnel
                </CardTitle>
                <CardDescription>Registered → verified → first login → MFA, from real auth events</CardDescription>
              </CardHeader>
              <CardContent>
                {funnelSteps.length === 0 || funnelSteps[0].count === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No registrations in this period</p>
                ) : (
                  <>
                    <FunnelChart steps={funnelSteps} />
                    <div className="mt-4 pt-3 border-t flex justify-between text-xs">
                      <span className="text-muted-foreground">Overall conversion</span>
                      <span className="font-semibold text-primary">
                        {((funnelSteps[funnelSteps.length - 1].count / funnelSteps[0].count) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" /> Payment Funnel
                </CardTitle>
                <CardDescription>Checkout conversion from gateway transaction events</CardDescription>
              </CardHeader>
              <CardContent>
                {paymentFunnel?.available ? (
                  <FunnelChart steps={paymentFunnel.steps.map((s) => ({ label: s.step, count: s.count }))} />
                ) : (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    {paymentFunnel?.reason === 'not_configured' &&
                      'Not configured — set PAYMENT_SERVICE_URL on admin-service once the gateway transaction service is reachable.'}
                    {paymentFunnel?.reason === 'no_caller_token' && 'Needs an authenticated session.'}
                    {paymentFunnel?.reason?.startsWith('http_') && `Upstream error (${paymentFunnel.reason}).`}
                    {(paymentFunnel?.reason === 'timeout' || paymentFunnel?.reason === 'error') && 'Payment service unreachable.'}
                    {!paymentFunnel && 'Loading…'}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Retention */}
        <TabsContent value="retention">
          <div className="grid gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Weekly Retention Cohorts</CardTitle>
                <CardDescription>% of each signup week&apos;s cohort with a login event in weeks 0–3</CardDescription>
              </CardHeader>
              <CardContent>
                <RetentionGrid rows={retention ?? []} />
                {(retention ?? []).length > 0 && (
                  <div className="mt-4 pt-3 border-t grid grid-cols-3 gap-4 text-center">
                    {[0, 1, 2].map((idx) => {
                      const val = avgRetentionWeek(idx);
                      return (
                        <div key={idx}>
                          <p className="text-2xl font-bold">{val !== null ? `${val}%` : '—'}</p>
                          <p className="text-xs text-muted-foreground">Week {idx} avg</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Traffic */}
        <TabsContent value="traffic">
          <div className="grid lg:grid-cols-2 gap-6">
            <TopPages period={period} />
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Globe className="h-4 w-4" /> Users by Country
                </CardTitle>
                <CardDescription>Distinct users per resolved session IP geolocation</CardDescription>
              </CardHeader>
              <CardContent>
                <BarList rows={(geography ?? []).map((g) => ({ label: g.country, count: g.users }))} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Activity */}
        <TabsContent value="activity">
          <div className="grid lg:grid-cols-2 gap-6">
            <ActivityFeedCard />
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Top Event Types</CardTitle>
                <CardDescription>Most common audit-logged actions in the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <BarList
                  labelWidth="w-40"
                  rows={(eventTypes ?? []).map((e) => ({ label: e.event, count: e.count }))}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
