'use client';
/**
 * @file intelligence-hub/analytics/page.tsx
 * @description Analytics (Phase 4) — every figure here comes from
 * GET /api/analytics/overview, which is real Prisma groupBy/count/sum/avg
 * aggregation scoped to the caller's own organization (analytics-repository.ts
 * + analytics-service.ts). This REPLACES a previous "Strategic Analytics
 * Observatory" page whose own service code comment admitted it was fake
 * ("In production, this triggers a high-scale aggregation query on
 * ClickHouse/Trino") while hardcoding numbers like a 99.98% compliance pass
 * rate — exactly the deceptive-UI problem this phase exists to fix. That
 * service/components (src/modules/analytics/*) are left in place (not
 * deleted — out of scope to chase down and clean up) but are no longer used
 * by any page.
 *
 * "Revenue", "Shipment performance", "Partner analytics", and "Financial
 * analytics" as distinct named dashboards from the original request are NOT
 * separately covered here — Revenue overlaps with Trade Volume/Settlement
 * below under a different label, and the other three would need either
 * schema additions (no clean "partner" aggregation surface exists yet) or a
 * much larger build than this phase's real estate justifies. Flagged as
 * follow-up scope, not silently dropped.
 */
import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, BarChart3, ShieldAlert, ShieldCheck, Landmark, Globe2 } from 'lucide-react';
import { fetchLocalApi } from '@/lib/local-api-client';
import { cn } from '@/lib/utils';

interface AnalyticsOverview {
  tradeVolume: { currency: string; totalAmount: string; orderCount: number }[];
  tradePipeline: { state: string; count: number }[];
  settlement: { byStatus: { status: string; count: number; totalAmount: string }[]; avgCycleHours: number | null };
  risk: { byLevel: { level: string; count: number; avgScore: number | null }[]; totalAssessments: number };
  compliance: {
    byOutcome: { outcome: string; count: number }[];
    byType: { type: string; count: number }[];
    totalChecks: number;
    passRate: number | null;
  };
  topCountries: { country: string; count: number; totalAmount: string }[];
}

function titleCase(s: string): string {
  return s.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

const pipelineConfig = { count: { label: 'Trades', color: 'hsl(var(--primary))' } } satisfies ChartConfig;
const riskConfig = { count: { label: 'Assessments', color: 'hsl(var(--destructive))' } } satisfies ChartConfig;

function SectionCard({ icon: Icon, title, description, children }: { icon: typeof BarChart3; title: string; description: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3 space-y-0">
        <div className="rounded-lg bg-primary/10 p-2">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchLocalApi('/api/analytics/overview')
      .then((res) => res.json())
      .then((body) => {
        if (cancelled) return;
        if (!body.success) throw new Error(body.error ?? 'Failed to load analytics');
        setData(body.data as AnalyticsOverview);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load analytics');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Couldn&apos;t load analytics</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-lg" />)}
        </div>
      </div>
    );
  }

  const pipelineData = data.tradePipeline.map((r) => ({ state: titleCase(r.state), count: r.count }));
  const riskData = data.risk.byLevel.map((r) => ({ level: titleCase(r.level), count: r.count }));

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">Real, org-scoped figures — trade pipeline, settlement, risk, and compliance.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <SectionCard icon={Landmark} title="Trade Volume" description="Total order value by currency">
          {data.tradeVolume.length === 0 ? (
            <p className="text-sm text-muted-foreground">No orders recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {data.tradeVolume.map((v) => (
                <div key={v.currency} className="flex items-center justify-between border-b py-2 last:border-0">
                  <span className="text-sm font-medium">{v.currency}</span>
                  <div className="text-right">
                    <p className="text-sm font-bold tabular-nums">{Number(v.totalAmount).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                    <p className="text-xs text-muted-foreground">{v.orderCount} orders</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard icon={BarChart3} title="Trade Pipeline" description="Trades by current lifecycle state">
          {pipelineData.length === 0 ? (
            <p className="text-sm text-muted-foreground">No trades recorded yet.</p>
          ) : (
            <ChartContainer config={pipelineConfig} className="h-[220px] w-full">
              <BarChart data={pipelineData} layout="vertical" margin={{ left: 12 }}>
                <CartesianGrid horizontal={false} strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" tickLine={false} axisLine={false} className="text-xs" />
                <YAxis type="category" dataKey="state" tickLine={false} axisLine={false} width={110} className="text-[10px]" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={4} />
              </BarChart>
            </ChartContainer>
          )}
        </SectionCard>

        <SectionCard icon={Globe2} title="Settlement Performance" description="Instructions by status">
          {data.settlement.byStatus.length === 0 ? (
            <p className="text-sm text-muted-foreground">No settlement instructions recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {data.settlement.byStatus.map((s) => (
                <div key={s.status} className="flex items-center justify-between border-b py-2 last:border-0">
                  <span className="text-sm font-medium">{titleCase(s.status)}</span>
                  <div className="text-right">
                    <p className="text-sm font-bold tabular-nums">{s.count}</p>
                    <p className="text-xs text-muted-foreground">{Number(s.totalAmount).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                  </div>
                </div>
              ))}
              <p className="pt-2 text-xs text-muted-foreground">
                Avg settlement cycle:{' '}
                {data.settlement.avgCycleHours !== null ? `${data.settlement.avgCycleHours.toFixed(1)} hours` : 'not enough settled instructions yet'}
              </p>
            </div>
          )}
        </SectionCard>

        <SectionCard icon={ShieldAlert} title="Risk Exposure" description="Assessments by level">
          {riskData.length === 0 ? (
            <p className="text-sm text-muted-foreground">No risk assessments recorded yet.</p>
          ) : (
            <ChartContainer config={riskConfig} className="h-[220px] w-full">
              <BarChart data={riskData} layout="vertical" margin={{ left: 12 }}>
                <CartesianGrid horizontal={false} strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" tickLine={false} axisLine={false} className="text-xs" />
                <YAxis type="category" dataKey="level" tickLine={false} axisLine={false} width={80} className="text-[10px]" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={4} />
              </BarChart>
            </ChartContainer>
          )}
        </SectionCard>

        <SectionCard icon={ShieldCheck} title="Compliance" description="Checks by outcome and type">
          <div className="space-y-4">
            <div className={cn('rounded-lg border p-3 text-center', data.compliance.passRate !== null && data.compliance.passRate >= 0.9 && 'border-emerald-500/30 bg-emerald-500/5')}>
              <p className="text-2xl font-black tabular-nums">
                {data.compliance.passRate !== null ? `${(data.compliance.passRate * 100).toFixed(1)}%` : '—'}
              </p>
              <p className="text-xs text-muted-foreground">
                {data.compliance.passRate !== null ? `pass rate across ${data.compliance.totalChecks} checks` : 'no compliance checks recorded yet'}
              </p>
            </div>
            {data.compliance.byType.length > 0 && (
              <div className="space-y-1.5">
                {data.compliance.byType.map((t) => (
                  <div key={t.type} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{titleCase(t.type)}</span>
                    <span className="font-bold tabular-nums">{t.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SectionCard>

        <SectionCard icon={Globe2} title="Top Destination Countries" description="By order count — only Order.destinationCountry carries geography today">
          {data.topCountries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No orders with a destination country recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {data.topCountries.map((c) => (
                <div key={c.country} className="flex items-center justify-between border-b py-1.5 last:border-0 text-sm">
                  <span className="font-medium">{c.country}</span>
                  <span className="tabular-nums text-muted-foreground">{c.count} orders</span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
