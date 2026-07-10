'use client';

import { useMemo } from 'react';
import { useFreightBookings, useFreightQuotes, useCarriers, useCarrierPerformanceList } from '@/api';
import { FreightNavTabs } from '../_components/freight-nav-tabs';
import { modeMeta } from '../_components/mode-utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatCurrency, cn } from '@/lib/utils';

export default function FreightAnalyticsPage() {
  const { data: bookingsPage } = useFreightBookings({});
  const { data: quotesPage } = useFreightQuotes({});
  const { data: carriersPage } = useCarriers({});
  const { data: performancePage } = useCarrierPerformanceList({});

  const bookings = bookingsPage?.items ?? [];
  const quotes = quotesPage?.items ?? [];
  const carriers = carriersPage?.items ?? [];
  const performance = performancePage?.items ?? [];
  const carriersById = new Map(carriers.map((c) => [c.id, c]));

  const stats = useMemo(() => {
    const totalSpend = bookings.reduce((sum, b) => sum + Number(b.amount || 0), 0);
    const byCarrier = new Map<string, { count: number; spend: number }>();
    bookings.forEach((b) => {
      if (!b.carrier) return;
      const entry = byCarrier.get(b.carrier) ?? { count: 0, spend: 0 };
      entry.count += 1;
      entry.spend += Number(b.amount || 0);
      byCarrier.set(b.carrier, entry);
    });
    const byMode = new Map<string, number>();
    bookings.forEach((b) => { if (b.mode) byMode.set(b.mode, (byMode.get(b.mode) || 0) + Number(b.amount || 0)); });

    const delivered = bookings.filter((b) => b.status === 'delivered');
    const cancelled = bookings.filter((b) => b.status === 'cancelled');
    const failed = bookings.filter((b) => b.status === 'failed');

    const quoteConversion = quotes.length ? (quotes.filter((q) => q.status === 'converted').length / quotes.length) * 100 : 0;
    const avgQuoteAmount = quotes.length
      ? quotes.reduce((sum, q) => sum + (q.items?.length ? Math.min(...q.items.map((i) => i.totalAmount)) : 0), 0) / quotes.length
      : 0;

    return {
      totalSpend,
      byCarrier: [...byCarrier.entries()].sort((a, b) => b[1].spend - a[1].spend),
      byMode: [...byMode.entries()].sort((a, b) => b[1] - a[1]),
      deliveredCount: delivered.length,
      cancelledCount: cancelled.length,
      failedCount: failed.length,
      quoteConversion,
      avgQuoteAmount,
    };
  }, [bookings, quotes]);

  const maxCarrierSpend = Math.max(1, ...stats.byCarrier.map(([, v]) => v.spend));
  const maxModeSpend = Math.max(1, ...stats.byMode.map(([, v]) => v));

  return (
    <main className="flex-1 space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Freight Analytics</h1>
        <p className="text-sm text-muted-foreground">Cost, carrier and conversion analytics computed from live quotes, bookings and performance data.</p>
      </div>

      <FreightNavTabs />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-none border"><CardContent className="p-4"><p className="text-[10px] uppercase text-muted-foreground font-bold">Total Freight Spend</p><p className="text-xl font-bold">{formatCurrency(stats.totalSpend)}</p></CardContent></Card>
        <Card className="shadow-none border"><CardContent className="p-4"><p className="text-[10px] uppercase text-muted-foreground font-bold">Quote → Booking</p><p className="text-xl font-bold">{stats.quoteConversion.toFixed(0)}%</p></CardContent></Card>
        <Card className="shadow-none border"><CardContent className="p-4"><p className="text-[10px] uppercase text-muted-foreground font-bold">Avg Best Quote</p><p className="text-xl font-bold">{formatCurrency(stats.avgQuoteAmount)}</p></CardContent></Card>
        <Card className="shadow-none border"><CardContent className="p-4"><p className="text-[10px] uppercase text-muted-foreground font-bold">Delivered / Cancelled / Failed</p><p className="text-xl font-bold">{stats.deliveredCount} / {stats.cancelledCount} / {stats.failedCount}</p></CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Spend by Carrier</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {stats.byCarrier.length === 0 && <p className="text-sm text-muted-foreground py-6 text-center">No booked spend yet.</p>}
            {stats.byCarrier.map(([carrier, v]) => (
              <div key={carrier} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold uppercase">{carrier}</span>
                  <span className="text-muted-foreground">{formatCurrency(v.spend)} · {v.count} booking{v.count === 1 ? '' : 's'}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary" style={{ width: `${(v.spend / maxCarrierSpend) * 100}%` }} /></div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Spend by Mode</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {stats.byMode.length === 0 && <p className="text-sm text-muted-foreground py-6 text-center">No booked spend yet.</p>}
            {stats.byMode.map(([mode, spend]) => {
              const meta = modeMeta(mode);
              return (
                <div key={mode} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 font-bold"><meta.icon className={cn('h-3.5 w-3.5', meta.color)} /> {meta.label}</span>
                    <span className="text-muted-foreground">{formatCurrency(spend)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary" style={{ width: `${(spend / maxModeSpend) * 100}%` }} /></div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Carrier Performance History</CardTitle>
          <CardDescription>Periodic snapshots from the freight_carrier_performance_refresh job.</CardDescription>
        </CardHeader>
        <CardContent>
          {performance.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No performance snapshots yet — the daily refresh job populates this after the first booking period completes.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {performance.map((p) => (
                <div key={p.id} className="p-3 rounded-lg border text-xs space-y-1">
                  <p className="font-bold">{carriersById.get(p.carrierId)?.name ?? p.carrierId}</p>
                  <p className="text-muted-foreground">On-time: {p.onTimePct != null ? `${p.onTimePct.toFixed(0)}%` : '—'}</p>
                  <p className="text-muted-foreground">ETA accuracy: {p.etaAccuracyPct != null ? `${p.etaAccuracyPct.toFixed(0)}%` : '—'}</p>
                  <p className="text-muted-foreground">Bookings: {p.bookingsCount}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
