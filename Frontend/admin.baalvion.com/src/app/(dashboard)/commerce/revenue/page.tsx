'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  DollarSign,
  ShoppingCart,
  Receipt,
  Globe,
  ListChecks,
} from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { formatNumber } from '@/lib/utils/format';
import { useUIStore } from '@/lib/store/uiStore';
import { usePlatformCommerceRevenue } from '@/lib/queries/commerce-revenue.queries';
import type {
  RevenueRange,
  MarketRevenue,
  StatusRevenue,
} from '@/lib/api/commerce-revenue';

const RANGE_OPTIONS = [
  { label: 'Last 7 days', value: '7' },
  { label: 'Last 30 days', value: '30' },
  { label: 'Last 90 days', value: '90' },
];

const DAY_MS = 24 * 60 * 60 * 1000;
const MARKET_ORDER = ['us', 'uk', 'ae', 'in', 'sg'] as const;
const MARKET_LABEL: Record<string, string> = {
  us: 'United States',
  uk: 'United Kingdom',
  ae: 'United Arab Emirates',
  in: 'India',
  sg: 'Singapore',
};

function buildRange(days: number): RevenueRange {
  const to = new Date();
  const from = new Date(to.getTime() - days * DAY_MS);
  return { from: from.toISOString(), to: to.toISOString() };
}

// Earned revenue is normalized to USD whole-dollars — use $ formatting, NOT the
// INR/÷100 formatCurrency helper.
const usd = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);

// Per-market native currency, rendered in its own currencyCode (e.g. GBP, AED, INR).
function nativeMoney(amount: number, currencyCode: string): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode || 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currencyCode} ${formatNumber(Math.round(amount))}`;
  }
}

// KPI tile — money values are already whole USD units (no /100 division).
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
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-muted-foreground">{title}</p>
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

function sortMarkets(rows: MarketRevenue[]): MarketRevenue[] {
  return [...rows].sort(
    (a, b) => MARKET_ORDER.indexOf(a.market) - MARKET_ORDER.indexOf(b.market),
  );
}

function sortStatuses(rows: StatusRevenue[]): StatusRevenue[] {
  return [...rows].sort((a, b) => b.revenue - a.revenue);
}

export default function CommerceRevenuePage() {
  const { setBreadcrumbs } = useUIStore();
  const [rangeDays, setRangeDays] = useState('30');

  useEffect(() => {
    setBreadcrumbs([{ label: 'Commerce', href: '/commerce' }, { label: 'Revenue' }]);
  }, [setBreadcrumbs]);

  const range = useMemo(() => buildRange(Number(rangeDays)), [rangeDays]);
  const revenueQ = usePlatformCommerceRevenue(range);

  const report = revenueQ.data;
  const totals = report?.totals;

  const marketRows = useMemo(
    () => sortMarkets(report?.byMarket ?? []),
    [report?.byMarket],
  );
  const maxMarketShare = useMemo(
    () => marketRows.reduce((m, r) => Math.max(m, r.sharePct), 0),
    [marketRows],
  );
  const statusRows = useMemo(
    () => sortStatuses(report?.byStatus ?? []),
    [report?.byStatus],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Commerce Revenue"
        description="Platform-wide earned order revenue across all stores and markets, normalized to USD."
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

      {revenueQ.isError && (
        <Card className="border-destructive/40">
          <CardContent className="py-4 text-sm text-destructive">
            Failed to load revenue. Try again or pick a different range.
          </CardContent>
        </Card>
      )}

      {/* ── KPI Row: earned USD + tax + order count ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiTile
          title="Total Earned (USD)"
          value={totals ? usd(totals.revenueBaseUsd) : '—'}
          icon={DollarSign}
          iconColor="text-green-500"
          isLoading={revenueQ.isLoading}
        />
        <KpiTile
          title="Tax Collected (USD)"
          value={totals ? usd(totals.taxBaseUsd) : '—'}
          icon={Receipt}
          iconColor="text-cyan-500"
          isLoading={revenueQ.isLoading}
        />
        <KpiTile
          title="Paid Orders"
          value={totals ? formatNumber(totals.orders) : '—'}
          icon={ShoppingCart}
          iconColor="text-blue-500"
          isLoading={revenueQ.isLoading}
        />
      </div>

      {/* ── Revenue by Market + Revenue by Status ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Globe className="h-4 w-4 text-sky-500" />
              Revenue by Market
            </CardTitle>
          </CardHeader>
          <CardContent>
            {revenueQ.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : marketRows.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No market revenue in this period.
              </p>
            ) : (
              <div className="space-y-4">
                {marketRows.map((row) => (
                  <div key={row.market} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium">
                        {MARKET_LABEL[row.market] ?? row.market.toUpperCase()}
                        <span className="ml-1.5 text-muted-foreground">
                          {row.market.toUpperCase()}
                        </span>
                      </span>
                      <span className="font-mono tabular-nums">
                        {nativeMoney(row.revenue, row.currencyCode)}
                        <span className="ml-2 text-muted-foreground">
                          {row.sharePct.toFixed(1)}%
                        </span>
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-sky-500"
                        style={{
                          width: `${
                            maxMarketShare > 0
                              ? Math.max(2, (row.sharePct / maxMarketShare) * 100)
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {formatNumber(row.orders)} orders ·{' '}
                      <span className="font-medium">
                        {row.currencyCode} native
                      </span>{' '}
                      · {row.sharePct.toFixed(1)}% of USD total
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <ListChecks className="h-4 w-4 text-violet-500" />
              Revenue by Status
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {revenueQ.isLoading ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : statusRows.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No orders in this period.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                    <TableHead className="text-right">Revenue (USD)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statusRows.map((row) => (
                    <TableRow key={row.status}>
                      <TableCell className="text-xs font-medium capitalize">
                        {row.status.replace(/_/g, ' ')}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {formatNumber(row.count)}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {usd(row.revenue)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
