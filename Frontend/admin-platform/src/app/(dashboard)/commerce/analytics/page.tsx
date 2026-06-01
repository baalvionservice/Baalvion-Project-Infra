'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  DollarSign,
  ShoppingCart,
  Users,
  Receipt,
  Globe,
  Package,
  TrendingUp,
  Scale,
  AlertTriangle,
} from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency, formatNumber } from '@/lib/utils/format';
import { useCommerceStore } from '@/lib/store/commerceStore';
import { useUIStore } from '@/lib/store/uiStore';
import {
  useAnalyticsSummary,
  useTopProducts,
  useRevenueByCountry,
  useRevenueSeries,
  useReconciliation,
  useLowStockAlerts,
} from '@/lib/queries/commerce-analytics.queries';
import type { AnalyticsRange, RevenueGranularity } from '@/lib/api/commerce-analytics';
import { RevenueTrendChart, TopProductsChart } from './AnalyticsCharts';

const RANGE_OPTIONS = [
  { label: 'Last 7 days', value: '7', granularity: 'day' as RevenueGranularity },
  { label: 'Last 30 days', value: '30', granularity: 'day' as RevenueGranularity },
  { label: 'Last 90 days', value: '90', granularity: 'week' as RevenueGranularity },
];

const DAY_MS = 24 * 60 * 60 * 1000;

function buildRange(days: number): AnalyticsRange {
  const to = new Date();
  const from = new Date(to.getTime() - days * DAY_MS);
  return { from: from.toISOString(), to: to.toISOString() };
}

// KPI card — analytics money is already in CURRENCY UNITS (do NOT use formatCurrency which /100).
function KpiTile({
  title,
  value,
  icon: Icon,
  iconColor,
  isLoading,
}: {
  title: string;
  value: string;
  icon: typeof DollarSign;
  iconColor: string;
  isLoading: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground truncate">{title}</p>
            {isLoading ? (
              <Skeleton className="mt-2 h-8 w-24" />
            ) : (
              <p className="mt-1 truncate text-2xl font-bold tabular-nums">{value}</p>
            )}
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CommerceAnalyticsPage() {
  const { setBreadcrumbs } = useUIStore();
  const activeStoreId = useCommerceStore((s) => s.activeStoreId);
  const activeStore = useCommerceStore((s) => s.activeStore);
  const storeId = activeStoreId ?? '';

  const [rangeDays, setRangeDays] = useState('30');

  useEffect(() => {
    setBreadcrumbs([{ label: 'Commerce', href: '/commerce' }, { label: 'Analytics' }]);
  }, [setBreadcrumbs]);

  const selected = RANGE_OPTIONS.find((r) => r.value === rangeDays) ?? RANGE_OPTIONS[1];
  const range = useMemo(() => buildRange(Number(rangeDays)), [rangeDays]);
  const granularity = selected.granularity;

  const summaryQ = useAnalyticsSummary(storeId, range);
  const revenueQ = useRevenueSeries(storeId, range, granularity);
  const topProductsQ = useTopProducts(storeId, range, 8);
  const countryQ = useRevenueByCountry(storeId, range);
  const reconQ = useReconciliation(storeId, range);
  const lowStockQ = useLowStockAlerts(storeId, 8);

  const summary = summaryQ.data;
  const currency = summary?.currency ?? 'USD';

  // Analytics amounts are in currency units already — format WITHOUT the /100 in formatCurrency.
  const money = useMemo(() => {
    const nf = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    });
    return (n: number) => nf.format(n);
  }, [currency]);

  const countryRows = useMemo(() => {
    const map = countryQ.data ?? {};
    return Object.entries(map)
      .map(([country, revenue]) => ({ country, revenue }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [countryQ.data]);

  const maxCountryRevenue = countryRows[0]?.revenue ?? 0;

  if (!storeId) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <BarChart3 className="h-12 w-12 text-muted-foreground/40" />
        <p className="text-muted-foreground">
          Select a store from the Commerce overview to view analytics.
        </p>
        <Button asChild variant="outline">
          <Link href="/commerce">Go to Overview</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Store Performance"
        description={
          activeStore?.name
            ? `Analytics & financial health for ${activeStore.name}`
            : 'Analytics & financial health for the active store'
        }
        actions={
          <Select value={rangeDays} onValueChange={setRangeDays}>
            <SelectTrigger className="h-9 w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RANGE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {summaryQ.isError && (
        <Card className="border-destructive/40">
          <CardContent className="py-4 text-sm text-destructive">
            Failed to load analytics summary. Try again or pick a different range.
          </CardContent>
        </Card>
      )}

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiTile
          title="Revenue"
          value={summary ? money(summary.revenue) : '—'}
          icon={DollarSign}
          iconColor="text-green-500"
          isLoading={summaryQ.isLoading}
        />
        <KpiTile
          title="Orders"
          value={summary ? formatNumber(summary.orders) : '—'}
          icon={ShoppingCart}
          iconColor="text-blue-500"
          isLoading={summaryQ.isLoading}
        />
        <KpiTile
          title="Customers"
          value={summary ? formatNumber(summary.customers) : '—'}
          icon={Users}
          iconColor="text-purple-500"
          isLoading={summaryQ.isLoading}
        />
        <KpiTile
          title="Avg Order Value"
          value={summary ? money(summary.avgOrderValue) : '—'}
          icon={Receipt}
          iconColor="text-cyan-500"
          isLoading={summaryQ.isLoading}
        />
      </div>

      {/* ── Revenue trend + Top products ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-indigo-500" />
              Revenue Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            {revenueQ.isLoading ? (
              <Skeleton className="h-56 w-full" />
            ) : (
              <RevenueTrendChart data={revenueQ.data ?? []} currencyFormat={money} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Package className="h-4 w-4 text-amber-500" />
              Top Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topProductsQ.isLoading ? (
              <Skeleton className="h-56 w-full" />
            ) : (
              <TopProductsChart data={topProductsQ.data ?? []} currencyFormat={money} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Country performance + Reconciliation ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Globe className="h-4 w-4 text-sky-500" />
              Revenue by Country
            </CardTitle>
          </CardHeader>
          <CardContent>
            {countryQ.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </div>
            ) : countryRows.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No country data in this period
              </p>
            ) : (
              <div className="space-y-3">
                {countryRows.map((row) => (
                  <div key={row.country} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium uppercase">{row.country || 'Unknown'}</span>
                      <span className="font-mono tabular-nums">{money(row.revenue)}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-sky-500"
                        style={{
                          width: `${
                            maxCountryRevenue > 0
                              ? Math.max(2, (row.revenue / maxCountryRevenue) * 100)
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between gap-2 text-sm">
              <span className="flex items-center gap-2">
                <Scale className="h-4 w-4 text-emerald-500" />
                Financial Reconciliation
              </span>
              {reconQ.data && reconQ.data.ledgerAvailable && (
                <Badge
                  variant="outline"
                  className={
                    reconQ.data.balanced
                      ? 'border-green-500/50 text-green-600'
                      : 'border-red-500/50 text-red-600'
                  }
                >
                  {reconQ.data.balanced ? 'Balanced' : 'Unbalanced'}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reconQ.isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : !reconQ.data?.ledgerAvailable ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Ledger not configured for this store.
              </p>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Captured</p>
                    <p className="text-sm font-semibold tabular-nums">
                      {formatCurrency(reconQ.data.totals.capturedMinor, currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Refunded</p>
                    <p className="text-sm font-semibold tabular-nums">
                      {formatCurrency(reconQ.data.totals.refundedMinor, currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Net</p>
                    <p className="text-sm font-semibold tabular-nums">
                      {formatCurrency(reconQ.data.totals.netMinor, currency)}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 border-t pt-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Expected</span>
                    <span className="font-mono">{reconQ.data.counts.expected}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Matched</span>
                    <span className="font-mono text-green-600">{reconQ.data.counts.matched}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Missing</span>
                    <span
                      className={`font-mono ${
                        reconQ.data.counts.missing > 0 ? 'text-red-600' : ''
                      }`}
                    >
                      {reconQ.data.counts.missing}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Mismatched</span>
                    <span
                      className={`font-mono ${
                        reconQ.data.counts.mismatched > 0 ? 'text-red-600' : ''
                      }`}
                    >
                      {reconQ.data.counts.mismatched}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Inventory alerts ── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            Inventory Alerts
          </CardTitle>
          <div className="flex items-center gap-2">
            {lowStockQ.data?.summary && (
              <>
                <Badge variant="outline" className="border-amber-500/50 text-amber-600">
                  {lowStockQ.data.summary.lowStock} low
                </Badge>
                <Badge variant="outline" className="border-red-500/50 text-red-600">
                  {lowStockQ.data.summary.outOfStock} out
                </Badge>
              </>
            )}
            <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
              <Link href="/commerce/inventory">View all</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {lowStockQ.isLoading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10" />
              ))}
            </div>
          ) : (lowStockQ.data?.data.length ?? 0) === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No low-stock items — inventory is healthy.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead className="text-right">On hand</TableHead>
                  <TableHead className="text-right">Reserved</TableHead>
                  <TableHead className="text-right">Threshold</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(lowStockQ.data?.data ?? []).map((item) => {
                  const isOut = item.quantity - item.reservedQuantity <= 0;
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                      <TableCell className="text-xs">{item.warehouse?.name ?? '—'}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                        {item.reservedQuantity}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                        {item.lowStockThreshold}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant="outline"
                          className={
                            isOut
                              ? 'border-red-500/50 text-red-600'
                              : 'border-amber-500/50 text-amber-600'
                          }
                        >
                          {isOut ? 'out of stock' : 'low stock'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
