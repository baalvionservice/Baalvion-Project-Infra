'use client';

import { use, useState } from 'react';
import {
  Users, Eye, MousePointerClick, Clock, TrendingDown, Activity,
  Radio, RefreshCw, Globe2, Monitor, PlugZap, CheckCircle2, Circle,
  Gauge, Zap, Search, MousePointer, FileText, FileStack, CalendarClock, PenLine, UserSquare2,
  ShoppingCart, DollarSign, Megaphone, ShieldAlert, Server, Bot, Package, UserCheck, Cpu, ListChecks,
  BadgeDollarSign, GitCompareArrows, AlertTriangle, Target, Filter,
} from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import KpiCard from '@/components/common/KpiCard';
import AreaChart from '@/components/charts/AreaChart';
import BarChart from '@/components/charts/BarChart';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils/cn';
import { formatNumber } from '@/lib/utils/format';
import {
  useTrafficOverview, useTrafficTimeseries, useTrafficBreakdown,
  useRealtime, useAnalyticsProviders, useTriggerProviderSync,
  useSeoVitals, useProviderTotals, useProviderBreakdown,
  useModuleTotals, useInfra, useAnomalies, useProviderState,
  type AnalyticsPeriod,
} from '@/lib/queries/analytics-unified.queries';
import type { BreakdownRow } from '@/lib/api/analytics-unified';

const PERIODS: AnalyticsPeriod[] = ['7d', '30d', '90d'];
const METRICS = [
  { key: 'pageviews', label: 'Pageviews' },
  { key: 'visitors', label: 'Visitors' },
  { key: 'sessions', label: 'Sessions' },
] as const;

function ToggleGroup<T extends string>({ value, options, onChange }: {
  value: T; options: ReadonlyArray<{ key: T; label: string }>; onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex h-9 items-center rounded-lg bg-muted p-1">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => onChange(o.key)}
          className={cn(
            'rounded-md px-3 py-1 text-sm font-medium transition-all',
            value === o.key ? 'bg-background text-foreground shadow' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function TopTable({ title, rows, isLoading, unit = 'views' }: {
  title: string; rows?: BreakdownRow[]; isLoading: boolean; unit?: string;
}) {
  const max = rows && rows.length ? Math.max(...rows.map((r) => r.value)) : 1;
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}</div>
        ) : !rows || rows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No data yet for this range.</p>
        ) : (
          <div className="space-y-1.5">
            {rows.slice(0, 8).map((r) => (
              <div key={r.label} className="relative flex items-center justify-between rounded px-2 py-1.5 text-sm">
                <div className="absolute inset-y-0 left-0 rounded bg-primary/10" style={{ width: `${(r.value / max) * 100}%` }} />
                <span className="relative z-10 truncate pr-2 font-medium">{r.label || '(none)'}</span>
                <span className="relative z-10 text-muted-foreground">{formatNumber(r.value)} <span className="text-xs">{unit}</span></span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function WebsiteAnalyticsPage({ params }: { params: Promise<{ websiteId: string }> }) {
  const { websiteId } = use(params);
  const [period, setPeriod] = useState<AnalyticsPeriod>('30d');
  const [metric, setMetric] = useState<(typeof METRICS)[number]['key']>('pageviews');

  const overview = useTrafficOverview(websiteId, period);
  const series = useTrafficTimeseries(websiteId, period, metric);
  const realtime = useRealtime(websiteId);

  const countries = useTrafficBreakdown(websiteId, period, 'country');
  const devices = useTrafficBreakdown(websiteId, period, 'deviceType');
  const browsers = useTrafficBreakdown(websiteId, period, 'browser');
  const pages = useTrafficBreakdown(websiteId, period, 'page');
  const channels = useTrafficBreakdown(websiteId, period, 'channel');
  const referrers = useTrafficBreakdown(websiteId, period, 'referrerHost');

  // Content module (article views by content / author / category / type).
  const contentSeries = useTrafficTimeseries(websiteId, period, 'views', 'content');
  const topContent = useTrafficBreakdown(websiteId, period, 'content', 'views', 'content');
  const topAuthors = useTrafficBreakdown(websiteId, period, 'author', 'views', 'content');
  const topCategories = useTrafficBreakdown(websiteId, period, 'category', 'views', 'content');
  const contentTypes = useTrafficBreakdown(websiteId, period, 'contentType', 'views', 'content');
  const contentChart = (contentSeries.data?.series ?? []).map((p) => ({ date: p.day, value: p.value }));

  // SEO module: Core Web Vitals (first-party) + Google Search Console (provider).
  const vitals = useSeoVitals(websiteId, period);
  const gscTotals = useProviderTotals(websiteId, 'gsc');
  const gscQueries = useProviderBreakdown(websiteId, 'gsc', 'clicks', 'query');
  const gscPages = useProviderBreakdown(websiteId, 'gsc', 'clicks', 'page');
  const gsc = gscTotals.data?.totals ?? {};

  // CMS module: operational snapshot (internal_cms provider).
  const cmsTotals = useProviderTotals(websiteId, 'internal_cms');
  const cmsByStatus = useProviderBreakdown(websiteId, 'internal_cms', 'content_by_status', 'status');
  const cmsByType = useProviderBreakdown(websiteId, 'internal_cms', 'content_by_type', 'contentType');
  const cmsm = cmsTotals.data?.totals ?? {};

  // Ecommerce / Marketing / Users / Security / Infra modules.
  const ecom = useModuleTotals(websiteId, period, 'ecommerce');
  const ecomByCountry = useTrafficBreakdown(websiteId, period, 'country', 'revenue', 'ecommerce');
  const ecomByCurrency = useTrafficBreakdown(websiteId, period, 'currency', 'revenue', 'ecommerce');
  const e = ecom.data?.totals ?? {};
  const aov = e.orders ? Math.round((e.revenue / e.orders) * 100) / 100 : 0;
  const campaigns = useTrafficBreakdown(websiteId, period, 'campaign');
  const usersTotals = useModuleTotals(websiteId, period, 'users');
  const u = usersTotals.data?.totals ?? {};
  const secTotals = useModuleTotals(websiteId, period, 'security');
  const sec = secTotals.data?.totals ?? {};
  const botTotal = (sec.botEvents ?? 0) + (sec.humanEvents ?? 0);
  const botPct = botTotal ? Math.round(((sec.botEvents ?? 0) / botTotal) * 1000) / 10 : 0;
  const infra = useInfra(websiteId);

  // v2: Ads (AdSense), Attribution, anomalies, provider sync state.
  const adsense = useProviderTotals(websiteId, 'adsense');
  const ad = adsense.data?.totals ?? {};
  const attributionByChannel = useTrafficBreakdown(websiteId, period, 'channel', 'revenue', 'attribution_last_click');
  const attributionTotals = useModuleTotals(websiteId, period, 'attribution_last_click');
  const attr = attributionTotals.data?.totals ?? {};
  const anomalies = useAnomalies(websiteId);
  const provState = useProviderState(websiteId);
  const cartAbandonment = e.addToCart ? Math.round((1 - (e.orders ?? 0) / e.addToCart) * 1000) / 10 : 0;

  const providers = useAnalyticsProviders(websiteId);
  const sync = useTriggerProviderSync(websiteId);

  const m = overview.data?.metrics;
  const chartData = (series.data?.series ?? []).map((p) => ({ date: p.day, value: p.value }));
  const barData = (rows?: BreakdownRow[]) => (rows ?? []).slice(0, 8).map((r) => ({ label: r.label, value: r.value }));

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Unified traffic analytics for this website."
        actions={
          <div className="flex items-center gap-3">
            {realtime.data != null && (
              <Badge variant="secondary" className="gap-1.5">
                <Radio className="h-3 w-3 text-green-500 animate-pulse" />
                {formatNumber(realtime.data.activeVisitors)} online
              </Badge>
            )}
            <ToggleGroup value={period} options={PERIODS.map((p) => ({ key: p, label: p }))} onChange={setPeriod} />
          </div>
        }
      />

      {/* Anomaly banner (reconciliation findings) */}
      {(anomalies.data?.anomalies?.length ?? 0) > 0 && (
        <Card className="mb-4 border-amber-500/40 bg-amber-500/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-500" />
              <div className="text-sm">
                <span className="font-medium">{anomalies.data!.anomalies.length} anomal{anomalies.data!.anomalies.length === 1 ? 'y' : 'ies'} detected.</span>{' '}
                {anomalies.data!.anomalies.slice(0, 3).map((a) => `${a.kind.replace(/_/g, ' ')} (${a.deviationPct > 0 ? '+' : ''}${a.deviationPct}%)`).join(' · ')}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-6">
        <KpiCard title="Visitors" value={m?.visitors ?? 0} icon={Users} isLoading={overview.isLoading} />
        <KpiCard title="Pageviews" value={m?.pageviews ?? 0} icon={Eye} isLoading={overview.isLoading} />
        <KpiCard title="Sessions" value={m?.sessions ?? 0} icon={MousePointerClick} isLoading={overview.isLoading} />
        <KpiCard title="Avg. session" value={m ? `${m.avgSessionS}s` : '0s'} format="raw" icon={Clock} isLoading={overview.isLoading} />
        <KpiCard title="Bounce rate" value={m?.bounceRate ?? 0} format="percent" icon={TrendingDown} isLoading={overview.isLoading} />
        <KpiCard title="Engagement" value={m?.engagementRate ?? 0} format="percent" icon={Activity} isLoading={overview.isLoading} />
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="audience">Audience</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="cms">CMS</TabsTrigger>
          <TabsTrigger value="ecommerce">Ecommerce</TabsTrigger>
          <TabsTrigger value="ads">Ads</TabsTrigger>
          <TabsTrigger value="marketing">Marketing</TabsTrigger>
          <TabsTrigger value="attribution">Attribution</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="infra">Infra</TabsTrigger>
          <TabsTrigger value="ai">AI</TabsTrigger>
          <TabsTrigger value="sources">Sources</TabsTrigger>
          <TabsTrigger value="providers">Providers</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium">Trend</CardTitle>
              <ToggleGroup value={metric} options={METRICS} onChange={setMetric} />
            </CardHeader>
            <CardContent>
              {series.isLoading ? (
                <Skeleton className="h-[240px] w-full" />
              ) : chartData.length === 0 ? (
                <p className="text-sm text-muted-foreground py-16 text-center">No events collected in this range yet.</p>
              ) : (
                <AreaChart data={chartData} height={240} formatValue={(v) => formatNumber(v)} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Radio className="h-4 w-4 text-green-500" /> Realtime — last {realtime.data?.windowMin ?? 5} min
              </CardTitle>
              <CardDescription>
                {formatNumber(realtime.data?.activeVisitors ?? 0)} active visitors · {formatNumber(realtime.data?.activeSessions ?? 0)} sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(realtime.data?.topPages ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No live activity right now.</p>
              ) : (
                <div className="space-y-1.5">
                  {realtime.data!.topPages.map((p) => (
                    <div key={p.page} className="flex items-center justify-between text-sm">
                      <span className="truncate pr-2 font-mono text-xs">{p.page}</span>
                      <span className="text-muted-foreground">{formatNumber(p.views)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audience */}
        <TabsContent value="audience" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm font-medium"><Globe2 className="h-4 w-4" /> Top countries</CardTitle></CardHeader>
              <CardContent>{countries.isLoading ? <Skeleton className="h-[200px] w-full" /> : <BarChart data={barData(countries.data?.rows)} formatValue={(v) => formatNumber(v)} />}</CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm font-medium"><Monitor className="h-4 w-4" /> Devices</CardTitle></CardHeader>
              <CardContent>{devices.isLoading ? <Skeleton className="h-[200px] w-full" /> : <BarChart data={barData(devices.data?.rows)} formatValue={(v) => formatNumber(v)} />}</CardContent>
            </Card>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <TopTable title="Top pages" rows={pages.data?.rows} isLoading={pages.isLoading} />
            <TopTable title="Browsers" rows={browsers.data?.rows} isLoading={browsers.isLoading} unit="sessions" />
          </div>
        </TabsContent>

        {/* Content */}
        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Content views</CardTitle>
              <CardDescription>Article/page views tracked server-side from CMS delivery.</CardDescription>
            </CardHeader>
            <CardContent>
              {contentSeries.isLoading ? (
                <Skeleton className="h-[220px] w-full" />
              ) : contentChart.length === 0 ? (
                <p className="text-sm text-muted-foreground py-14 text-center">No content views recorded in this range yet.</p>
              ) : (
                <AreaChart data={contentChart} height={220} color="hsl(142 71% 45%)" formatValue={(v) => formatNumber(v)} />
              )}
            </CardContent>
          </Card>
          <div className="grid gap-4 lg:grid-cols-2">
            <TopTable title="Top content" rows={topContent.data?.rows} isLoading={topContent.isLoading} unit="views" />
            <TopTable title="Top authors" rows={topAuthors.data?.rows} isLoading={topAuthors.isLoading} unit="views" />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Categories</CardTitle></CardHeader>
              <CardContent>{topCategories.isLoading ? <Skeleton className="h-[200px] w-full" /> : <BarChart data={barData(topCategories.data?.rows)} color="hsl(142 71% 45%)" formatValue={(v) => formatNumber(v)} />}</CardContent>
            </Card>
            <TopTable title="Content types" rows={contentTypes.data?.rows} isLoading={contentTypes.isLoading} unit="views" />
          </div>
        </TabsContent>

        {/* SEO */}
        <TabsContent value="seo" className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium text-muted-foreground">Core Web Vitals (field, first-party)</p>
            <div className="grid gap-4 sm:grid-cols-3">
              <KpiCard title="LCP" value={vitals.data ? `${vitals.data.vitals.lcp} ms` : '—'} format="raw" icon={Gauge} isLoading={vitals.isLoading} description="largest contentful paint" />
              <KpiCard title="CLS" value={vitals.data ? vitals.data.vitals.cls : 0} format="raw" icon={Activity} isLoading={vitals.isLoading} description="cumulative layout shift" />
              <KpiCard title="INP" value={vitals.data ? `${vitals.data.vitals.inp} ms` : '—'} format="raw" icon={Zap} isLoading={vitals.isLoading} description="interaction to next paint" />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Google Search Console</p>
              {gscTotals.data && Object.keys(gsc).length === 0 && (
                <span className="text-xs text-muted-foreground">Connect GSC in Website → Integrations to populate.</span>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard title="Clicks" value={gsc.clicks ?? 0} icon={MousePointer} isLoading={gscTotals.isLoading} />
              <KpiCard title="Impressions" value={gsc.impressions ?? 0} icon={Eye} isLoading={gscTotals.isLoading} />
              <KpiCard title="CTR" value={gsc.ctr ?? 0} format="percent" icon={MousePointerClick} isLoading={gscTotals.isLoading} />
              <KpiCard title="Avg. position" value={gsc.position ?? 0} format="raw" icon={Search} isLoading={gscTotals.isLoading} />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <TopTable title="Top search queries" rows={gscQueries.data?.rows} isLoading={gscQueries.isLoading} unit="clicks" />
            <TopTable title="Top search pages" rows={gscPages.data?.rows} isLoading={gscPages.isLoading} unit="clicks" />
          </div>
        </TabsContent>

        {/* CMS operational */}
        <TabsContent value="cms" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <KpiCard title="Total content" value={cmsm.content_total ?? 0} icon={FileStack} isLoading={cmsTotals.isLoading} />
            <KpiCard title="Published" value={cmsm.content_published ?? 0} icon={FileText} isLoading={cmsTotals.isLoading} />
            <KpiCard title="Drafts" value={cmsm.content_draft ?? 0} icon={PenLine} isLoading={cmsTotals.isLoading} />
            <KpiCard title="Scheduled" value={cmsm.content_scheduled ?? 0} icon={CalendarClock} isLoading={cmsTotals.isLoading} />
            <KpiCard title="Avg. publish" value={cmsm.avg_publish_hours != null ? `${cmsm.avg_publish_hours}h` : '—'} format="raw" icon={Clock} isLoading={cmsTotals.isLoading} description="create → publish" />
            <KpiCard title="Authors" value={cmsm.authors ?? 0} icon={UserSquare2} isLoading={cmsTotals.isLoading} />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Content by status</CardTitle></CardHeader>
              <CardContent>{cmsByStatus.isLoading ? <Skeleton className="h-[200px] w-full" /> : <BarChart data={barData(cmsByStatus.data?.rows)} color="hsl(262 83% 58%)" formatValue={(v) => formatNumber(v)} />}</CardContent>
            </Card>
            <TopTable title="Content by type" rows={cmsByType.data?.rows} isLoading={cmsByType.isLoading} unit="items" />
          </div>
          <p className="text-xs text-muted-foreground">Snapshot refreshes daily; run an immediate refresh from the Providers tab (internal_cms → Sync).</p>
        </TabsContent>

        {/* Ecommerce */}
        <TabsContent value="ecommerce" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <KpiCard title="Revenue" value={e.revenue ?? 0} icon={DollarSign} isLoading={ecom.isLoading} />
            <KpiCard title="Orders" value={e.orders ?? 0} icon={ShoppingCart} isLoading={ecom.isLoading} />
            <KpiCard title="Avg. order value" value={aov} format="raw" icon={DollarSign} isLoading={ecom.isLoading} />
            <KpiCard title="Add to cart" value={e.addToCart ?? 0} icon={Package} isLoading={ecom.isLoading} />
            <KpiCard title="Checkouts" value={e.checkouts ?? 0} icon={ListChecks} isLoading={ecom.isLoading} />
            <KpiCard title="Cart abandonment" value={cartAbandonment} format="percent" icon={Filter} isLoading={ecom.isLoading} />
          </div>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm font-medium"><Filter className="h-4 w-4" /> Conversion funnel</CardTitle></CardHeader>
            <CardContent>
              <BarChart
                data={[
                  { label: 'Add to cart', value: e.addToCart ?? 0 },
                  { label: 'Checkout', value: e.checkouts ?? 0 },
                  { label: 'Purchase', value: e.orders ?? 0 },
                ]}
                color="hsl(24 90% 55%)"
                formatValue={(v) => formatNumber(v)}
              />
            </CardContent>
          </Card>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Revenue by country</CardTitle></CardHeader>
              <CardContent>{ecomByCountry.isLoading ? <Skeleton className="h-[200px] w-full" /> : <BarChart data={barData(ecomByCountry.data?.rows)} color="hsl(24 90% 55%)" formatValue={(v) => formatNumber(v)} />}</CardContent>
            </Card>
            <TopTable title="Revenue by currency" rows={ecomByCurrency.data?.rows} isLoading={ecomByCurrency.isLoading} unit="rev" />
          </div>
          <p className="text-xs text-muted-foreground">Ecommerce events flow from the storefront via <code>window.baalvion.track(&apos;purchase&apos;, {'{'} value, currency {'}'})</code>. Order-system revenue reconciliation connects via Merchant Center / commerce providers.</p>
        </TabsContent>

        {/* Marketing */}
        <TabsContent value="marketing" className="space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm font-medium"><Megaphone className="h-4 w-4" /> Channels</CardTitle><CardDescription>Acquisition channel mix (first-party attribution).</CardDescription></CardHeader>
            <CardContent>{channels.isLoading ? <Skeleton className="h-[200px] w-full" /> : <BarChart data={barData(channels.data?.rows)} color="hsl(330 80% 55%)" formatValue={(v) => formatNumber(v)} />}</CardContent>
          </Card>
          <TopTable title="Top campaigns (UTM)" rows={campaigns.data?.rows} isLoading={campaigns.isLoading} unit="views" />
          <p className="text-xs text-muted-foreground">Ad spend, ROAS and CPA populate once you connect Google Ads / Meta / TikTok providers (Providers tab).</p>
        </TabsContent>

        {/* Ads (AdSense) */}
        <TabsContent value="ads" className="space-y-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Google AdSense</p>
            {adsense.data && Object.keys(ad).length === 0 && (
              <span className="text-xs text-muted-foreground">Connect AdSense in Website → Integrations to populate.</span>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <KpiCard title="Est. earnings" value={ad.earnings ?? 0} format="raw" icon={BadgeDollarSign} isLoading={adsense.isLoading} />
            <KpiCard title="RPM" value={ad.rpm ?? 0} format="raw" icon={DollarSign} isLoading={adsense.isLoading} description="revenue / 1k views" />
            <KpiCard title="CPC" value={ad.cpc ?? 0} format="raw" icon={MousePointer} isLoading={adsense.isLoading} />
            <KpiCard title="Ad clicks" value={ad.clicks ?? 0} icon={MousePointerClick} isLoading={adsense.isLoading} />
            <KpiCard title="Ad impressions" value={ad.impressions ?? 0} icon={Eye} isLoading={adsense.isLoading} />
          </div>
          <p className="text-xs text-muted-foreground">AdSense reporting reads the same publisher account managed under Website → SEO → Monetization.</p>
        </TabsContent>

        {/* Attribution */}
        <TabsContent value="attribution" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <KpiCard title="Attributed revenue" value={attr.revenue ?? 0} format="raw" icon={Target} isLoading={attributionTotals.isLoading} description="last-click model" />
            <KpiCard title="Conversions" value={attr.conversions ?? 0} icon={GitCompareArrows} isLoading={attributionTotals.isLoading} />
          </div>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium"><GitCompareArrows className="h-4 w-4" /> Revenue by channel (last-click)</CardTitle>
              <CardDescription>Conversions credited to the visitor&apos;s final acquisition channel. Linear-model splits are also computed.</CardDescription>
            </CardHeader>
            <CardContent>
              {attributionByChannel.isLoading ? (
                <Skeleton className="h-[200px] w-full" />
              ) : (attributionByChannel.data?.rows?.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground py-10 text-center">No conversions attributed in this range yet.</p>
              ) : (
                <BarChart data={barData(attributionByChannel.data?.rows)} color="hsl(200 80% 50%)" formatValue={(v) => formatNumber(v)} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users */}
        <TabsContent value="users" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <KpiCard title="Known users" value={u.knownUsers ?? 0} icon={UserCheck} isLoading={usersTotals.isLoading} />
            <KpiCard title="Signed-in events" value={u.loggedInEvents ?? 0} icon={Users} isLoading={usersTotals.isLoading} />
            <KpiCard title="Anonymous events" value={u.anonEvents ?? 0} icon={UserSquare2} isLoading={usersTotals.isLoading} />
          </div>
          <p className="text-xs text-muted-foreground">Login history, device and location trails, and security events integrate from the audit service.</p>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard title="Bot events" value={sec.botEvents ?? 0} icon={Bot} isLoading={secTotals.isLoading} />
            <KpiCard title="Human events" value={sec.humanEvents ?? 0} icon={Users} isLoading={secTotals.isLoading} />
            <KpiCard title="Bot share" value={botPct} format="percent" icon={ShieldAlert} isLoading={secTotals.isLoading} />
            <KpiCard title="Fraud-flagged" value={sec.flaggedEvents ?? 0} icon={AlertTriangle} isLoading={secTotals.isLoading} description="excluded from metrics" />
          </div>
          {(anomalies.data?.anomalies?.length ?? 0) > 0 && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Open anomalies</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {anomalies.data!.anomalies.map((a, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="capitalize">{a.kind.replace(/_/g, ' ')}{a.metric ? ` · ${a.metric}` : ''}</span>
                      <Badge variant={a.severity === 'critical' ? 'destructive' : 'secondary'} className="text-xs">
                        {a.deviationPct > 0 ? '+' : ''}{a.deviationPct}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          <p className="text-xs text-muted-foreground">Fraud/bot scoring runs on every event; flagged traffic is excluded from all metric rollups. Failed/suspicious logins &amp; API abuse integrate from the audit &amp; gateway layers.</p>
        </TabsContent>

        {/* Infra */}
        <TabsContent value="infra" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <KpiCard title="Events (24h)" value={infra.data?.events24h ?? 0} icon={Activity} isLoading={infra.isLoading} />
            <KpiCard title="Event partitions" value={infra.data?.partitions ?? 0} icon={Server} isLoading={infra.isLoading} />
            <KpiCard title="Queues" value={infra.data ? Object.keys(infra.data.queues).length : 0} icon={Cpu} isLoading={infra.isLoading} />
          </div>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Analytics queue depths</CardTitle></CardHeader>
            <CardContent>
              {infra.isLoading ? (
                <Skeleton className="h-24 w-full" />
              ) : (
                <div className="space-y-1.5">
                  {Object.entries(infra.data?.queues ?? {}).map(([name, counts]) => (
                    <div key={name} className="flex items-center justify-between text-sm">
                      <span className="font-mono text-xs">{name}</span>
                      <span className="text-muted-foreground text-xs">
                        {'error' in (counts as object)
                          ? 'unavailable'
                          : `waiting ${(counts as Record<string, number>).waiting ?? 0} · active ${(counts as Record<string, number>).active ?? 0} · failed ${(counts as Record<string, number>).failed ?? 0}`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI */}
        <TabsContent value="ai" className="space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm font-medium"><Bot className="h-4 w-4" /> AI Analytics</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Prompt/token usage, acceptance rate, cost estimation and time-saved populate once an AI provider
                is connected for this website (Providers tab). AI-assisted editorial events are captured through the
                same unified pipeline.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sources */}
        <TabsContent value="sources" className="space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Channels</CardTitle><CardDescription>How visitors reach this site.</CardDescription></CardHeader>
            <CardContent>{channels.isLoading ? <Skeleton className="h-[200px] w-full" /> : <BarChart data={barData(channels.data?.rows)} formatValue={(v) => formatNumber(v)} />}</CardContent>
          </Card>
          <TopTable title="Top referrers" rows={referrers.data?.rows} isLoading={referrers.isLoading} unit="visits" />
        </TabsContent>

        {/* Providers */}
        <TabsContent value="providers" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium"><PlugZap className="h-4 w-4" /> Connected providers</CardTitle>
              <CardDescription>Connect providers in Website → Integrations (category “analytics”). Credentials are stored encrypted.</CardDescription>
            </CardHeader>
            <CardContent>
              {providers.isLoading ? (
                <Skeleton className="h-24 w-full" />
              ) : (providers.data?.connected ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No analytics providers connected yet — first-party tracking is active by default.</p>
              ) : (
                <div className="space-y-2">
                  {providers.data!.connected.map((p) => (
                    <div key={p.provider} className="flex items-center justify-between rounded-md border p-3">
                      <div className="flex items-center gap-2">
                        {p.status === 'configured'
                          ? <CheckCircle2 className="h-4 w-4 text-green-500" />
                          : <Circle className="h-4 w-4 text-muted-foreground" />}
                        <span className="text-sm font-medium">{p.provider}</span>
                        <Badge variant="outline" className="text-xs">{p.status}</Badge>
                      </div>
                      <button
                        type="button"
                        onClick={() => sync.mutate(p.provider)}
                        disabled={!p.enabled || sync.isPending}
                        className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium disabled:opacity-50 hover:bg-muted"
                      >
                        <RefreshCw className={cn('h-3 w-3', sync.isPending && 'animate-spin')} /> Sync
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {(provState.data?.providers?.length ?? 0) > 0 && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Sync status</CardTitle><CardDescription>Watermark, last result and daily API calls (cost governance).</CardDescription></CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {provState.data!.providers.map((p) => (
                    <div key={p.provider} className="flex items-center justify-between text-sm">
                      <span className="font-medium">{p.provider}</span>
                      <span className="text-xs text-muted-foreground">
                        {p.lastStatus ?? 'never'} · watermark {p.watermark ?? '—'} · {p.callsToday} calls today
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Available providers</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {(providers.data?.catalog ?? []).map((c) => (
                  <div key={c.provider} className="rounded-md border p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{c.label}</span>
                      <Badge variant={c.implemented ? 'default' : 'secondary'} className="text-[10px]">
                        {c.implemented ? 'ready' : 'soon'}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground capitalize">{c.category}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
