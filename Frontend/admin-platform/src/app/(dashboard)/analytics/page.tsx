'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users, Building2, TrendingUp, Activity, BarChart3, Globe,
  MousePointerClick, Clock, RefreshCw, GitBranch,
  DollarSign, ArrowUpRight, ArrowDownRight, Minus,
} from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import KpiCard from '@/components/common/KpiCard';
import AreaChart from '@/components/charts/AreaChart';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { useKpis, useUserGrowth, useOrgGrowth, useRevenue } from '@/lib/queries/analytics.queries';
import { useRevenueByCustomer } from '@/lib/queries/admin-billing.queries';
import { analyticsApi } from '@/lib/api/analytics';
import { useUIStore } from '@/lib/store/uiStore';
import { formatCurrency, formatNumber, formatRelative } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

type Period = '7d' | '30d' | '90d';

// ── Funnel step ───────────────────────────────────────────────────────────────

interface FunnelStep { label: string; count: number; pct: number; drop: number }

function FunnelChart({ steps }: { steps: FunnelStep[] }) {
  const max = steps[0]?.count ?? 1;
  return (
    <div className="space-y-2">
      {steps.map((step, i) => (
        <div key={step.label}>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-medium">{step.label}</span>
            <div className="flex items-center gap-3 text-muted-foreground">
              {i > 0 && (
                <span className="text-red-400">-{step.drop.toFixed(0)}%</span>
              )}
              <span className="font-medium text-foreground">{formatNumber(step.count)}</span>
              <span>{step.pct.toFixed(1)}%</span>
            </div>
          </div>
          <div className="h-6 bg-muted rounded overflow-hidden">
            <div
              className="h-full bg-primary/70 rounded transition-all"
              style={{ width: `${(step.count / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Retention grid ────────────────────────────────────────────────────────────

type RetentionRow = { cohort: string; week0: number; week1: number; week2: number; week3: number; week4: number };

function RetentionGrid({ rows }: { rows: RetentionRow[] }) {
  const heatColor = (pct: number) => {
    if (pct >= 80) return 'bg-green-500/70 text-green-50';
    if (pct >= 60) return 'bg-green-500/40 text-green-100';
    if (pct >= 40) return 'bg-yellow-500/40 text-yellow-100';
    if (pct >= 20) return 'bg-orange-500/40 text-orange-100';
    return 'bg-muted text-muted-foreground';
  };
  const weeks = ['W0', 'W1', 'W2', 'W3', 'W4'];
  const keys: (keyof RetentionRow)[] = ['week0', 'week1', 'week2', 'week3', 'week4'];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr>
            <th className="text-left pb-2 pr-3 font-medium text-muted-foreground">Cohort</th>
            {weeks.map((w) => <th key={w} className="text-center pb-2 px-1 font-medium text-muted-foreground w-14">{w}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.cohort}>
              <td className="py-1 pr-3 text-muted-foreground">{row.cohort}</td>
              {keys.map((k, i) => {
                const val = row[k] as number;
                return (
                  <td key={i} className="py-1 px-1 text-center">
                    <div className={cn('rounded px-1 py-0.5 font-mono', heatColor(val))}>
                      {val > 0 ? `${val}%` : '—'}
                    </div>
                  </td>
                );
              })}
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
                    <div
                      className="h-full bg-primary/60 rounded"
                      style={{ width: `${(p.views / maxViews) * 100}%` }}
                    />
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
                  <p className="text-xs font-medium truncate">
                    {e.action.replace(/\./g, ' › ')}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {e.actor.email} · {e.resource}
                  </p>
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

// ── Mock funnel data (replaced by real API when available) ────────────────────

function useFunnelData() {
  const steps: FunnelStep[] = [
    { label: 'Landing page visit', count: 48200, pct: 100,  drop: 0    },
    { label: 'Sign-up page view',  count: 18300, pct: 38.0, drop: 62.0 },
    { label: 'Registration start', count: 9400,  pct: 19.5, drop: 48.6 },
    { label: 'Email verified',     count: 7100,  pct: 14.7, drop: 24.5 },
    { label: 'Profile completed',  count: 5200,  pct: 10.8, drop: 26.8 },
    { label: 'First action taken', count: 3900,  pct: 8.1,  drop: 25.0 },
  ];
  return steps;
}

function useRetentionData(): RetentionRow[] {
  return [
    { cohort: 'Jan 2025', week0: 100, week1: 62, week2: 48, week3: 41, week4: 37 },
    { cohort: 'Feb 2025', week0: 100, week1: 58, week2: 44, week3: 38, week4: 33 },
    { cohort: 'Mar 2025', week0: 100, week1: 65, week2: 52, week3: 44, week4: 39 },
    { cohort: 'Apr 2025', week0: 100, week1: 61, week2: 47, week3: 40, week4: 0  },
    { cohort: 'May 2025', week0: 100, week1: 67, week2: 53, week3: 0,  week4: 0  },
  ];
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
  const funnelSteps                = useFunnelData();
  const retentionRows              = useRetentionData();

  useEffect(() => { setBreadcrumbs([{ label: 'Analytics' }]); }, [setBreadcrumbs]);

  // Prefer the REAL MRR computed from live subscriptions; fall back to the KPI source.
  const revVal = realRevenue?.totals?.mrr ?? kpis?.monthlyRevenue ?? 0;
  const planColors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500', 'bg-pink-500'];
  const titleCase = (s: string) => s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <PageHeader title="Analytics" description="Growth, funnels, cohorts, retention, traffic, and event analytics" />
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
              <CardContent>
                <AreaChart data={userGrowth ?? []} height={200} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Organization Growth</CardTitle></CardHeader>
              <CardContent>
                <AreaChart data={orgGrowth ?? []} height={200} color="hsl(270 91.2% 59.8%)" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Revenue</CardTitle></CardHeader>
              <CardContent>
                <AreaChart
                  data={revenue ?? []}
                  height={200}
                  color="hsl(142.1 76.2% 36.3%)"
                  formatValue={(v) => formatCurrency(v)}
                />
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
                <CardTitle className="text-sm font-medium">User Acquisition</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { channel: 'Organic search',  count: 2840, pct: 41 },
                  { channel: 'Direct',          count: 1920, pct: 28 },
                  { channel: 'Referral',        count: 1100, pct: 16 },
                  { channel: 'Social',          count:  680, pct: 10 },
                  { channel: 'Email',           count:  360, pct:  5 },
                ].map(({ channel, count, pct }) => (
                  <div key={channel} className="flex items-center gap-3">
                    <span className="text-xs w-28 shrink-0">{channel}</span>
                    <div className="flex-1 h-1.5 bg-muted rounded overflow-hidden">
                      <div className="h-full bg-primary/60 rounded" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground w-10 text-right">{formatNumber(count)}</span>
                  </div>
                ))}
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
                  <GitBranch className="h-4 w-4" /> Sign-up Funnel
                </CardTitle>
                <CardDescription>Conversion through the registration flow</CardDescription>
              </CardHeader>
              <CardContent>
                <FunnelChart steps={funnelSteps} />
                <div className="mt-4 pt-3 border-t flex justify-between text-xs">
                  <span className="text-muted-foreground">Overall conversion</span>
                  <span className="font-semibold text-primary">
                    {((funnelSteps[funnelSteps.length - 1].count / funnelSteps[0].count) * 100).toFixed(1)}%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" /> Payment Funnel
                </CardTitle>
                <CardDescription>Conversion through the subscription checkout</CardDescription>
              </CardHeader>
              <CardContent>
                <FunnelChart steps={[
                  { label: 'Pricing page view',    count: 8400, pct: 100,  drop: 0    },
                  { label: 'Plan selected',        count: 3200, pct: 38.1, drop: 61.9 },
                  { label: 'Checkout started',     count: 2100, pct: 25.0, drop: 34.4 },
                  { label: 'Payment entered',      count: 1680, pct: 20.0, drop: 20.0 },
                  { label: 'Subscription created', count: 1420, pct: 16.9, drop: 15.5 },
                ]} />
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
                <CardDescription>% of users returning each week after sign-up</CardDescription>
              </CardHeader>
              <CardContent>
                <RetentionGrid rows={retentionRows} />
                <div className="mt-4 pt-3 border-t grid grid-cols-3 gap-4 text-center">
                  {[
                    { label: 'Week 1 avg',  value: `${Math.round(retentionRows.map((r) => r.week1).filter(Boolean).reduce((a, b) => a + b, 0) / retentionRows.filter((r) => r.week1 > 0).length)}%` },
                    { label: 'Week 2 avg',  value: `${Math.round(retentionRows.map((r) => r.week2).filter(Boolean).reduce((a, b) => a + b, 0) / retentionRows.filter((r) => r.week2 > 0).length)}%` },
                    { label: 'Week 4 avg',  value: `${Math.round(retentionRows.map((r) => r.week4).filter(Boolean).reduce((a, b) => a + b, 0) / retentionRows.filter((r) => r.week4 > 0).length)}%` },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-2xl font-bold">{value}</p>
                      <p className="text-xs text-muted-foreground">{label}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Churn stats */}
            <div className="grid lg:grid-cols-3 gap-4">
              {[
                { label: 'Monthly churn rate', value: '3.2%', sub: '-0.4% vs last month', icon: TrendingUp, good: true },
                { label: 'Avg subscription age', value: '8.4 mo', sub: '+1.1 vs last month', icon: Clock, good: true },
                { label: 'Churn risk users', value: '142', sub: '28 high-risk', icon: Activity, good: false },
              ].map(({ label, value, sub, icon: Icon, good }) => (
                <Card key={label}>
                  <CardContent className="pt-5">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className="text-2xl font-bold">{value}</p>
                    <p className={cn('text-xs mt-1', good ? 'text-green-500' : 'text-red-400')}>{sub}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Traffic */}
        <TabsContent value="traffic">
          <div className="grid lg:grid-cols-2 gap-6">
            <TopPages period={period} />
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Globe className="h-4 w-4" /> Traffic by Geography
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { country: 'India',          pct: 48, sessions: 18400 },
                  { country: 'United States',  pct: 19, sessions: 7280  },
                  { country: 'United Kingdom', pct: 8,  sessions: 3060  },
                  { country: 'Singapore',      pct: 6,  sessions: 2300  },
                  { country: 'UAE',            pct: 5,  sessions: 1920  },
                  { country: 'Other',          pct: 14, sessions: 5380  },
                ].map(({ country, pct, sessions }) => (
                  <div key={country} className="flex items-center gap-3">
                    <span className="text-xs w-28 shrink-0">{country}</span>
                    <div className="flex-1 h-1.5 bg-muted rounded overflow-hidden">
                      <div className="h-full bg-blue-500/60 rounded" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground w-12 text-right">{pct}%</span>
                    <span className="text-xs text-muted-foreground w-14 text-right">{formatNumber(sessions)}</span>
                  </div>
                ))}
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
                <CardDescription>Most common actions in the platform</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { event: 'auth.login',         count: 84200, delta: 12  },
                  { event: 'user.profile_update', count: 18600, delta: 5   },
                  { event: 'payment.captured',    count: 9400,  delta: 18  },
                  { event: 'auth.logout',         count: 71300, delta: 8   },
                  { event: 'org.member_invited',  count: 3200,  delta: -3  },
                  { event: 'session.revoked',     count: 1100,  delta: -8  },
                  { event: 'oauth.token_issued',  count: 28400, delta: 22  },
                  { event: 'content.published',   count: 840,   delta: 44  },
                ].map(({ event, count, delta }) => {
                  const DeltaIcon = delta > 0 ? ArrowUpRight : delta < 0 ? ArrowDownRight : Minus;
                  const deltaColor = delta > 0 ? 'text-green-400' : delta < 0 ? 'text-red-400' : 'text-muted-foreground';
                  return (
                    <div key={event} className="flex items-center gap-3 py-1.5 border-b last:border-0">
                      <span className="text-xs font-mono text-muted-foreground flex-1 truncate">{event}</span>
                      <span className="text-xs font-medium">{formatNumber(count)}</span>
                      <span className={cn('flex items-center gap-0.5 text-xs', deltaColor)}>
                        <DeltaIcon className="h-3 w-3" />{Math.abs(delta)}%
                      </span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
