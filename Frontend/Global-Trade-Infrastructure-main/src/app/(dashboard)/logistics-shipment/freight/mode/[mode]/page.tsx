'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useFreightQuotes, useFreightBookings, useCarriers } from '@/api';
import type { TransportMode } from '@/api/freight-carriers';
import { FreightNavTabs } from '../../_components/freight-nav-tabs';
import { modeMeta, BOOKING_STATUS_COLORS, QUOTE_STATUS_COLORS } from '../../_components/mode-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function FreightModePage() {
  const params = useParams<{ mode: string }>();
  const mode = params.mode;
  const meta = modeMeta(mode);
  const transportMode = mode as TransportMode;

  const { data: quotesPage } = useFreightQuotes({});
  const { data: bookingsPage } = useFreightBookings({});
  const { data: carriersPage } = useCarriers({ status: 'active' });

  const quotes = (quotesPage?.items ?? []).filter((q) => q.transportMode === transportMode);
  const bookings = (bookingsPage?.items ?? []).filter((b) => b.mode === transportMode);
  const carriers = (carriersPage?.items ?? []).filter((c) => Array.isArray(c.modes) && c.modes.includes(transportMode));

  return (
    <main className="flex-1 space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <meta.icon className={cn('h-7 w-7', meta.color)} />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{meta.label}</h1>
            <p className="text-sm text-muted-foreground">Quotes, bookings and carriers scoped to {meta.label.toLowerCase()}.</p>
          </div>
        </div>
        <Link href={`/logistics-shipment/freight/quotes/new?mode=${transportMode}`}>
          <Button size="sm"><Plus className="h-4 w-4 mr-1" /> New {meta.label} Quote</Button>
        </Link>
      </div>

      <FreightNavTabs />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="shadow-none border">
          <CardHeader className="pb-2"><CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Quotes</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{quotes.length}</div></CardContent>
        </Card>
        <Card className="shadow-none border">
          <CardHeader className="pb-2"><CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Bookings</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{bookings.length}</div></CardContent>
        </Card>
        <Card className="shadow-none border">
          <CardHeader className="pb-2"><CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Eligible Carriers</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{carriers.length}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">{meta.label} Quotes</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {quotes.length === 0 && <p className="text-sm text-muted-foreground py-6 text-center">No {meta.label.toLowerCase()} quotes yet.</p>}
          {quotes.map((q) => (
            <Link key={q.id} href={`/logistics-shipment/freight/quotes/${q.id}`} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/40 transition-colors">
              <div>
                <p className="text-xs font-bold">{q.origin?.country ?? '?'} → {q.destination?.country ?? '?'}</p>
                <p className="text-[10px] text-muted-foreground">{q.items?.length ?? 0} carrier option{q.items?.length === 1 ? '' : 's'}</p>
              </div>
              <Badge variant="outline" className={cn('text-[9px] capitalize', QUOTE_STATUS_COLORS[q.status])}>{q.status}</Badge>
            </Link>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">{meta.label} Bookings</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {bookings.length === 0 && <p className="text-sm text-muted-foreground py-6 text-center">No {meta.label.toLowerCase()} bookings yet.</p>}
          {bookings.map((b) => (
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

      <Card>
        <CardHeader><CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Carriers Serving {meta.label}</CardTitle></CardHeader>
        <CardContent>
          {carriers.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No carrier in the directory currently lists {meta.label.toLowerCase()} as a supported mode.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {carriers.map((c) => (
                <Link key={c.id} href={`/logistics-shipment/freight/carriers/manage/${c.id}`} className="p-3 rounded-lg border hover:bg-muted/40 transition-colors">
                  <p className="text-xs font-bold truncate">{c.name}</p>
                  <p className="text-[10px] text-muted-foreground">{c.rating != null ? `★ ${c.rating.toFixed(1)}` : 'Unrated'}</p>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
