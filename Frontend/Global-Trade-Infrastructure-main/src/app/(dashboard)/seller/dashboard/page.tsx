'use client';

/**
 * @file seller/dashboard/page.tsx
 * @description The seller's home page: money received, orders and deals in progress, and the buyer
 * requests worth answering. Every card loads on its own and every figure comes from records the
 * server returned (see lib/dashboard-derive.ts). Nothing here is estimated or filled in.
 */
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Banknote, Handshake, Inbox, Landmark, PackageCheck, Plus, RefreshCw, Target, Truck, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useResourceList } from '@/hooks/use-resource-list';
import { treasurySyncService } from '@/services/treasury-sync-service';
import {
  activeDealCount, inTransitCount, openRequests, receivedByWeek, receivedTotal, sellerOpenOrderCount,
} from '@/lib/dashboard-derive';
import { formatCurrency } from '@/lib/utils';
import {
  EmptyState, InlineError, PageHeader, Panel, PanelSkeleton, StatCard, StatGrid,
} from '@/components/dashboard/dashboard-kit';

type Status = 'loading' | 'ready' | 'error';
const statusOf = (q: { isLoading: boolean; isError: boolean }): Status => (q.isLoading ? 'loading' : q.isError ? 'error' : 'ready');
const compactMoney = (v: number) => new Intl.NumberFormat('en-US', { notation: 'compact', style: 'currency', currency: 'USD', maximumFractionDigits: 1 }).format(v);

export default function SellerDashboardPage() {
  const { toast } = useToast();
  const [syncing, setSyncing] = useState(false);
  const rfqs = useResourceList('seller', '/rfqs', { status: 'open' });
  const deals = useResourceList('seller', '/deals');
  const orders = useResourceList('seller', '/orders');
  const settlements = useResourceList('seller', '/settlements');
  const shipments = useResourceList('seller', '/shipments');

  const all = [rfqs, deals, orders, settlements, shipments];
  const refreshing = all.some((q) => q.isFetching);
  const refreshAll = () => all.forEach((q) => void q.refetch());

  const weekly = useMemo(() => receivedByWeek(settlements.data ?? []), [settlements.data]);
  const requests = useMemo(() => openRequests(rfqs.data ?? []), [rfqs.data]);

  const refreshBalances = async () => {
    setSyncing(true);
    try {
      const result = await treasurySyncService.resync();
      toast({ title: 'Balances updated', description: `${result.walletCount} wallet${result.walletCount === 1 ? '' : 's'} are up to date.` });
    } catch (err) {
      toast({ variant: 'destructive', title: "Couldn't update balances", description: err instanceof Error ? err.message : 'Please try again in a moment.' });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <main className="space-y-6 pb-8">
      <PageHeader
        title="Your dashboard"
        description="Money received, orders and deals in progress, and the buyer requests you can answer."
        actions={(
          <>
            <Button variant="outline" onClick={() => void refreshBalances()} disabled={syncing} className="min-h-11 w-full sm:w-auto">
              {syncing ? <RefreshCw aria-hidden className="mr-2 h-4 w-4 animate-spin" /> : <Landmark aria-hidden className="mr-2 h-4 w-4" />}
              Update balances
            </Button>
            <Button variant="outline" onClick={refreshAll} disabled={refreshing} className="min-h-11 w-full sm:w-auto">
              <RefreshCw aria-hidden className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
            </Button>
            <Button asChild className="min-h-11 w-full sm:w-auto">
              <Link href="/seller/rfqs"><Plus aria-hidden className="mr-2 h-4 w-4" /> Answer a request</Link>
            </Button>
          </>
        )}
      />

      <StatGrid>
        <StatCard label="Money received" icon={Banknote} tone="text-emerald-500" href="/payments" status={statusOf(settlements)} onRetry={() => void settlements.refetch()}
          value={formatCurrency(receivedTotal(settlements.data ?? []))} hint="From completed payments" />
        <StatCard label="Open orders" icon={PackageCheck} href="/orders" status={statusOf(orders)} onRetry={() => void orders.refetch()}
          value={String(sellerOpenOrderCount(orders.data ?? []))} hint="Waiting to be fulfilled" />
        <StatCard label="Deals in progress" icon={Handshake} tone="text-indigo-500" href="/deals" status={statusOf(deals)} onRetry={() => void deals.refetch()}
          value={String(activeDealCount(deals.data ?? []))} hint="Not finalised yet" />
        <StatCard label="Buyer requests" icon={Inbox} tone="text-blue-500" href="/seller/rfqs" status={statusOf(rfqs)} onRetry={() => void rfqs.refetch()}
          value={String(rfqs.data?.length ?? 0)} hint="You can answer these" />
      </StatGrid>

      <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
        <div className="space-y-4 lg:col-span-2 lg:space-y-6">
          <Panel title="Money received by week" description="Completed payments over the last 8 weeks.">
            {settlements.isLoading && <PanelSkeleton rows={2} />}
            {settlements.isError && <InlineError message="We couldn't load your payments." onRetry={() => void settlements.refetch()} />}
            {settlements.isSuccess && weekly.length === 0 && (
              <EmptyState icon={Banknote} title="No payments received yet" description="When a buyer's payment completes, it will appear here." />
            )}
            {settlements.isSuccess && weekly.length > 0 && (
              <div className="h-56 w-full sm:h-64" role="img" aria-label={`Money received per week. Most recent week: ${formatCurrency(weekly[weekly.length - 1].amount)}.`}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weekly} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" className="opacity-40" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} interval="preserveStartEnd" />
                    <YAxis tickLine={false} axisLine={false} width={52} tick={{ fontSize: 12 }} tickFormatter={compactMoney} />
                    <Tooltip formatter={(v: number) => [formatCurrency(v), 'Received']} labelFormatter={(l) => `Week of ${l}`} cursor={{ fillOpacity: 0.08 }} />
                    <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Panel>

          <Panel title="Buyer requests you can answer" description="The newest open quote requests."
            action={<Button asChild variant="ghost" className="min-h-11 self-start"><Link href="/seller/rfqs">See all <ArrowRight aria-hidden className="ml-1 h-4 w-4" /></Link></Button>}>
            {rfqs.isLoading && <PanelSkeleton />}
            {rfqs.isError && <InlineError message="We couldn't load buyer requests." onRetry={() => void rfqs.refetch()} />}
            {rfqs.isSuccess && requests.length === 0 && (
              <EmptyState icon={Target} title="No open requests right now" description="New buyer requests will appear here as soon as they are posted." />
            )}
            {requests.length > 0 && (
              <ul className="divide-y">
                {requests.map((r) => (
                  <li key={r.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-base font-medium">{r.title}</p>
                        <Badge variant="secondary">{r.category}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {r.destination ? `Ship to ${r.destination}` : 'Destination not set'}
                        {r.targetValue ? ` · Target ${formatCurrency(r.targetValue)}` : ''}
                      </p>
                    </div>
                    <Button asChild variant="secondary" className="min-h-11 w-full sm:w-auto"><Link href="/seller/rfqs">Make an offer</Link></Button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <div className="space-y-4 lg:space-y-6">
          <Panel title="On the move">
            <ul className="divide-y">
              <li className="flex items-center justify-between gap-3 py-3 first:pt-0">
                <span className="flex items-center gap-3 text-sm"><Truck aria-hidden className="h-5 w-5 text-emerald-500" /> Shipments on the way</span>
                {shipments.isLoading ? <span className="h-5 w-8 animate-pulse rounded bg-muted" /> : shipments.isError
                  ? <button type="button" onClick={() => void shipments.refetch()} className="min-h-11 text-sm font-medium text-primary underline-offset-4 hover:underline">Try again</button>
                  : <span className="text-base font-semibold tabular-nums">{inTransitCount(shipments.data ?? [])}</span>}
              </li>
              <li className="flex items-center justify-between gap-3 py-3 last:pb-0">
                <span className="flex items-center gap-3 text-sm"><PackageCheck aria-hidden className="h-5 w-5 text-primary" /> Orders in total</span>
                {orders.isLoading ? <span className="h-5 w-8 animate-pulse rounded bg-muted" /> : orders.isError
                  ? <button type="button" onClick={() => void orders.refetch()} className="min-h-11 text-sm font-medium text-primary underline-offset-4 hover:underline">Try again</button>
                  : <span className="text-base font-semibold tabular-nums">{orders.data?.length ?? 0}</span>}
              </li>
            </ul>
          </Panel>
        </div>
      </div>
    </main>
  );
}
