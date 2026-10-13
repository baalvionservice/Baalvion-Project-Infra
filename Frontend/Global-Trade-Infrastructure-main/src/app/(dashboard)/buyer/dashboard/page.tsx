'use client';

/**
 * @file buyer/dashboard/page.tsx
 * @description The buyer's home page: what is open, what needs attention, and where to go next.
 * Every card loads on its own, so one slow service never blanks the page, and every number comes
 * from records the server returned (see lib/dashboard-derive.ts).
 */
import Link from 'next/link';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Globe, PackageCheck, Plus, RefreshCw, Truck, Wallet, FileText, Activity, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { adminService } from '@/services/admin-service';
import { useResourceList } from '@/hooks/use-resource-list';
import {
  buyerActivity, inTransitCount, openOrderCount, timeAgo, waitingPaymentCount,
} from '@/lib/dashboard-derive';
import { formatCurrency, getFlag } from '@/lib/utils';
import {
  EmptyState, InlineError, PageHeader, Panel, PanelSkeleton, StatCard, StatGrid,
} from '@/components/dashboard/dashboard-kit';

type Status = 'loading' | 'ready' | 'error';
const statusOf = (q: { isLoading: boolean; isError: boolean }): Status => (q.isLoading ? 'loading' : q.isError ? 'error' : 'ready');

export default function BuyerDashboardPage() {
  const rfqs = useResourceList('buyer', '/rfqs', { status: 'open' });
  const orders = useResourceList('buyer', '/orders');
  const payments = useResourceList('buyer', '/payments');
  const shipments = useResourceList('buyer', '/shipments');
  const countries = useQuery({
    queryKey: ['buyer', 'trade-by-country'],
    queryFn: () => adminService.getTradeHeatmapData(),
    retry: 1,
    staleTime: 30_000,
  });

  const all = [rfqs, orders, payments, shipments];
  const refreshing = all.some((q) => q.isFetching) || countries.isFetching;
  const refreshAll = () => { all.forEach((q) => void q.refetch()); void countries.refetch(); };

  const activity = useMemo(
    () => buyerActivity({ rfqs: rfqs.data ?? [], orders: orders.data ?? [], payments: payments.data ?? [], shipments: shipments.data ?? [] }),
    [rfqs.data, orders.data, payments.data, shipments.data],
  );

  const waiting = waitingPaymentCount(payments.data ?? []);
  const openQuotes = rfqs.data?.length ?? 0;
  const nextSteps: { text: string; href: string; cta: string }[] = [];
  if (rfqs.isSuccess && openQuotes === 0) nextSteps.push({ text: 'Send your first quote request so sellers can start offering.', href: '/buyer/rfqs/new', cta: 'Request a quote' });
  if (payments.isSuccess && waiting > 0) nextSteps.push({ text: `${waiting} payment${waiting === 1 ? ' is' : 's are'} waiting for you.`, href: '/payments', cta: 'Review payments' });
  if (openQuotes > 0) nextSteps.push({ text: `You have ${openQuotes} open quote request${openQuotes === 1 ? '' : 's'}. Check for new offers.`, href: '/buyer/rfqs', cta: 'See offers' });

  const rows = Array.isArray(countries.data) ? countries.data : [];
  const biggest = Math.max(1, ...rows.map((r) => r.volume));

  return (
    <main className="space-y-6 pb-8">
      <PageHeader
        title="Your dashboard"
        description="Your quote requests, orders, payments and shipments in one place."
        actions={(
          <>
            <Button variant="outline" onClick={refreshAll} disabled={refreshing} className="min-h-11 w-full sm:w-auto">
              <RefreshCw aria-hidden className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
            </Button>
            <Button asChild className="min-h-11 w-full sm:w-auto">
              <Link href="/buyer/rfqs/new"><Plus aria-hidden className="mr-2 h-4 w-4" /> Request a quote</Link>
            </Button>
          </>
        )}
      />

      <StatGrid>
        <StatCard label="Open quote requests" icon={FileText} tone="text-blue-500" href="/buyer/rfqs" status={statusOf(rfqs)} onRetry={() => void rfqs.refetch()}
          value={String(openQuotes)} hint="Waiting for seller offers" />
        <StatCard label="Open orders" icon={PackageCheck} href="/orders" status={statusOf(orders)} onRetry={() => void orders.refetch()}
          value={String(openOrderCount(orders.data ?? []))} hint="Being prepared or shipped" />
        <StatCard label="Payments waiting" icon={Wallet} tone="text-amber-500" href="/payments" status={statusOf(payments)} onRetry={() => void payments.refetch()}
          value={String(waiting)} hint="Need your attention" />
        <StatCard label="Shipments on the way" icon={Truck} tone="text-emerald-500" href="/logistics-shipment" status={statusOf(shipments)} onRetry={() => void shipments.refetch()}
          value={String(inTransitCount(shipments.data ?? []))} hint="Track them live" />
      </StatGrid>

      <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
        <div className="space-y-4 lg:col-span-2 lg:space-y-6">
          <Panel title="Where your trade is" description="Order and quote request value by country.">
            {countries.isLoading && <PanelSkeleton />}
            {countries.isError && <InlineError message="We couldn't load your trade by country." onRetry={() => void countries.refetch()} />}
            {countries.isSuccess && rows.length === 0 && (
              <EmptyState icon={Globe} title="No trade yet" description="Once you send a quote request or place an order, you will see it here by country."
                action={<Button asChild className="min-h-11"><Link href="/buyer/rfqs/new">Request a quote</Link></Button>} />
            )}
            {countries.isSuccess && rows.length > 0 && (
              <ul className="space-y-4">
                {rows.map((r) => (
                  <li key={r.country}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span aria-hidden className="text-2xl">{getFlag(r.country)}</span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{r.country}</p>
                          <p className="text-sm text-muted-foreground">
                            {r.activeRfqs} quote request{r.activeRfqs === 1 ? '' : 's'} · {r.activeDeals} deal{r.activeDeals === 1 ? '' : 's'}
                          </p>
                        </div>
                      </div>
                      <p className="shrink-0 text-base font-semibold tabular-nums">{formatCurrency(r.volume)}</p>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted" role="presentation">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(4, (r.volume / biggest) * 100)}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <div className="space-y-4 lg:space-y-6">
          <Panel title="What to do next">
            {nextSteps.length === 0 ? (
              <p className="text-sm text-muted-foreground">You are all caught up.</p>
            ) : (
              <ul className="space-y-4">
                {nextSteps.map((s) => (
                  <li key={s.cta} className="space-y-2">
                    <p className="text-sm">{s.text}</p>
                    <Button asChild variant="secondary" className="min-h-11 w-full sm:w-auto"><Link href={s.href}>{s.cta} <ArrowRight aria-hidden className="ml-2 h-4 w-4" /></Link></Button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Recent activity">
            {[rfqs, orders, payments, shipments].every((q) => q.isLoading) && <PanelSkeleton />}
            {activity.length === 0 && ![rfqs, orders, payments, shipments].every((q) => q.isLoading) && (
              <EmptyState icon={Activity} title="Nothing yet" description="New orders, payments and shipments will show up here." />
            )}
            {activity.length > 0 && (
              <ul className="divide-y">
                {activity.map((a) => (
                  <li key={a.id} className="py-3 first:pt-0 last:pb-0">
                    <p className="text-sm">{a.text}</p>
                    <p className="text-sm text-muted-foreground">{timeAgo(a.at)}</p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </main>
  );
}
