'use client';

import { useEffect, useMemo } from 'react';
import { DollarSign, Users, TrendingUp, AlertCircle } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { usePlatformRevenueRollup } from '@/lib/queries/platform-registry.queries';
import { useUIStore } from '@/lib/store/uiStore';
import { formatCurrency } from '@/lib/utils/format';
import type { PlatformRevenueEntry } from '@/lib/api/platform-registry';

function SummaryCard({ title, value, icon: Icon }: { title: string; value: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between mb-3">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{title}</p>
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <p className="text-2xl font-bold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}

function PlatformRevenueCard({ entry }: { entry: PlatformRevenueEntry }) {
  if (!entry.available) {
    return (
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-medium">{entry.name}</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <AlertCircle className="h-3.5 w-3.5" />
            {entry.reason === 'no_source' && 'No payment integration for this platform'}
            {entry.reason === 'not_configured' && 'Revenue source not configured'}
            {entry.reason === 'no_caller_token' && 'Needs an authenticated session'}
            {entry.reason?.startsWith('http_') && `Upstream error (${entry.reason})`}
            {(entry.reason === 'timeout' || entry.reason === 'error') && 'Unreachable'}
            {!entry.reason && 'No data available'}
          </div>
        </CardContent>
      </Card>
    );
  }

  const d = entry.data ?? {};
  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm font-medium">{entry.name}</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-2">
        <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
          {d.mrr != null && (
            <div>
              <p className="text-muted-foreground">MRR</p>
              <p className="font-mono font-semibold">{formatCurrency(d.mrr)}</p>
            </div>
          )}
          {d.arr != null && (
            <div>
              <p className="text-muted-foreground">ARR</p>
              <p className="font-mono font-semibold">{formatCurrency(d.arr)}</p>
            </div>
          )}
          {d.customers != null && (
            <div>
              <p className="text-muted-foreground">Customers</p>
              <p className="font-mono font-semibold">{d.customers.toLocaleString()}</p>
            </div>
          )}
          {d.activeSubscriptions != null && (
            <div>
              <p className="text-muted-foreground">Active Subs</p>
              <p className="font-mono font-semibold">{d.activeSubscriptions.toLocaleString()}</p>
            </div>
          )}
          {d.newSubscriptions != null && (
            <div>
              <p className="text-muted-foreground">New Subs (mo)</p>
              <p className="font-mono font-semibold">{d.newSubscriptions.toLocaleString()}</p>
            </div>
          )}
          {d.churn != null && (
            <div>
              <p className="text-muted-foreground">Churn (mo)</p>
              <p className="font-mono font-semibold">{d.churn.toLocaleString()}</p>
            </div>
          )}
          {d.lifetimeRevenue != null && (
            <div>
              <p className="text-muted-foreground">Lifetime Revenue</p>
              <p className="font-mono font-semibold">{formatCurrency(d.lifetimeRevenue)}</p>
            </div>
          )}
          {d.arpu != null && (
            <div>
              <p className="text-muted-foreground">ARPU</p>
              <p className="font-mono font-semibold">{formatCurrency(d.arpu)}</p>
            </div>
          )}
        </div>
        {d.sourceBreakdown && d.sourceBreakdown.length > 0 && (
          <div className="pt-2 border-t space-y-1">
            {d.sourceBreakdown.map((s) => (
              <div key={s.source} className="flex justify-between text-[11px]">
                <span className="text-muted-foreground">{s.source}</span>
                <span className="font-mono">{formatCurrency(s.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function RevenuePage() {
  const { setBreadcrumbs } = useUIStore();
  const { data: rollup, isLoading } = usePlatformRevenueRollup();

  useEffect(() => { setBreadcrumbs([{ label: 'Revenue & Payments' }]); }, [setBreadcrumbs]);

  const summary = useMemo(() => {
    const available = (rollup?.platforms ?? []).filter((p) => p.available && p.data);
    const totalMrr = available.reduce((sum, p) => sum + (p.data?.mrr ?? 0), 0);
    const totalArr = available.reduce((sum, p) => sum + (p.data?.arr ?? (p.data?.mrr ? p.data.mrr * 12 : 0)), 0);
    const totalCustomers = available.reduce((sum, p) => sum + (p.data?.customers ?? 0), 0);
    return { totalMrr, totalArr, totalCustomers, sourceCount: available.length };
  }, [rollup]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Revenue & Payments"
        description="Unified revenue across every Baalvion ecosystem platform with a real payment source"
      />

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <SummaryCard title="Total MRR (known sources)" value={formatCurrency(summary.totalMrr)} icon={DollarSign} />
            <SummaryCard title="Total ARR (known sources)" value={formatCurrency(summary.totalArr)} icon={TrendingUp} />
            <SummaryCard title="Total Customers (known sources)" value={summary.totalCustomers.toLocaleString()} icon={Users} />
            <SummaryCard title="Platforms Reporting" value={`${summary.sourceCount} / ${(rollup?.platforms ?? []).length}`} icon={DollarSign} />
          </div>
          <p className="text-xs text-muted-foreground -mt-3">
            Totals only sum platforms with a real, configured payment source. Platforms without one
            (shown below) are excluded rather than counted as zero.
          </p>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {(rollup?.platforms ?? []).map((p) => <PlatformRevenueCard key={p.key} entry={p} />)}
          </div>
        </>
      )}
    </div>
  );
}
