'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useFreightQuotes, useFreightBookings, useCarriers } from '@/api';
import { FreightNavTabs } from './_components/freight-nav-tabs';
import { FreightKpis } from './_components/freight-kpis';
import { MODE_ORDER, modeMeta, BOOKING_STATUS_COLORS } from './_components/mode-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function FreightDashboardPage() {
  const { data: quotesPage, isLoading: quotesLoading } = useFreightQuotes({}, { poll: true });
  const { data: bookingsPage, isLoading: bookingsLoading } = useFreightBookings({}, { poll: true });
  const { data: carriersPage } = useCarriers({ status: 'active' });

  const quotes = quotesPage?.items ?? [];
  const bookings = bookingsPage?.items ?? [];
  const carriers = carriersPage?.items ?? [];

  const stats = useMemo(() => {
    const activeBookings = bookings.filter((b) => !['delivered', 'cancelled', 'failed'].includes(b.status));
    const delivered = bookings.filter((b) => b.status === 'delivered' && b.booked_at && b.completed_at);
    const avgTransitDays = delivered.length
      ? delivered.reduce((sum, b) => sum + (new Date(b.completed_at as string).getTime() - new Date(b.booked_at as string).getTime()) / 86_400_000, 0) / delivered.length
      : null;
    const monthlySpend = bookings
      .filter((b) => b.amount != null && new Date(b.created_at).getMonth() === new Date().getMonth())
      .reduce((sum, b) => sum + Number(b.amount || 0), 0);
    const carrierCounts = new Map<string, number>();
    bookings.forEach((b) => { if (b.carrier) carrierCounts.set(b.carrier, (carrierCounts.get(b.carrier) || 0) + 1); });
    const topCarrier = [...carrierCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    const byMode = new Map<string, number>();
    bookings.forEach((b) => { if (b.mode) byMode.set(b.mode, (byMode.get(b.mode) || 0) + 1); });

    return {
      totalQuotes: quotes.length,
      pendingQuotes: quotes.filter((q) => q.status === 'draft' || q.status === 'quoted').length,
      totalBookings: bookings.length,
      activeBookings: activeBookings.length,
      avgTransitDays,
      monthlySpend,
      topCarrier,
      byMode,
    };
  }, [quotes, bookings]);

  return (
    <main className="flex-1 space-y-6 p-4 md:p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Freight Management</h1>
        <p className="text-sm text-muted-foreground">Ocean, air, rail, truck, courier and multimodal freight — quotes, carriers, bookings and route optimization in one control center.</p>
      </div>

      <FreightNavTabs />

      {quotesLoading || bookingsLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)}
        </div>
      ) : (
        <FreightKpis
          totalQuotes={stats.totalQuotes}
          pendingQuotes={stats.pendingQuotes}
          totalBookings={stats.totalBookings}
          activeBookings={stats.activeBookings}
          avgTransitDays={stats.avgTransitDays}
          monthlySpend={stats.monthlySpend}
          topCarrierName={stats.topCarrier}
        />
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Freight Types</h2>
        <Link href="/logistics-shipment/freight/quotes/new">
          <Button size="sm"><Plus className="h-4 w-4 mr-1" /> New Quote</Button>
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {MODE_ORDER.map((mode) => {
          const meta = modeMeta(mode);
          const count = stats.byMode.get(mode) || 0;
          return (
            <Link key={mode} href={`/logistics-shipment/freight/mode/${mode}`}>
              <Card className="hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer h-full">
                <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                  <meta.icon className={cn('h-6 w-6', meta.color)} />
                  <span className="text-xs font-bold">{meta.label}</span>
                  <span className="text-[10px] text-muted-foreground">{count} booking{count === 1 ? '' : 's'}</span>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Recent Quotes</CardTitle>
            <Link href="/logistics-shipment/freight/quotes" className="text-xs text-primary flex items-center gap-1">View all <ArrowRight className="h-3 w-3" /></Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {quotes.length === 0 && <p className="text-sm text-muted-foreground py-6 text-center">No freight quotes yet.</p>}
            {quotes.slice(0, 5).map((q) => (
              <Link key={q.id} href={`/logistics-shipment/freight/quotes/${q.id}`} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/40 transition-colors">
                <div>
                  <p className="text-xs font-bold">{q.origin?.country ?? '?'} → {q.destination?.country ?? '?'}</p>
                  <p className="text-[10px] text-muted-foreground">{q.items?.length ?? 0} carrier option{q.items?.length === 1 ? '' : 's'}</p>
                </div>
                <Badge variant="outline" className="text-[9px] capitalize">{q.status}</Badge>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Recent Bookings</CardTitle>
            <Link href="/logistics-shipment/freight/bookings" className="text-xs text-primary flex items-center gap-1">View all <ArrowRight className="h-3 w-3" /></Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {bookings.length === 0 && <p className="text-sm text-muted-foreground py-6 text-center">No freight bookings yet.</p>}
            {bookings.slice(0, 5).map((b) => (
              <Link key={b.id} href={`/logistics-shipment/freight/bookings/${b.id}`} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/40 transition-colors">
                <div>
                  <p className="text-xs font-bold uppercase">{b.carrier ?? 'Unassigned'}</p>
                  <p className="text-[10px] text-muted-foreground">{b.tracking_number ?? 'No tracking number yet'}</p>
                </div>
                <Badge variant="outline" className={cn('text-[9px] capitalize', BOOKING_STATUS_COLORS[b.status])}>{b.status.replace('_', ' ')}</Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Active Carrier Directory</CardTitle>
        </CardHeader>
        <CardContent>
          {carriers.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No carriers registered yet. <Link href="/logistics-shipment/freight/carriers/manage" className="text-primary underline">Add one</Link>.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {carriers.slice(0, 8).map((c) => (
                <Link key={c.id} href={`/logistics-shipment/freight/carriers/manage/${c.id}`} className="p-3 rounded-lg border hover:bg-muted/40 transition-colors">
                  <p className="text-xs font-bold truncate">{c.name}</p>
                  <p className="text-[10px] text-muted-foreground">{c.rating != null ? `★ ${c.rating.toFixed(1)}` : 'Unrated'} · {c.reliabilityScore}% reliable</p>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
