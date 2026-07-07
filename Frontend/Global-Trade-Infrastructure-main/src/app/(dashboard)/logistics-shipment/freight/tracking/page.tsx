'use client';

import { useState } from 'react';
import { useFreightBookings, useFreightBookingEvents } from '@/api';
import { FreightNavTabs } from '../_components/freight-nav-tabs';
import { BOOKING_STATUS_COLORS, modeMeta } from '../_components/mode-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const STATUS_LADDER = ['booking', 'booked', 'confirmed', 'in_transit', 'delivered'];

export default function FreightTrackingPage() {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data } = useFreightBookings({}, { poll: true });
  const bookings = (data?.items ?? []).filter((b) =>
    !search || b.tracking_number?.toLowerCase().includes(search.toLowerCase()) || b.carrier?.toLowerCase().includes(search.toLowerCase()),
  );
  const selected = bookings.find((b) => b.id === selectedId) ?? bookings[0];
  const { data: events } = useFreightBookingEvents(selected?.id);
  const stepIndex = selected ? STATUS_LADDER.indexOf(selected.status) : -1;

  return (
    <main className="flex-1 space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Freight Tracking</h1>
        <p className="text-sm text-muted-foreground">Live status + event history for any freight booking, by tracking number or carrier.</p>
      </div>

      <FreightNavTabs />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search tracking # or carrier…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Active Bookings</CardTitle></CardHeader>
          <CardContent className="p-0 max-h-[480px] overflow-y-auto">
            {bookings.length === 0 && <p className="text-sm text-muted-foreground py-6 text-center px-4">No bookings found.</p>}
            {bookings.map((b) => {
              const meta = modeMeta(b.mode);
              return (
                <button
                  key={b.id}
                  onClick={() => setSelectedId(b.id)}
                  className={cn('w-full flex items-center justify-between p-3 border-b text-left hover:bg-muted/40 transition-colors', selected?.id === b.id && 'bg-muted/60')}
                >
                  <div className="flex items-center gap-2">
                    <meta.icon className={cn('h-4 w-4', meta.color)} />
                    <div><p className="text-xs font-bold uppercase">{b.carrier ?? 'Unassigned'}</p><p className="text-[10px] text-muted-foreground font-mono">{b.tracking_number ?? '—'}</p></div>
                  </div>
                  <Badge variant="outline" className={cn('text-[8px] capitalize', BOOKING_STATUS_COLORS[b.status])}>{b.status.replace('_', ' ')}</Badge>
                </button>
              );
            })}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          {!selected ? (
            <CardContent className="py-16 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
              <Package className="h-8 w-8 text-muted-foreground/40" />
              Select a booking to see its live tracking.
            </CardContent>
          ) : (
            <>
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">{selected.carrier?.toUpperCase() ?? 'Unassigned'} · {selected.tracking_number ?? 'No tracking number'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {selected.status === 'failed' || selected.status === 'cancelled' ? (
                  <Badge variant="destructive" className="capitalize">{selected.status}</Badge>
                ) : (
                  <div className="relative flex justify-between px-2">
                    <div className="absolute top-4 left-0 w-full h-0.5 bg-muted" />
                    <div className="absolute top-4 left-0 h-0.5 bg-primary transition-all" style={{ width: `${Math.max(0, (stepIndex / (STATUS_LADDER.length - 1)) * 100)}%` }} />
                    {STATUS_LADDER.map((s, i) => (
                      <div key={s} className="relative z-10 flex flex-col items-center gap-2">
                        <div className={cn('h-8 w-8 rounded-full border-2 flex items-center justify-center text-[10px] font-bold', i <= stepIndex ? 'border-primary bg-primary text-primary-foreground' : 'border-muted bg-background text-muted-foreground')}>{i + 1}</div>
                        <span className={cn('text-[9px] uppercase font-bold text-center', i <= stepIndex ? 'text-primary' : 'text-muted-foreground')}>{s.replace('_', ' ')}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-3 pt-4 border-t">
                  {!events || events.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No events recorded yet.</p>
                  ) : (
                    events.map((e) => (
                      <div key={e.id} className="flex justify-between text-xs">
                        <span className="capitalize font-bold">{e.event_type.replace('_', ' ')}</span>
                        <span className="text-muted-foreground">{format(new Date(e.created_at), 'MMM d, HH:mm')}</span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </main>
  );
}
