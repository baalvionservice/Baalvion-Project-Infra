'use client';

import { useState, useEffect, useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Globe, AlertTriangle } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import StatusBadge from '@/components/common/StatusBadge';
import DataTable from '@/components/data-table/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePaymentRecords, usePaymentRecordsSummary } from '@/lib/queries/payment-records.queries';
import { useUIStore } from '@/lib/store/uiStore';
import { formatDate } from '@/lib/utils/format';
import type { PaymentRecordRow, SiteSummary, PaymentState, MoneyJSON } from '@/lib/api/payment-records';

const STATES: PaymentState[] = ['INITIATED', 'AUTHORIZED', 'CAPTURED', 'SETTLED', 'FAILED'];
const PAGE_SIZE = 25;

/**
 * Every payment on every property, from the read model.
 *
 * The older revenue view calls each site over HTTP at page load, so a site being down leaves a
 * blank card and the total quietly loses a property. This page reads one derived table instead,
 * which is why it can show history, and why the numbers do not depend on anyone else's uptime.
 */
/**
 * Format an integer minor-unit amount without going through a float.
 *
 * `Number(amount) / 10 ** exponent` is the exact conversion this whole platform removed from
 * the backend; reintroducing it in the UI would put the drift back at the last hop.
 */
function formatMinor({ amount, currency, exponent }: MoneyJSON): string {
  const negative = amount.startsWith('-');
  const digits = (negative ? amount.slice(1) : amount).padStart(exponent + 1, '0');
  const whole = digits.slice(0, digits.length - exponent) || '0';
  const fraction = exponent > 0 ? `.${digits.slice(digits.length - exponent)}` : '';
  const grouped = currency === 'INR'
    ? (whole.length > 3
        ? `${whole.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${whole.slice(-3)}`
        : whole)
    : whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${negative ? '-' : ''}${currency} ${grouped}${fraction}`;
}

function SiteCard({ site }: { site: SiteSummary }) {
  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-medium">{site.siteName}</CardTitle>
          <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wide">{site.siteId}</span>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        {site.totals.map((t) => (
          <div key={t.money.currency} className="space-y-1">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[11px] text-muted-foreground uppercase tracking-wide">Gross</span>
              <span className="font-mono text-sm font-semibold tabular-nums">{t.display}</span>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[11px] text-muted-foreground uppercase tracking-wide">Processor fees</span>
              <span className="font-mono text-xs tabular-nums text-muted-foreground">{t.feesDisplay}</span>
            </div>
            <div className="flex items-baseline justify-between gap-2 border-t pt-1">
              <span className="text-[11px] font-medium uppercase tracking-wide">Net</span>
              <span className="font-mono text-sm font-semibold tabular-nums">{t.netDisplay}</span>
            </div>
            {/* A partial figure is labelled rather than presented as complete: some payments
                have no fee reported yet, so the net is a floor, not the final number. */}
            {t.feeCoverage === 'partial' && (
              <p className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-500">
                <AlertTriangle className="h-3 w-3 shrink-0" />
                Net is partial — {t.paymentsMissingFee} of {t.paymentCount} payments have no fee reported yet
              </p>
            )}
            <p className="text-[11px] text-muted-foreground">
              {t.paymentCount} payment{t.paymentCount === 1 ? '' : 's'}
              {t.lastPaymentAt ? ` · last ${formatDate(t.lastPaymentAt)}` : ''}
            </p>
          </div>
        ))}
        {site.rails.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {site.rails.map((r) => (
              <Badge key={r} variant="secondary" className="font-mono text-[10px]">{r}</Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function PaymentRecordsPage() {
  const { setBreadcrumbs } = useUIStore();
  const [page, setPage] = useState(1);
  const [siteFilter, setSiteFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');

  const { data: summary, isLoading: summaryLoading } = usePaymentRecordsSummary();
  const { data, isLoading } = usePaymentRecords({
    siteId: siteFilter || undefined,
    state: (stateFilter || undefined) as PaymentState | undefined,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });

  useEffect(() => {
    setBreadcrumbs([{ label: 'Payments', href: '/payments' }, { label: 'All properties' }]);
  }, [setBreadcrumbs]);

  const sites = summary?.sites ?? [];

  const columns: ColumnDef<PaymentRecordRow>[] = useMemo(() => [
    {
      accessorKey: 'siteName',
      header: 'Property',
      cell: ({ row }) => (
        <div>
          <p className="text-sm font-medium">{row.original.siteName}</p>
          {row.original.tenantId && (
            <p className="font-mono text-[11px] text-muted-foreground">{row.original.tenantId}</p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'amountDisplay',
      header: 'Amount',
      cell: ({ row }) => (
        <div className="text-right">
          <p className="font-mono text-sm font-semibold tabular-nums">{row.original.amountDisplay}</p>
          {/* Net only appears when the fee is actually known — an absent fee is never shown as
              zero, because that would read as "no fee" rather than "not reported yet". */}
          {row.original.net && (
            <p className="font-mono text-[11px] text-muted-foreground tabular-nums">
              {formatMinor(row.original.net)} net of fees
            </p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'state',
      header: 'State',
      cell: ({ row }) => <StatusBadge status={row.original.state.toLowerCase()} />,
    },
    {
      accessorKey: 'rail',
      header: 'Rail',
      cell: ({ row }) => (
        <div>
          <Badge variant="secondary" className="font-mono text-[10px]">{row.original.rail}</Badge>
          <p className="font-mono text-[11px] text-muted-foreground mt-0.5">{row.original.provider}</p>
        </div>
      ),
    },
    {
      accessorKey: 'occurredAt',
      header: 'When',
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{formatDate(row.original.occurredAt)}</span>,
    },
    {
      accessorKey: 'paymentId',
      header: 'Reference',
      cell: ({ row }) => (
        <div>
          <p className="font-mono text-[11px] text-muted-foreground">{row.original.paymentId}</p>
          {row.original.orderRef && (
            <p className="font-mono text-[11px] text-muted-foreground/60">{row.original.orderRef}</p>
          )}
        </div>
      ),
    },
  ], []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments across every property"
        description="Read from the platform payment record, not fetched from each site — so the figures survive a property being unreachable, and history is available."
      />

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Globe className="h-4 w-4" />
          By property
        </h2>
        {summaryLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-40" />)}
          </div>
        ) : sites.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No payments recorded yet. Properties report onto the spine once PAYMENT_SPINE is enabled for them.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sites.map((s) => <SiteCard key={s.siteId} site={s} />)}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={siteFilter || 'all'} onValueChange={(v) => { setSiteFilter(v === 'all' ? '' : v); setPage(1); }}>
            <SelectTrigger className="w-52"><SelectValue placeholder="All properties" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All properties</SelectItem>
              {sites.map((s) => <SelectItem key={s.siteId} value={s.siteId}>{s.siteName}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={stateFilter || 'all'} onValueChange={(v) => { setStateFilter(v === 'all' ? '' : v); setPage(1); }}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Any state" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any state</SelectItem>
              {STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <DataTable
          columns={columns}
          data={data?.payments ?? []}
          isLoading={isLoading}
          pageSize={PAGE_SIZE}
          page={page}
          totalCount={data?.total ?? 0}
          onPageChange={setPage}
        />
      </section>
    </div>
  );
}
