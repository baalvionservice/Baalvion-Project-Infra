'use client';

import { useParams, useRouter } from 'next/navigation';
import { useFreightBooking, useFreightBookingEvents, useRetryFreightBooking, useCancelFreightBooking } from '@/api';
import { FreightNavTabs } from '../../_components/freight-nav-tabs';
import { BOOKING_STATUS_COLORS, modeMeta } from '../../_components/mode-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, RotateCcw, XCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function FreightBookingDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const { data: booking, isLoading } = useFreightBooking(params.id);
  const { data: events } = useFreightBookingEvents(params.id);
  const retry = useRetryFreightBooking();
  const cancel = useCancelFreightBooking();

  if (isLoading) return <main className="p-6"><p className="text-sm text-muted-foreground">Loading booking…</p></main>;
  if (!booking) return <main className="p-6"><p className="text-sm text-muted-foreground">Booking not found.</p></main>;

  const meta = modeMeta(booking.mode);
  const isTerminal = ['delivered', 'cancelled'].includes(booking.status);

  const handleRetry = async () => {
    await retry.mutateAsync(booking.id);
    toast({ title: 'Booking retry triggered' });
  };
  const handleCancel = async () => {
    await cancel.mutateAsync({ id: booking.id });
    toast({ title: 'Booking cancelled' });
  };

  return (
    <main className="flex-1 space-y-6 p-4 md:p-6">
      <Button variant="ghost" size="sm" onClick={() => router.push('/logistics-shipment/freight/bookings')}><ChevronLeft className="h-4 w-4 mr-1" /> All Bookings</Button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2 uppercase">
            {booking.carrier ?? 'Unassigned'} <meta.icon className={cn('h-5 w-5', meta.color)} />
          </h1>
          <p className="text-sm text-muted-foreground font-mono">{booking.tracking_number ?? 'No tracking number yet'}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn('capitalize', BOOKING_STATUS_COLORS[booking.status])}>{booking.status.replace('_', ' ')}</Badge>
          {booking.status === 'failed' && (
            <Button size="sm" variant="outline" onClick={handleRetry} disabled={retry.isPending}>
              {retry.isPending ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5 mr-1" />} Retry
            </Button>
          )}
          {!isTerminal && (
            <Button size="sm" variant="destructive" onClick={handleCancel} disabled={cancel.isPending}>
              <XCircle className="h-3.5 w-3.5 mr-1" /> Cancel
            </Button>
          )}
        </div>
      </div>

      <FreightNavTabs />

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-none border"><CardContent className="p-4"><p className="text-[10px] uppercase text-muted-foreground font-bold">Amount</p><p className="text-lg font-bold">{booking.amount != null ? `${booking.currency} ${booking.amount.toLocaleString()}` : '—'}</p></CardContent></Card>
        <Card className="shadow-none border"><CardContent className="p-4"><p className="text-[10px] uppercase text-muted-foreground font-bold">Service Level</p><p className="text-lg font-bold">{booking.service_level ?? '—'}</p></CardContent></Card>
        <Card className="shadow-none border"><CardContent className="p-4"><p className="text-[10px] uppercase text-muted-foreground font-bold">Chargeable Weight</p><p className="text-lg font-bold">{booking.chargeable_weight_kg ?? '—'} kg</p></CardContent></Card>
        <Card className="shadow-none border"><CardContent className="p-4"><p className="text-[10px] uppercase text-muted-foreground font-bold">Est. Delivery</p><p className="text-lg font-bold">{booking.estimated_delivery ? format(new Date(booking.estimated_delivery), 'MMM d, yyyy') : '—'}</p></CardContent></Card>
      </div>

      {booking.carriers_attempted && booking.carriers_attempted.length > 1 && (
        <Card className="border-amber-200 bg-amber-50/40">
          <CardContent className="p-4 text-xs text-amber-700">
            Carrier fallback occurred — attempted in order: {booking.carriers_attempted.join(' → ')}
          </CardContent>
        </Card>
      )}

      {booking.last_error && (
        <Card className="border-red-200 bg-red-50/40">
          <CardContent className="p-4 text-xs text-red-700">{booking.last_error}</CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Booking Timeline</CardTitle></CardHeader>
        <CardContent>
          {!events || events.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No events recorded yet.</p>
          ) : (
            <div className="space-y-4">
              {events.map((e) => (
                <div key={e.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="h-2.5 w-2.5 rounded-full bg-primary mt-1.5" />
                    <div className="w-px flex-1 bg-border" />
                  </div>
                  <div className="pb-4">
                    <p className="text-xs font-bold capitalize">{e.event_type.replace('_', ' ')} {e.carrier ? `· ${e.carrier}` : ''}</p>
                    <p className="text-[10px] text-muted-foreground">{e.message}</p>
                    <p className="text-[9px] text-muted-foreground mt-0.5">{format(new Date(e.created_at), 'MMM d, yyyy HH:mm')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
